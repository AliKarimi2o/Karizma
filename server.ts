import express from "express";
import path from "path";
import fs from "fs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

// Import custom helpers
import { prisma } from "./src/db";
import { askGapGPT } from "./src/ai";
import { sendBaleMessage, handleBaleUpdate, startBalePolling } from "./src/bale";

dotenv.config();

const app = express();
const PORT = 3000;
const JWT_SECRET = process.env.JWT_SECRET || "karizma-project-secret-2026-safe-key";

// Ensure upload directory exists
const UPLOADS_DIR = path.join(process.cwd(), "uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Serve static uploads
app.use("/uploads", express.static(UPLOADS_DIR));

// Express parsing middlewares
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Custom simple logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Auth Authentication Middleware
function authenticate(req: any, res: any, next: any) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "Authorization token required" });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: "Invalid or expired token" });
    }
    req.userId = decoded.userId;
    next();
  });
}

// Global Error Handler wrapper to prevent crashes
function asyncWrapper(fn: Function) {
  return (req: any, res: any, next: any) => {
    fn(req, res, next).catch((err: any) => {
      console.error("API Error:", err);
      res.status(500).json({ error: err.message || "Internal Server Error" });
    });
  };
}

// ==========================================
// 1. AUTHENTICATION & USER API HANDLERS
// ==========================================

app.post("/api/auth/register", asyncWrapper(async (req: any, res: any) => {
  const { phone, password, name } = req.body;

  if (!phone || !password || !name) {
    return res.status(400).json({ error: "Phone description, password, and name are required." });
  }

  const phoneStr = String(phone).trim();
  const existing = await prisma.user.findUnique({ where: { phone: phoneStr } });
  if (existing) {
    return res.status(400).json({ error: "A user with this phone number already exists." });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      phone: phoneStr,
      passwordHash,
      name: name.trim(),
    },
  });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      lang: user.lang,
      darkMode: user.darkMode,
    },
  });
}));

app.post("/api/auth/login", asyncWrapper(async (req: any, res: any) => {
  const { phone, password } = req.body;

  if (!phone || !password) {
    return res.status(400).json({ error: "Phone number and password are required." });
  }

  const user = await prisma.user.findUnique({ where: { phone: String(phone).trim() } });
  if (!user) {
    return res.status(400).json({ error: "Invalid phone number or password." });
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    return res.status(400).json({ error: "Invalid phone number or password." });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });

  res.json({
    token,
    user: {
      id: user.id,
      phone: user.phone,
      name: user.name,
      avatarUrl: user.avatarUrl,
      lang: user.lang,
      darkMode: user.darkMode,
    },
  });
}));

app.get("/api/auth/me", authenticate, asyncWrapper(async (req: any, res: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    include: { baleConnection: true },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  let parsedSkills: string[] = [];
  try {
    parsedSkills = JSON.parse(user.skills || "[]");
  } catch (error) {
    parsedSkills = [];
  }

  res.json({
    id: user.id,
    phone: user.phone,
    name: user.name,
    avatarUrl: user.avatarUrl,
    lang: user.lang,
    darkMode: user.darkMode,
    skills: parsedSkills,
    baleConnected: user.baleConnection?.isVerified || false,
    baleUsername: user.baleConnection?.baleUsername || null,
  });
}));

app.post("/api/auth/logout", (req, res) => {
  res.json({ success: true });
});

app.post("/api/user/upload-avatar", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { filename, fileData } = req.body;

  if (!filename || !fileData) {
    return res.status(400).json({ error: "Filename and fileBase64 data are required." });
  }

  const base64Content = fileData.includes(";base64,") ? fileData.split(";base64,")[1] : fileData;
  const buffer = Buffer.from(base64Content, "base64");

  const hashedFilename = `avatar-${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const filepath = path.join(UPLOADS_DIR, hashedFilename);
  fs.writeFileSync(filepath, buffer);

  const avatarUrl = `/uploads/${hashedFilename}`;

  const updatedUser = await prisma.user.update({
    where: { id: req.userId },
    data: { avatarUrl },
  });

  res.json({ avatarUrl });
}));

app.patch("/api/auth/settings", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { lang, darkMode, name, avatarUrl, skills, password, phone } = req.body;

  let passwordHashUpdate = {};
  if (password && password.trim().length > 0) {
    const hashed = await bcrypt.hash(password, 10);
    passwordHashUpdate = { passwordHash: hashed };
  }

  const updated = await prisma.user.update({
    where: { id: req.userId },
    data: {
      ...(lang !== undefined && { lang }),
      ...(darkMode !== undefined && { darkMode }),
      ...(name !== undefined && { name }),
      ...(avatarUrl !== undefined && { avatarUrl }),
      ...(phone !== undefined && { phone }),
      ...(skills !== undefined && { skills: JSON.stringify(skills) }),
      ...passwordHashUpdate,
    },
  });

  let parsedSkills: string[] = [];
  try {
    parsedSkills = JSON.parse(updated.skills || "[]");
  } catch (error) {
    parsedSkills = [];
  }

  res.json({
    id: updated.id,
    phone: updated.phone,
    name: updated.name,
    avatarUrl: updated.avatarUrl,
    lang: updated.lang,
    darkMode: updated.darkMode,
    skills: parsedSkills,
  });
}));

// ==========================================
// 2. WORKSPACE API HANDLERS
// ==========================================

app.get("/api/workspaces", authenticate, asyncWrapper(async (req: any, res: any) => {
  const memberships = await prisma.workspaceMember.findMany({
    where: { userId: req.userId },
    include: {
      workspace: {
        include: {
          members: {
            include: { user: true },
          },
          tasks: true,
          polls: true,
        },
      },
    },
  });

  const workspaces = memberships.map((m) => m.workspace);
  res.json(workspaces);
}));

app.post("/api/workspaces", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { name, description, category, goal } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Workspace name is required." });
  }

  // Create workspace and add creator as "owner"
  const workspace = await prisma.workspace.create({
    data: {
      name,
      description,
      category: category || "general",
      goal,
      ownerId: req.userId,
      members: {
        create: {
          userId: req.userId,
          role: "owner",
          permissions: JSON.stringify([
            "create_task",
            "edit_task",
            "delete_task",
            "assign_task",
            "invite_member",
            "remove_member",
            "manage_permissions",
            "delete_workspace",
            "create_poll",
            "create_announcement",
            "upload_file",
            "use_ai",
          ]),
        },
      },
    },
    include: {
      members: {
        include: { user: true },
      },
    },
  });

  // Create audit log
  await prisma.activityLog.create({
    data: {
      workspaceId: workspace.id,
      userId: req.userId,
      action: "WORKSPACE_CREATED",
      details: `Created workspace "${name}"`,
    },
  });

  res.status(201).json(workspace);
}));

app.get("/api/workspaces/:id", authenticate, asyncWrapper(async (req: any, res: any) => {
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: req.params.id,
      members: { some: { userId: req.userId } },
    },
    include: {
      members: {
        include: { user: true },
      },
      tasks: {
        include: { assignee: true, subtasks: true, comments: { include: { user: true } }, attachments: { include: { user: true } } },
      },
      polls: {
        include: { options: { include: { votes: true } }, votes: true },
      },
      announcements: {
        include: { creator: true },
        orderBy: { createdAt: "desc" },
      },
      chatMessages: {
        include: { user: true },
        orderBy: { createdAt: "asc" },
      },
      attachments: {
        include: { user: true },
      },
    },
  });

  if (!workspace) {
    return res.status(404).json({ error: "Workspace not found, or you are not a member." });
  }

  res.json(workspace);
}));

app.patch("/api/workspaces/:id", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { name, description, category, goal } = req.body;

  // Check role & permission to edit
  const member = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: req.params.id, userId: req.userId } },
  });

  if (!member || !["owner", "admin", "manager"].includes(member.role)) {
    return res.status(403).json({ error: "You don't have permission to modify this workspace." });
  }

  const updated = await prisma.workspace.update({
    where: { id: req.params.id },
    data: {
      ...(name !== undefined && { name }),
      ...(description !== undefined && { description }),
      ...(category !== undefined && { category }),
      ...(goal !== undefined && { goal }),
    },
  });

  // Audit log
  await prisma.activityLog.create({
    data: {
      workspaceId: updated.id,
      userId: req.userId,
      action: "WORKSPACE_UPDATED",
      details: `Updated workspace configuration`,
    },
  });

  res.json(updated);
}));

app.delete("/api/workspaces/:id", authenticate, asyncWrapper(async (req: any, res: any) => {
  // Check permission (only Owner or Workspace Creator can delete)
  const workspace = await prisma.workspace.findUnique({
    where: { id: req.params.id },
  });

  if (!workspace) {
    return res.status(404).json({ error: "Workspace not found." });
  }

  if (workspace.ownerId !== req.userId) {
    return res.status(403).json({ error: "Only the workspace owner can delete the workspace." });
  }

  // Audit log first
  await prisma.activityLog.create({
    data: {
      userId: req.userId,
      action: "DELETE_WORKSPACE",
      details: `Deleted workspace: "${workspace.name}"`,
    },
  });

  // Execute cascade delete
  await prisma.workspace.delete({
    where: { id: req.params.id },
  });

  res.json({ success: true, message: "Workspace successfully deleted and local references cleared." });
}));

// ==========================================
// 3. MEMBER MANAGEMENT API HANDLERS
// ==========================================

app.post("/api/workspaces/:id/members", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { phone, role } = req.body;

  // Verify authorization
  const caller = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: req.params.id, userId: req.userId } },
  });

  if (!caller || !["owner", "admin"].includes(caller.role)) {
    return res.status(403).json({ error: "You don't have permission to invite members." });
  }

  // Find user by phone number
  const invitee = await prisma.user.findUnique({
    where: { phone: String(phone).trim() },
  });

  if (!invitee) {
    return res.status(404).json({ error: "User with this phone number was not found. They must register first." });
  }

  // Check if already a member
  const alreadyMember = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: req.params.id, userId: invitee.id } },
  });

  if (alreadyMember) {
    return res.status(400).json({ error: "This user is already a member of this workspace." });
  }

  // Auto configure standard permissions based on role
  let permissions = ["create_task", "edit_task", "upload_file"];
  if (role === "admin") {
    permissions = [
      "create_task",
      "edit_task",
      "delete_task",
      "assign_task",
      "invite_member",
      "remove_member",
      "manage_permissions",
      "create_poll",
      "create_announcement",
      "upload_file",
      "use_ai",
    ];
  } else if (role === "manager") {
    permissions = [
      "create_task",
      "edit_task",
      "assign_task",
      "invite_member",
      "create_poll",
      "create_announcement",
      "upload_file",
      "use_ai",
    ];
  } else if (role === "viewer") {
    permissions = [];
  }

  const memberInstance = await prisma.workspaceMember.create({
    data: {
      workspaceId: req.params.id,
      userId: invitee.id,
      role: role || "member",
      permissions: JSON.stringify(permissions),
    },
    include: { user: true },
  });

  // Notify invitee
  await prisma.notification.create({
    data: {
      userId: invitee.id,
      title: "Workspace Invitation",
      message: `You were added to workspace by ${caller.role}`,
      type: "system",
      link: `/workspace/${req.params.id}`,
    },
  });

  // Send notification to invitee's Bale Bot if connected
  const baleConn = await prisma.baleConnection.findUnique({
    where: { userId: invitee.id },
  });
  if (baleConn && baleConn.isVerified) {
    await sendBaleMessage(
      baleConn.baleChatId,
      `📧 **Workspace Added!**\nYou were joined to the workspace **${req.body.workspaceName || "Karizma Panel"}** with role [${role.toUpperCase()}].`
    );
  }

  // Audit
  await prisma.activityLog.create({
    data: {
      workspaceId: req.params.id,
      userId: req.userId,
      action: "MEMBER_INVITED",
      details: `Invited user ${invitee.name} with role ${role}`,
    },
  });

  res.status(201).json(memberInstance);
}));

app.patch("/api/workspaces/:id/members/:memberId", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { role, permissions } = req.body;

  // Caller permission check
  const caller = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: req.params.id, userId: req.userId } },
  });

  if (!caller || !["owner", "admin"].includes(caller.role)) {
    return res.status(403).json({ error: "Only admins or owners can update member roles." });
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { id: req.params.memberId },
  });

  if (!targetMember) {
    return res.status(404).json({ error: "Member not found." });
  }

  const updated = await prisma.workspaceMember.update({
    where: { id: req.params.memberId },
    data: {
      ...(role !== undefined && { role }),
      ...(permissions !== undefined && { permissions: JSON.stringify(permissions) }),
    },
    include: { user: true },
  });

  // Audit Log
  await prisma.activityLog.create({
    data: {
      workspaceId: req.params.id,
      userId: req.userId,
      action: "MEMBER_ROLE_UPDATED",
      details: `Updated role of member ${updated.user.name} to ${role}`,
    },
  });

  res.json(updated);
}));

app.delete("/api/workspaces/:id/members/:memberId", authenticate, asyncWrapper(async (req: any, res: any) => {
  const caller = await prisma.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId: req.params.id, userId: req.userId } },
  });

  if (!caller || !["owner", "admin"].includes(caller.role)) {
    return res.status(403).json({ error: "Only owners or admins can remove members." });
  }

  const targetMember = await prisma.workspaceMember.findUnique({
    where: { id: req.params.memberId },
    include: { user: true },
  });

  if (!targetMember) {
    return res.status(404).json({ error: "Member not found." });
  }

  if (targetMember.role === "owner") {
    return res.status(400).json({ error: "Cannot remove the owner of the workspace." });
  }

  await prisma.workspaceMember.delete({
    where: { id: req.params.memberId },
  });

  // Log action
  await prisma.activityLog.create({
    data: {
      workspaceId: req.params.id,
      userId: req.userId,
      action: "MEMBER_REMOVED",
      details: `Removed member ${targetMember.user.name}`,
    },
  });

  res.json({ success: true, message: "Member successfully removed." });
}));

// ==========================================
// 4. TASK API HANDLERS (PERSONAL & TEAM)
// ==========================================

app.get("/api/tasks/personal", authenticate, asyncWrapper(async (req: any, res: any) => {
  const tasks = await prisma.task.findMany({
    where: { creatorId: req.userId, isPersonal: true },
    include: { subtasks: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(tasks);
}));

app.post("/api/tasks", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { title, description, priority, deadline, isPersonal, workspaceId, assigneeId, subtasks, tags, startDate, estimatedDuration } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Title is required for task creation." });
  }

  // Create task payload
  const task = await prisma.task.create({
    data: {
      title,
      description,
      priority: priority || "medium",
      status: "todo",
      deadline: deadline ? new Date(deadline) : null,
      startDate: startDate ? new Date(startDate) : null,
      estimatedDuration: estimatedDuration ? parseInt(estimatedDuration) : null,
      isPersonal: !!isPersonal,
      workspaceId: !isPersonal ? workspaceId : null,
      creatorId: req.userId,
      assigneeId: !isPersonal ? assigneeId : null,
      tags: tags ? JSON.stringify(tags) : "[]",
      subtasks: {
        create: subtasks ? subtasks.map((txt: string) => ({ title: txt, isCompleted: false })) : [],
      },
    },
    include: {
      subtasks: true,
      assignee: true,
    },
  });

  // Notifications
  if (!isPersonal && assigneeId && assigneeId !== req.userId) {
    await prisma.notification.create({
      data: {
        userId: assigneeId,
        title: "New Task Assigned",
        message: `Task: "${title}" has been assigned to you.`,
        type: "task",
        link: `/workspace/${workspaceId}`,
      },
    });

    const baleConn = await prisma.baleConnection.findUnique({
      where: { userId: assigneeId },
    });
    if (baleConn && baleConn.syncAssignments && baleConn.isVerified) {
      await sendBaleMessage(
        baleConn.baleChatId,
        `📌 **New Task Assigned / کار جدید محول شد**\n\n📝 **Title:** ${title}\n🚨 **Priority:** ${priority?.toUpperCase()}\n📅 **Deadline:** ${deadline ? new Date(deadline).toLocaleDateString() : "None"}`
      );
    }
  }

  // If team workspace task, audit log
  if (!isPersonal && workspaceId) {
    await prisma.activityLog.create({
      data: {
        workspaceId,
        userId: req.userId,
        action: "CREATE_TASK",
        details: `Created task "${title}"`,
      },
    });
  }

  res.status(201).json(task);
}));

app.patch("/api/tasks/:taskId", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { title, description, priority, status, deadline, assigneeId, progress, tags, subtasks, startDate, estimatedDuration } = req.body;

  const currentTask = await prisma.task.findUnique({
    where: { id: req.params.taskId },
  });

  if (!currentTask) {
    return res.status(404).json({ error: "Task not found." });
  }

  // Prepare completed date on completion status change
  let actualCompletionDate = currentTask.actualCompletionDate;
  if (status === "done" && currentTask.status !== "done") {
    actualCompletionDate = new Date();
  } else if (status && status !== "done") {
    actualCompletionDate = null;
  }

  // Sync subtask closures if subtasks are explicitly sent as array object
  if (subtasks && Array.isArray(subtasks)) {
    // delete previous and rewrite or update individually. Let's do simple reset update for simplicity
    await prisma.subtask.deleteMany({ where: { taskId: req.params.taskId } });
    await prisma.subtask.createMany({
      data: subtasks.map((s: any) => ({
        taskId: req.params.taskId,
        title: s.title,
        isCompleted: !!s.isCompleted,
      })),
    });
  }

  const updated = await prisma.task.update({
    where: { id: req.params.taskId },
    data: {
      ...(title !== undefined && { title }),
      ...(description !== undefined && { description }),
      ...(priority !== undefined && { priority }),
      ...(status !== undefined && { status }),
      ...(deadline !== undefined && { deadline: deadline ? new Date(deadline) : null }),
      ...(assigneeId !== undefined && { assigneeId }),
      ...(progress !== undefined && { progress: parseInt(progress) }),
      ...(tags !== undefined && { tags: JSON.stringify(tags) }),
      ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
      ...(estimatedDuration !== undefined && { estimatedDuration: parseInt(estimatedDuration) }),
      actualCompletionDate,
    },
    include: {
      subtasks: true,
      assignee: true,
    },
  });

  // Notify assignee on state changes
  if (updated.assigneeId && updated.assigneeId !== req.userId && status && status !== currentTask.status) {
    await prisma.notification.create({
      data: {
        userId: updated.assigneeId,
        title: "Task Status Updated",
        message: `Your task "${updated.title}" changed status to ${status.toUpperCase()}`,
        type: "task",
        link: updated.workspaceId ? `/workspace/${updated.workspaceId}` : undefined,
      },
    });

    const baleConn = await prisma.baleConnection.findUnique({
      where: { userId: updated.assigneeId },
    });
    if (baleConn && baleConn.syncAssignments && baleConn.isVerified) {
      await sendBaleMessage(
        baleConn.baleChatId,
        `🔔 **Task Updated / بروزرسانی کار**\n\n📌 **Task:** ${updated.title}\n🔄 **Status:** ${status.toUpperCase()}\n📈 **Progress:** ${updated.progress}%`
      );
    }
  }

  // Audit
  if (updated.workspaceId) {
    await prisma.activityLog.create({
      data: {
        workspaceId: updated.workspaceId,
        userId: req.userId,
        action: "UPDATE_TASK",
        details: `Updated task "${updated.title}" - priority: ${updated.priority}, status: ${updated.status}`,
      },
    });
  }

  res.json(updated);
}));

app.delete("/api/tasks/:taskId", authenticate, asyncWrapper(async (req: any, res: any) => {
  const task = await prisma.task.findUnique({
    where: { id: req.params.taskId },
  });

  if (!task) {
    return res.status(404).json({ error: "Task not found" });
  }

  await prisma.task.delete({
    where: { id: req.params.taskId },
  });

  if (task.workspaceId) {
    await prisma.activityLog.create({
      data: {
        workspaceId: task.workspaceId,
        userId: req.userId,
        action: "DELETE_TASK",
        details: `Deleted task "${task.title}"`,
      },
    });
  }

  res.json({ success: true, message: "Task successfully deleted." });
}));

// Comments endpoints
app.post("/api/tasks/:taskId/comments", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Comment text cannot be empty." });
  }

  const comment = await prisma.comment.create({
    data: {
      taskId: req.params.taskId,
      userId: req.userId,
      text,
    },
    include: {
      user: true,
    },
  });

  // Notify assignee if caller is not the assignee
  const task = await prisma.task.findUnique({ where: { id: req.params.taskId } });
  if (task && task.assigneeId && task.assigneeId !== req.userId) {
    await prisma.notification.create({
      data: {
        userId: task.assigneeId,
        title: "New Task Comment",
        message: `Someone commented on task "${task.title}": "${text.substring(0, 30)}..."`,
        type: "task",
        link: task.workspaceId ? `/workspace/${task.workspaceId}` : undefined,
      },
    });

    const baleConn = await prisma.baleConnection.findUnique({
      where: { userId: task.assigneeId },
    });
    if (baleConn && baleConn.isVerified) {
      await sendBaleMessage(
        baleConn.baleChatId,
        `💬 **New Comment / نظر جدید**\n\n📌 **Task:** ${task.title}\n👤 **By User:** ${comment.user.name}\n💬 **Text:** ${text}`
      );
    }
  }

  res.status(201).json(comment);
}));

// ==========================================
// 5. REMINDERS API HANDLERS
// ==========================================

app.get("/api/reminders", authenticate, asyncWrapper(async (req: any, res: any) => {
  const reminders = await prisma.reminder.findMany({
    where: { userId: req.userId },
    orderBy: { dueTime: "asc" },
  });
  res.json(reminders);
}));

app.post("/api/reminders", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { title, description, dueTime } = req.body;

  if (!title || !dueTime) {
    return res.status(400).json({ error: "Title and dueTime are required." });
  }

  const reminder = await prisma.reminder.create({
    data: {
      userId: req.userId,
      title,
      description,
      dueTime: new Date(dueTime),
    },
  });

  res.status(201).json(reminder);
}));

app.patch("/api/reminders/:id/toggle", authenticate, asyncWrapper(async (req: any, res: any) => {
  const current = await prisma.reminder.findUnique({ where: { id: req.params.id } });
  if (!current || current.userId !== req.userId) {
    return res.status(404).json({ error: "Reminder not found." });
  }

  const updated = await prisma.reminder.update({
    where: { id: req.params.id },
    data: { isCompleted: !current.isCompleted },
  });

  res.json(updated);
}));

app.delete("/api/reminders/:id", authenticate, asyncWrapper(async (req: any, res: any) => {
  const current = await prisma.reminder.findUnique({ where: { id: req.params.id } });
  if (!current || current.userId !== req.userId) {
    return res.status(404).json({ error: "Reminder not found." });
  }

  await prisma.reminder.delete({ where: { id: req.params.id } });
  res.json({ success: true });
}));

// ==========================================
// 6. NOTIFICATIONS API HANDLERS
// ==========================================

app.get("/api/notifications", authenticate, asyncWrapper(async (req: any, res: any) => {
  const notifications = await prisma.notification.findMany({
    where: { userId: req.userId },
    orderBy: { createdAt: "desc" },
    take: 40,
  });
  res.json(notifications);
}));

app.patch("/api/notifications/:id/read", authenticate, asyncWrapper(async (req: any, res: any) => {
  const updated = await prisma.notification.update({
    where: { id: req.params.id, userId: req.userId },
    data: { isRead: true },
  });
  res.json(updated);
}));

app.patch("/api/notifications/read-all", authenticate, asyncWrapper(async (req: any, res: any) => {
  await prisma.notification.updateMany({
    where: { userId: req.userId, isRead: false },
    data: { isRead: true },
  });
  res.json({ success: true });
}));

// ==========================================
// 7. POLLS & ANNOUNCEMENTS & CHAT HANDLERS
// ==========================================

app.post("/api/workspaces/:id/polls", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { question, options } = req.body;

  if (!question || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: "A poll question and at least two options are required." });
  }

  const poll = await prisma.poll.create({
    data: {
      workspaceId: req.params.id,
      question,
      creatorId: req.userId,
      options: {
        create: options.map((opt: string) => ({ text: opt })),
      },
    },
    include: {
      options: { include: { votes: true } },
    },
  });

  // Audit Log
  await prisma.activityLog.create({
    data: {
      workspaceId: req.params.id,
      userId: req.userId,
      action: "CREATE_POLL",
      details: `Created new team poll: "${question}"`,
    },
  });

  res.status(201).json(poll);
}));

app.post("/api/polls/:pollId/vote", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { optionId } = req.body;

  if (!optionId) {
    return res.status(400).json({ error: "OptionId is required to vote." });
  }

  const poll = await prisma.poll.findUnique({
    where: { id: req.params.pollId },
  });

  if (!poll || poll.isClosed) {
    return res.status(400).json({ error: "This poll is either closed or does not exist." });
  }

  // Delete matching vote if already voted to allow toggle/revote cleanly
  await prisma.pollVote.deleteMany({
    where: { pollId: req.params.pollId, userId: req.userId },
  });

  const vote = await prisma.pollVote.create({
    data: {
      pollId: req.params.pollId,
      optionId,
      userId: req.userId,
    },
  });

  res.status(201).json(vote);
}));

app.post("/api/polls/:pollId/close", authenticate, asyncWrapper(async (req: any, res: any) => {
  const poll = await prisma.poll.findUnique({ where: { id: req.params.pollId } });

  if (!poll) {
    return res.status(404).json({ error: "Poll not found" });
  }

  const updated = await prisma.poll.update({
    where: { id: req.params.pollId },
    data: { isClosed: true },
  });

  res.json(updated);
}));

// Announcements
app.post("/api/workspaces/:id/announcements", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { title, content } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: "Title and content are required." });
  }

  const announcement = await prisma.announcement.create({
    data: {
      workspaceId: req.params.id,
      title,
      content,
      creatorId: req.userId,
    },
    include: { creator: true },
  });

  // Audit
  await prisma.activityLog.create({
    data: {
      workspaceId: req.params.id,
      userId: req.userId,
      action: "CREATE_ANNOUNCEMENT",
      details: `Posted announcement: "${title}"`,
    },
  });

  // Dispatch broadcast notices to connected Bale Users
  const members = await prisma.workspaceMember.findMany({
    where: { workspaceId: req.params.id },
    select: { userId: true },
  });

  const memberUserIds = members.map((m) => m.userId);
  const connectedBaleUsers = await prisma.baleConnection.findMany({
    where: { userId: { in: memberUserIds }, isVerified: true, syncAnnouncements: true },
  });

  for (const conn of connectedBaleUsers) {
    await sendBaleMessage(
      conn.baleChatId,
      `📢 **New Workspace Announcement! / اطلاعیه جدید**\n\n📌 **Title:** ${title}\n📝 **Content:** ${content}`
    );
  }

  res.status(201).json(announcement);
}));

// Workspace group Chat Messages
app.post("/api/workspaces/:id/chat", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: "Message content is required." });
  }

  const message = await prisma.chatMessage.create({
    data: {
      workspaceId: req.params.id,
      userId: req.userId,
      text,
    },
    include: { user: true },
  });

  res.status(201).json(message);
}));

// ==========================================
// 8. FILE UPLOAD HANDLER VIA BASE64
// ==========================================

app.post("/api/files/upload-base64", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { filename, fileData, taskId, workspaceId } = req.body;

  if (!filename || !fileData) {
    return res.status(400).json({ error: "Filename and fileBase64 data are required." });
  }

  // Remove data:image/png;base64,... part if present
  const base64Content = fileData.includes(";base64,") ? fileData.split(";base64,")[1] : fileData;
  const buffer = Buffer.from(base64Content, "base64");

  // Save to disk
  const hashedFilename = `${Date.now()}-${filename.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
  const filepath = path.join(UPLOADS_DIR, hashedFilename);
  fs.writeFileSync(filepath, buffer);

  const fileType = filename.split(".").pop() || "unknown";

  const attachment = await prisma.fileAttachment.create({
    data: {
      filename,
      filepath: `/uploads/${hashedFilename}`,
      filetype: fileType,
      filesize: buffer.length,
      taskId: taskId || null,
      workspaceId: workspaceId || null,
      userId: req.userId,
    },
    include: { user: true },
  });

  if (workspaceId) {
    await prisma.activityLog.create({
      data: {
        workspaceId,
        userId: req.userId,
        action: "UPLOAD_FILE",
        details: `Uploaded file attachment "${filename}"`,
      },
    });
  }

  res.status(201).json(attachment);
}));

// ==========================================
// 9. BALE BOT CONNECTION API
// ==========================================

app.get("/api/bale/status", authenticate, asyncWrapper(async (req: any, res: any) => {
  const conn = await prisma.baleConnection.findUnique({
    where: { userId: req.userId },
  });

  res.json({
    connected: conn?.isVerified || false,
    baleChatId: conn?.baleChatId || null,
    baleUsername: conn?.baleUsername || null,
    syncReminders: conn?.syncReminders ?? true,
    syncAssignments: conn?.syncAssignments ?? true,
    syncAnnouncements: conn?.syncAnnouncements ?? true,
    connectionCode: conn?.connectionCode || null,
  });
}));

app.post("/api/bale/connect", authenticate, asyncWrapper(async (req: any, res: any) => {
  // Generate random 6 character code
  const code = Math.floor(100000 + Math.random() * 900000).toString();

  // Create or update bale connection
  await prisma.baleConnection.upsert({
    where: { userId: req.userId },
    update: {
      connectionCode: code,
      isVerified: false,
    },
    create: {
      userId: req.userId,
      baleChatId: `pending-${req.userId}`,
      connectionCode: code,
      isVerified: false,
    },
  });

  res.json({ code });
}));

app.post("/api/bale/disconnect", authenticate, asyncWrapper(async (req: any, res: any) => {
  await prisma.baleConnection.delete({
    where: { userId: req.userId },
  });

  res.json({ success: true });
}));

app.post("/api/bale/send-test", authenticate, asyncWrapper(async (req: any, res: any) => {
  const conn = await prisma.baleConnection.findUnique({
    where: { userId: req.userId },
  });

  if (!conn || !conn.isVerified) {
    return res.status(400).json({ error: "Bale bot is not connected." });
  }

  await sendBaleMessage(
    conn.baleChatId,
    "🔔 **Karizma Test Alert / هشدار آزمایشی کاریزما**\n\nYour Bale account connection is certified and fully synced! Standard system alerts are ready."
  );

  res.json({ success: true });
}));

// Webhook endpoint for Tapi.bale.ai
app.post("/api/bale/webhook", asyncWrapper(async (req: any, res: any) => {
  await handleBaleUpdate(req.body);
  res.json({ ok: true });
}));

// ==========================================
// 10. GAPGPT AI PLATFORM ENDPOINTS
// ==========================================

app.post("/api/ai/chat", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { message, workspaceId } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required to prompt AI." });
  }

  // Load context if workspaceId is present
  let contextPrompt = "";
  if (workspaceId) {
    const ws = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: {
        tasks: { include: { assignee: true } },
        members: { include: { user: true } },
      },
    });

    if (ws) {
      const taskSummaries = ws.tasks.map(
        (t) => `- Title: ${t.title}, Status: ${t.status}, Delegate: ${t.assignee?.name || "None"}, Priority: ${t.priority}, Due: ${t.deadline ? t.deadline.toDateString() : "None"}`
      );
      const members = ws.members.map((m) => `User: ${m.user.name}, Role: ${m.role}`);

      contextPrompt = `
You are Karizma AI, an AI productivity co-pilot inside the workspace "${ws.name}".
The workspace goal is: "${ws.goal || "Generic startup/lab"}"
Here is state metadata for this workspace:
Members:
${members.join("\n")}

Active Kanban/List tasks:
${taskSummaries.join("\n")}

Always deliver helpful summaries, workload advice or prioritized plans. The user is asking: "${message}". Please keep layout beautiful, clean and professional. Avoid markdown-body css container classes since we render directly. Supports full bilingual replies.
`;
    }
  }

  const messages = [
    {
      role: "system",
      content: contextPrompt || "You are Karizma AI, a helpful bilingual SaaS planning assistant for teams.",
    },
    { role: "user", content: message },
  ];

  const answer = await askGapGPT(messages);
  res.json({ answer });
}));

app.post("/api/ai/workspace-summary", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { workspaceId, mode } = req.body; // mode: "summary" | "risks" | "actions" | "report"

  if (!workspaceId) {
    return res.status(400).json({ error: "WorkspaceId is required for AI summary." });
  }

  const ws = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    include: {
      tasks: { include: { assignee: true, subtasks: true } },
      members: { include: { user: true } },
      activityLogs: { take: 15, orderBy: { createdAt: "desc" } },
    },
  });

  if (!ws) {
    return res.status(404).json({ error: "Workspace not found." });
  }

  const taskSummaries = ws.tasks.map(
    (h) => `- Task: ${h.title}\n  Status: ${h.status}\n  Assignee: ${h.assignee?.name || "None"}\n  Priority: ${h.priority}\n  Deadline: ${h.deadline ? h.deadline.toDateString() : "None"}\n  Progress: ${h.progress}%`
  );
  const memberList = ws.members.map((m) => `${m.user.name} (${m.role})`);
  const logs = ws.activityLogs.map((l) => `[${l.createdAt.toLocaleDateString()}] ${l.action}: ${l.details}`);

  let prompt = "";
  if (mode === "risks") {
    prompt = `Analyze this group sprint workspace state for technical risks, resource bottlenecks, or delayed deadlines. 
Workspace: ${ws.name}
Goal: ${ws.goal || "Not specified"}
Members: ${memberList.join(", ")}
Tasks:
${taskSummaries.join("\n")}

Identify overdue tasks, overloaded members, or missing connections. Present key solutions clearly as warning bento boxes, bilingual.`;
  } else if (mode === "actions") {
    prompt = `Reviewing team members and progress, suggest 3 immediate next actionable steps to unblock progress for workspace "${ws.name}".
Goal: ${ws.goal || "Not specified"}
Tasks:
${taskSummaries.join("\n")}

Be highly concrete, e.g. suggesting specific task transfers or milestones.`;
  } else if (mode === "report") {
    prompt = `Generate a beautifully structured, comprehensive progress report for management regarding workspace "${ws.name}".
Summary: ${ws.description}
Goal: ${ws.goal}
Members: ${memberList.join(", ")}
Recent Audit logs:
${logs.join("\n")}
Tasks details:
${taskSummaries.join("\n")}

Present as an elegant corporate summary, including completion rates and highlights.`;
  } else {
    // Mode: summary
    prompt = `Provide a concise high level workspace executive summary for workspace "${ws.name}". 
Description: ${ws.description || "General team panel"}
KPI stats: Total members = ${ws.members.length}, Total tasks = ${ws.tasks.length}. 
Tell the team how they are tracking. Keep it short, powerful, and motivational.`;
  }

  const answer = await askGapGPT([
    { role: "system", content: "You are Karizma AI, an official enterprise performance auditor and senior operations analyst." },
    { role: "user", content: prompt },
  ]);

  res.json({ answer });
}));

app.post("/api/ai/task-breakdown", authenticate, asyncWrapper(async (req: any, res: any) => {
  const { title, description } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Task title is required." });
  }

  const prompt = `Develop a logical checklist of 4 subtasks to fully complete this task:
Task Title: "${title}"
Description: "${description || "None"}"

Response format: Return ONLY a raw JSON string array like ["subtask 1", "subtask 2", "subtask 3"]. No extra conversational speech text around it.`;

  const answerStr = await askGapGPT([
    { role: "system", content: "You are a software engineer parser assistant. Only output raw JSON arrays." },
    { role: "user", content: prompt },
  ]);

  try {
    // Clean string from markdown code blocks
    const cleanJSON = answerStr.trim().replace(/^```json/, "").replace(/```$/, "").trim();
    const array = JSON.parse(cleanJSON);
    if (Array.isArray(array)) {
      return res.json({ subtasks: array });
    }
  } catch (err) {
    console.warn("Failed parsing AI JSON response:", answerStr);
  }

  // Fallback if parsing fails
  res.json({ subtasks: ["Review requirements", "Implement changes", "Perform testing", "Complete review"] });
}));

// ==========================================
// 11. REMINDERS & NOTIFICATION CRON SIMULATION
// ==========================================

setInterval(async () => {
  const now = new Date();
  try {
    // Collect active, unCompleted, due reminders
    const reminders = await prisma.reminder.findMany({
      where: {
        isCompleted: false,
        dueTime: { lt: now },
      },
      include: { user: { include: { baleConnection: true } } },
    });

    for (const rem of reminders) {
      // Create user notification
      await prisma.notification.create({
        data: {
          userId: rem.userId,
          title: "Reminder Alert",
          message: `Your reminder is due: "${rem.title}"`,
          type: "reminder",
        },
      });

      // Match user with Bale Bot
      if (rem.user.baleConnection && rem.user.baleConnection.isVerified && rem.user.baleConnection.syncReminders) {
        await sendBaleMessage(
          rem.user.baleConnection.baleChatId,
          `⏰ **Reminder Alert / یادآور**\n\n📌 **Title:** ${rem.title}\n📝 **Description:** ${rem.description || "None"}`
        );
      }

      // Mark completed/sent
      await prisma.reminder.update({
        where: { id: rem.id },
        data: { isCompleted: true },
      });
    }
  } catch (err) {
    console.error("Cron Reminder Error:", err);
  }
}, 30000); // Checks every 30 seconds

// ==========================================
// 12. VITE DEV SERVER OR STATIC ASSET PRODUCTION SETUP
// ==========================================

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Run direct Bale polling for local / preview dev testing safely
    startBalePolling();
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 Karizma Server running at http://localhost:${PORT}`);
  });
}

startServer();

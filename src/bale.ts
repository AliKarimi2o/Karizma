import axios from "axios";
import { prisma } from "./db.js"; // note relative ESM/CJS transpilation; prisma is in src/db.ts, but wait we placed it in src/db.ts, let's path it properly

/**
 * Sends a message to a user on Bale Messenger Bot
 */
export async function sendBaleMessage(chatId: string | number, text: string): Promise<any> {
  const token = process.env.BALE_BOT_TOKEN;
  if (!token) {
    console.warn("Bale Bot Token is not set. Skipping message dispatch.");
    return null;
  }

  const url = `https://tapi.bale.ai/bot${token}/sendMessage`;
  try {
    const response = await axios.post(
      url,
      {
        chat_id: String(chatId),
        text,
      },
      {
        headers: { "Content-Type": "application/json" },
        timeout: 10000,
      }
    );

    if (response.data && response.data.ok) {
      return response.data.result;
    } else {
      console.error("Bale Response Error Details:", response.data);
      return null;
    }
  } catch (error: any) {
    console.error("Bale Bot Communication Failed:", error?.response?.data || error.message);
    return null;
  }
}

/**
 * Handle incoming updates/messages webhook or long polling from Bale Bot
 */
export async function handleBaleUpdate(update: any) {
  if (!update || !update.message) return;

  const msg = update.message;
  const chatId = String(msg.chat.id);
  const text = (msg.text || "").trim();
  const username = msg.from.username || msg.from.first_name || "User";

  // Standard commands
  if (text.startsWith("/start")) {
    const startMsg = `🌟 **Welcome to Karizma Bot!** / **به بات کاریزما خوش آمدید!** 🌟

This bot connects to your **Karizma Team Workspace** to send you task updates, reminders, and workspace summaries.

🔑 **How to connect:**
1. Open the Karizma Web App
2. Go to **Bale Connection** tab in settings or landing page
3. Click **Connect Account** to generate your unique connection code
4. Set the code here using: \`/connect <CODE>\`

---

🔑 **راهنمای اتصال:**
۱. وارد وب‌اپلیکیشن کاریزما شوید
۲. به بخش **اتصالِ بله** در تنظیمات یا صفحه اصلی بروید
۳. برای تولید کد اتصال، دکمه را لمس کنید
۴. آن را در اینجا به این صورت وارد کنید: \`/connect <کد>\`

📌 **Commands / دستورات:**
/today - Today's tasks / کارهای امروز
/tasks - All active tasks / کارهای فعال
/overdue - Overdue tasks / کارهای به تعویق افتاده
/reminders - Reminders due / یادآورها
/help - Help guide / راهنما`;

    await sendBaleMessage(chatId, startMsg);
    return;
  }

  if (text.startsWith("/connect")) {
    const parts = text.split(" ");
    const code = parts[1] ? parts[1].trim() : null;

    if (!code) {
      await sendBaleMessage(chatId, "⚠️ Please provide a connection code. Usage: `/connect 123456`\n\n⚠️ لطفا کد اتصال را وارد کنید.");
      return;
    }

    try {
      // Find connection code
      const connection = await prisma.baleConnection.findFirst({
        where: { connectionCode: code, isVerified: false },
        include: { user: true },
      });

      if (!connection) {
        await sendBaleMessage(
          chatId,
          "❌ Invalid or expired connection code. Please check your web panel and try again.\n\n❌ کد اتصال نامعتبر یا منقضی شده است."
        );
        return;
      }

      // Update connection
      await prisma.baleConnection.update({
        where: { id: connection.id },
        data: {
          baleChatId: chatId,
          baleUsername: username,
          isVerified: true,
          connectionCode: null,
        },
      });

      // Create initial notification for the user
      await prisma.notification.create({
        data: {
          userId: connection.userId,
          title: "Bale Bot Connected Successfully",
          message: `Your account is successfully linked to Bale username @${username}`,
          type: "system",
        },
      });

      const successMsg = `✅ **Congratulations ${connection.user.name}!**\nYour Bale account is successfully linked to **Karizma**! 🎉\nYou will now receive instant team reminders, workspace notices, and task updates card right in here.\n\n🌍 Log in to the web app: ${process.env.APP_URL || "https://karizma.app"}\n\n---\n\n✅ **تبریک ${connection.user.name}!** \nحساب بله شما با موفقیت به **کاریزما** متصل شد! 🎉`;
      await sendBaleMessage(chatId, successMsg);
    } catch (err: any) {
      console.error(err);
      await sendBaleMessage(chatId, "❌ Connection failed due to backend database error.\n\n❌ اتصال به دلیل بروز خطا در پایگاه داده ناموفق بود.");
    }
    return;
  }

  // Find user by baleChatId to serve data
  try {
    const connection = await prisma.baleConnection.findUnique({
      where: { baleChatId: chatId },
      include: { user: true },
    });

    if (!connection || !connection.isVerified) {
      await sendBaleMessage(
        chatId,
        "🔒 Your Bale account is not linked to Karizma yet.\nUse `/connect <CODE>` to link your team profile.\n\n🔒 حساب شما هنوز متصل نشده است. از دستور `/connect <کد>` استفاده کنید."
      );
      return;
    }

    const userId = connection.userId;

    if (text === "/today") {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const tasks = await prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { in: ["todo", "in_progress", "waiting"] },
          deadline: { gte: todayStart, lte: todayEnd },
        },
      });

      if (tasks.length === 0) {
        await sendBaleMessage(chatId, "✅ No tasks scheduled for today. Enjoy your day!\n\n✅ کاری برای امروز برنامه‌ریزی نشده است.");
      } else {
        let response = `📅 **Your Tasks for Today (${tasks.length}):**\n`;
        tasks.forEach((t, idx) => {
          response += `${idx + 1}. 📌 **${t.title}** [Priority: ${t.priority.toUpperCase()}]\n`;
        });
        await sendBaleMessage(chatId, response);
      }
      return;
    }

    if (text === "/tasks") {
      const tasks = await prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { in: ["todo", "in_progress", "waiting"] },
        },
        orderBy: { priority: "desc" },
      });

      if (tasks.length === 0) {
        await sendBaleMessage(chatId, "🎉 You have no active tasks at the moment.\n\n🎉 در حال حاضر هیچ کاری به شما محول نشده است.");
      } else {
        let response = `📋 **Your Active Tasks (${tasks.length}):**\n`;
        tasks.forEach((t, idx) => {
          response += `${idx + 1}. 📌 **${t.title}** - [${t.status.replace("_", " ")}] - Priority: ${t.priority.toUpperCase()}\n`;
        });
        await sendBaleMessage(chatId, response);
      }
      return;
    }

    if (text === "/overdue") {
      const now = new Date();
      const tasks = await prisma.task.findMany({
        where: {
          assigneeId: userId,
          status: { in: ["todo", "in_progress", "waiting"] },
          deadline: { lt: now },
        },
      });

      if (tasks.length === 0) {
        await sendBaleMessage(chatId, "☀️ Fantastic! No overdue tasks.\n\n☀️ عالی! کاری به تعویق نیفتاده است.");
      } else {
        let response = `⚠️ **Overdue Tasks Alerts (${tasks.length}):**\n`;
        tasks.forEach((t, idx) => {
          response += `${idx + 1}. 🚨 **${t.title}** - Due: ${t.deadline?.toLocaleDateString() || "Unknown"}\n`;
        });
        await sendBaleMessage(chatId, response);
      }
      return;
    }

    if (text === "/reminders") {
      const reminders = await prisma.reminder.findMany({
        where: { userId, isCompleted: false },
        orderBy: { dueTime: "asc" },
      });

      if (reminders.length === 0) {
        await sendBaleMessage(chatId, "⏰ No active reminders scheduled.\n\n⏰ یادآور فعالی ندارید.");
      } else {
        let response = `⏰ **Active Reminders (${reminders.length}):**\n`;
        reminders.forEach((r, idx) => {
          response += `${idx + 1}. 🔔 **${r.title}** - At: ${r.dueTime.toLocaleString()}\n`;
        });
        await sendBaleMessage(chatId, response);
      }
      return;
    }

    if (text === "/help") {
      const helpMsg = `ℹ️ **Karizma Bot Commands Help**\n\n` +
        `/today - View tasks due today\n` +
        `/tasks - View all active tasks assigned to you\n` +
        `/overdue - View task entries past due-dates\n` +
        `/reminders - View pending reminders\n` +
        `/help - Output this guidebook`;
      await sendBaleMessage(chatId, helpMsg);
      return;
    }

    // Default message fallback if unhandled text
    await sendBaleMessage(
      chatId,
      "🤖 I received your message. Use `/help` to see the available commands.\n\n🤖 پیام شما دریافت شد. گزینه‌های قابل استفاده با دستور `/help` نمایش داده می‌شوند."
    );
  } catch (err: any) {
    console.error(err);
  }
}

/**
 * Periodically start Polling if Webhook cannot be configured
 */
export function startBalePolling() {
  const token = process.env.BALE_BOT_TOKEN;
  if (!token) {
    console.warn("BALE_BOT_TOKEN is missing. Polling bypassed.");
    return;
  }

  let lastUpdateId = 0;
  console.log("Starting Bale Bot long polling client...");

  setInterval(async () => {
    try {
      const url = `https://tapi.bale.ai/bot${token}/getUpdates?offset=${lastUpdateId + 1}&timeout=5`;
      const response = await axios.get(url, { timeout: 10000 });
      if (response.data && response.data.ok && response.data.result) {
        const updates = response.data.result;
        for (const update of updates) {
          lastUpdateId = update.update_id;
          await handleBaleUpdate(update);
        }
      }
    } catch (error: any) {
      // Quiet fail to avoid polluting console, bale api issues can occur
    }
  }, 4000);
}

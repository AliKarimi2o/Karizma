import React, { useState } from "react";
import { Kanban, List, Filter, Plus, Calendar, AlertTriangle, Paperclip, MessageSquare, CheckCircle, Trash2, CheckSquare } from "lucide-react";
import { TranslationSet } from "../translations";

interface User {
  id: string;
  name: string;
  phone: string;
}

interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

interface Comment {
  id: string;
  text: string;
  createdAt: string;
  user?: User | null;
}

interface FileAttachment {
  id: string;
  filename: string;
  filepath: string;
  filetype: string;
  filesize: number;
  user?: User | null;
}

interface Task {
  id: string;
  title: string;
  description?: string | null;
  priority: string;
  status: string;
  deadline?: string | null;
  startDate?: string | null;
  progress: number;
  assignee?: User | null;
  subtasks: Subtask[];
  comments: Comment[];
  attachments?: FileAttachment[];
}

interface TaskBoardProps {
  tasks: Task[];
  members: { id: string; user: User; role: string }[];
  onCreateTask: (data: any) => Promise<any>;
  onUpdateTask: (id: string, data: any) => Promise<any>;
  onDeleteTask: (id: string) => Promise<any>;
  onPostComment: (taskId: string, text: string) => Promise<any>;
  onUploadFile: (taskId: string, file: File) => Promise<any>;
  t: TranslationSet;
}

export function TaskBoard({
  tasks,
  members,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onPostComment,
  onUploadFile,
  t,
}: TaskBoardProps) {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // Create Task Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newDeadline, setNewDeadline] = useState("");
  const [newStartDate, setNewStartDate] = useState("");
  const [newAssignee, setNewAssignee] = useState("");
  const [newSubtasks, setNewSubtasks] = useState<string[]>([]);
  const [subtaskInput, setSubtaskInput] = useState("");

  // Inspect Task Details Modal
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [commentText, setCommentText] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  const filteredTasks = tasks.filter((task) => {
    const matchPriority = filterPriority === "all" || task.priority.toLowerCase() === filterPriority.toLowerCase();
    const matchStatus = filterStatus === "all" || task.status.toLowerCase() === filterStatus.toLowerCase();
    return matchPriority && matchStatus;
  });

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-rose-500/10 text-rose-400 border border-rose-500/30";
      case "high":
        return "bg-amber-500/10 text-amber-400 border border-amber-500/30";
      case "medium":
        return "bg-indigo-500/10 text-indigo-400 border border-indigo-500/30";
      default:
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
    }
  };

  const statusColumns = [
    { key: "todo", title: t.todo, color: "border-indigo-500" },
    { key: "in_progress", title: t.inProgress, color: "border-amber-500" },
    { key: "waiting", title: t.waiting, color: "border-sky-500" },
    { key: "done", title: t.done, color: "border-emerald-500" },
  ];

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    await onCreateTask({
      title: newTitle,
      description: newDesc,
      priority: newPriority,
      deadline: newDeadline || null,
      startDate: newStartDate || null,
      assigneeId: newAssignee || null,
      subtasks: newSubtasks,
    });
    setNewTitle("");
    setNewDesc("");
    setNewDeadline("");
    setNewStartDate("");
    setNewAssignee("");
    setNewSubtasks([]);
    setShowCreateModal(false);
  };

  const handleAddSubtask = () => {
    if (!subtaskInput.trim()) return;
    setNewSubtasks([...newSubtasks, subtaskInput]);
    setSubtaskInput("");
  };

  const handleUpdateStatus = async (task: Task, nextStatus: string) => {
    await onUpdateTask(task.id, { status: nextStatus, progress: nextStatus === "done" ? 100 : task.progress });
    if (selectedTask?.id === task.id) {
      setSelectedTask((prev: any) => ({ ...prev, status: nextStatus, progress: nextStatus === "done" ? 100 : task.progress }));
    }
  };

  const handleToggleSubtask = async (task: Task, subId: string, current: boolean) => {
    const updatedSubs = task.subtasks.map((s) => (s.id === subId ? { ...s, isCompleted: !current } : s));
    const completedCount = updatedSubs.filter((s) => s.isCompleted).length;
    const nextProgress = Math.round((completedCount / updatedSubs.length) * 100);

    await onUpdateTask(task.id, {
      subtasks: updatedSubs,
      progress: nextProgress,
    });

    if (selectedTask?.id === task.id) {
      setSelectedTask((prev: any) => ({ ...prev, subtasks: updatedSubs, progress: nextProgress }));
    }
  };

  const handlePostCommentSubmit = async () => {
    if (!commentText.trim() || !selectedTask) return;
    const newComment = await onPostComment(selectedTask.id, commentText);
    setSelectedTask((prev: any) => ({
      ...prev,
      comments: [...(prev.comments || []), newComment],
    }));
    setCommentText("");
  };

  const handleFileUploadSubmit = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedTask) {
      try {
        setIsUploading(true);
        const file = e.target.files[0];
        const newAttachment = await onUploadFile(selectedTask.id, file);
        if (newAttachment) {
          setSelectedTask((prev: any) => ({
            ...prev,
            attachments: [...(prev.attachments || []), newAttachment],
          }));
        }
      } catch (err: any) {
        alert("Upload failed.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="space-y-6 text-[#E4E4E7]">
      {/* Control filters bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-[#111113] border border-[#1F1F23] rounded-2xl gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-[#161618] p-1 rounded-lg border border-[#27272A]">
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "kanban" ? "bg-[#27272A] text-white" : "text-[#71717A] hover:text-white"}`}
            >
              <Kanban className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-[#27272A] text-white" : "text-[#71717A] hover:text-white"}`}
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <div className="flex gap-2 items-center text-xs">
            <Filter className="w-3.5 h-3.5 text-[#71717A]" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-[#161618] border border-[#27272A] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value="all">Any priority</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="bg-[#161618] border border-[#27272A] rounded-lg px-2 py-1 text-xs text-white focus:outline-none"
            >
              <option value="all">Any status</option>
              <option value="todo">{t.todo}</option>
              <option value="in_progress">{t.inProgress}</option>
              <option value="waiting">{t.waiting}</option>
              <option value="done">{t.done}</option>
            </select>
          </div>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all self-end sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          {t.createTask}
        </button>
      </div>

      {/* VIEW MODES */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {statusColumns.map((col) => {
            const columnTasks = filteredTasks.filter((t) => t.status.toLowerCase() === col.key);

            return (
              <div key={col.key} className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-4 flex flex-col h-[500px]">
                <div className={`border-b-2 ${col.color} pb-2 mb-4 flex justify-between items-center`}>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-white">{col.title}</h4>
                  <span className="text-[10px] bg-[#1F1F23] px-2 py-0.5 rounded-full text-[#71717A] font-mono">
                    {columnTasks.length}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 scrollbar-thin">
                  {columnTasks.length === 0 ? (
                    <div className="text-center py-6 text-[11px] text-[#52525B]">No tasks in board.</div>
                  ) : (
                    columnTasks.map((task) => {
                      const completedCount = task.subtasks.filter((s) => s.isCompleted).length;

                      return (
                        <div
                          key={task.id}
                          onClick={() => setSelectedTask(task)}
                          className="bg-[#161618] border border-[#1F1F23]/80 hover:border-indigo-500/40 rounded-xl p-3.5 space-y-3 cursor-pointer shadow-sm transition-all group"
                        >
                          <div className="flex justify-between items-start gap-2">
                            <h5 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-1">
                              {task.title}
                            </h5>
                            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${getPriorityColor(task.priority)}`}>
                              {task.priority}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-[10px] text-[#71717A] line-clamp-2 leading-relaxed">
                              {task.description}
                            </p>
                          )}

                          {task.subtasks.length > 0 && (
                            <div className="flex items-center justify-between text-[10px] text-[#52525B]">
                              <span className="flex items-center gap-1">
                                <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                                {completedCount} / {task.subtasks.length} subtasks
                              </span>
                            </div>
                          )}

                          <div className="flex justify-between items-center border-t border-[#1F1F23]/40 pt-2 text-[10px]">
                            {task.assignee ? (
                              <span className="text-[#A1A1AA] truncate">👤 {task.assignee.name}</span>
                            ) : (
                              <span className="text-[#52525B] italic">Unassigned</span>
                            )}
                            {task.deadline && (
                              <span className="text-[#71717A] flex items-center gap-0.5 font-mono">
                                <Calendar className="w-3 h-3" />
                                {new Date(task.deadline).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* LIST TABLE VIEW */
        <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl overflow-hidden overflow-x-auto">
          <table className="w-full text-left text-xs text-[#A1A1AA]">
            <thead className="bg-[#161618] text-[#71717A] uppercase font-bold text-[10px] tracking-widest border-b border-[#1F1F23]">
              <tr>
                <th className="p-4">{t.title}</th>
                <th className="p-4">{t.priority}</th>
                <th className="p-4">{t.status}</th>
                <th className="p-4">{t.assignedTo}</th>
                <th className="p-4">{t.deadline}</th>
                <th className="p-4">Progress</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F1F23]/60">
              {filteredTasks.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-[#52525B]">
                    No tasks found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredTasks.map((task) => (
                  <tr
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    className="hover:bg-[#161618]/30 cursor-pointer transition-all"
                  >
                    <td className="p-4 font-bold text-white max-w-xs truncate">{task.title}</td>
                    <td className="p-4">
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4 uppercase font-mono text-[10px]">{task.status.replace("_", " ")}</td>
                    <td className="p-4">{task.assignee ? task.assignee.name : "Unassigned"}</td>
                    <td className="p-4 font-mono text-[#71717A]">
                      {task.deadline ? new Date(task.deadline).toLocaleDateString() : "-"}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 bg-[#1F1F23] rounded-full overflow-hidden">
                          <div className="h-full bg-indigo-500" style={{ width: `${task.progress}%` }} />
                        </div>
                        <span className="font-mono text-[9px]">{task.progress}%</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D0D0F] border border-[#1F1F23] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-left">
            <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2">
              <Plus className="w-5 h-5 text-indigo-500" />
              {t.createTask}
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#71717A]">TASK TITLE</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Submit final presentation slides..."
                className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#52525B]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#71717A]">DESCRIPTION</label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Details of the work required..."
                className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white placeholder-[#52525B]"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#71717A]">PRIORITY</label>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#71717A]">ASSIGNEE</label>
                <select
                  value={newAssignee}
                  onChange={(e) => setNewAssignee(e.target.value)}
                  className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white"
                >
                  <option value="">Choose member...</option>
                  {members.map((m) => (
                    <option key={m.user.id} value={m.user.id}>
                      {m.user.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#71717A]">START DATE</label>
                <input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#71717A]">DEADLINE</label>
                <input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white"
                />
              </div>
            </div>

            {/* Checklist items list */}
            <div className="space-y-2 pt-2 border-t border-[#1F1F23]/60">
              <label className="text-[10px] font-bold text-[#71717A] block">{t.subtasks}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subtaskInput}
                  onChange={(e) => setSubtaskInput(e.target.value)}
                  placeholder="Task checklist item..."
                  className="flex-1 bg-[#161618] border border-[#1F1F23] rounded-xl px-3 py-1.5 text-xs text-white placeholder-[#52525B]"
                />
                <button
                  type="button"
                  onClick={handleAddSubtask}
                  className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl"
                >
                  Add
                </button>
              </div>

              {newSubtasks.length > 0 && (
                <ul className="text-xs space-y-1.5 pl-3 list-disc text-[#A1A1AA]">
                  {newSubtasks.map((txt, i) => (
                    <li key={i}>{txt}</li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-[#1F1F23]/60">
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setNewSubtasks([]);
                }}
                className="px-4 py-2 bg-[#161618] text-[#A1A1AA] hover:text-white rounded-lg text-xs font-bold transition-all"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all"
              >
                Create Task
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DETAIL VIEW / COMPLETE MODAL */}
      {selectedTask && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D0D0F] border border-[#1F1F23] rounded-3xl p-6 max-w-lg w-full space-y-6 shadow-2xl text-left h-[520px] overflow-y-auto">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded uppercase ${getPriorityColor(selectedTask.priority)}`}>
                  {selectedTask.priority}
                </span>
                <h3 className="text-lg font-bold text-white tracking-tight mt-1">{selectedTask.title}</h3>
              </div>
              <button
                onClick={() => setSelectedTask(null)}
                className="text-[#71717A] hover:text-white text-md font-bold bg-[#161618] border border-[#1F1F23] px-2.5 py-1 rounded-xl"
              >
                ✕
              </button>
            </div>

            {selectedTask.description && (
              <p className="text-xs text-[#A1A1AA] leading-relaxed bg-[#161618]/30 p-3.5 rounded-xl border border-[#1F1F23]">
                {selectedTask.description}
              </p>
            )}

            {/* Quick Status Control Switch Board */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-[#52525B] font-bold block uppercase">{t.status}</span>
                <select
                  value={selectedTask.status}
                  onChange={(e) => handleUpdateStatus(selectedTask, e.target.value)}
                  className="bg-[#161618] border border-[#1F1F23] text-xs text-white rounded-xl px-3 py-1.5 w-full focus:outline-none"
                >
                  <option value="todo">{t.todo}</option>
                  <option value="in_progress">{t.inProgress}</option>
                  <option value="waiting">{t.waiting}</option>
                  <option value="done">{t.done}</option>
                  <option value="cancelled">{t.cancelled}</option>
                </select>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] text-[#52525B] font-bold block uppercase">Deadline</span>
                <span className="text-xs text-white block mt-2 font-mono">
                  {selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : "Unlimited"}
                </span>
              </div>
            </div>

            {/* Checklist of Subtasks */}
            {selectedTask.subtasks.length > 0 && (
              <div className="space-y-2 border-t border-[#1F1F23]/60 pt-4">
                <span className="text-[10px] text-[#52525B] font-bold block uppercase">{t.subtasks}</span>
                <ul className="space-y-2">
                  {selectedTask.subtasks.map((sub) => (
                    <li key={sub.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={sub.isCompleted}
                        onChange={() => handleToggleSubtask(selectedTask, sub.id, sub.isCompleted)}
                        className="rounded border-[#27272A] bg-[#161618] text-indigo-600 focus:ring-0 cursor-pointer"
                      />
                      <span className={`text-xs ${sub.isCompleted ? "line-through text-[#52525B]" : "text-[#A1A1AA]"}`}>
                        {sub.title}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* File Attachments Section */}
            <div id="attachments-section" className="space-y-3 border-t border-[#1F1F23]/60 pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[#52525B] font-bold block uppercase">Attachments / فایل‌های ضمیمه</span>
                <label className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold cursor-pointer bg-[#161618] border border-[#1FD]/10 rounded-lg px-2.5 py-1 flex items-center gap-1">
                  <Paperclip className="w-3 h-3 text-indigo-400" />
                  {isUploading ? "Uploading..." : "+ Add File"}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleFileUploadSubmit}
                    disabled={isUploading}
                  />
                </label>
              </div>
              
              {(!selectedTask.attachments || selectedTask.attachments.length === 0) ? (
                <p className="text-[10px] text-[#52525B] italic">No files attached to this task.</p>
              ) : (
                <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto pr-1">
                  {selectedTask.attachments.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-[#161618]/80 hover:bg-[#161618] rounded-xl border border-[#1F1F23]/60 text-xs transition-colors">
                      <div className="flex items-center gap-2 truncate">
                        <Paperclip className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="text-[#E4E4E7] font-medium truncate" title={file.filename}>{file.filename}</span>
                        <span className="text-[9px] text-[#71717A] ml-1 font-mono">({Math.round(file.filesize / 1024)} KB)</span>
                      </div>
                      <a
                        href={file.filepath}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[10px] font-bold tracking-tight text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded-md"
                      >
                        Download
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Discussion Section */}
            <div className="space-y-4 border-t border-[#1F1F23]/60 pt-4">
              <span className="text-[10px] text-[#52525B] font-bold block uppercase">{t.comments}</span>
              <div className="space-y-2 h-32 overflow-y-auto pr-1">
                {selectedTask.comments?.length === 0 ? (
                  <p className="text-[10px] text-[#52525B] italic">No comments yet.</p>
                ) : (
                  selectedTask.comments?.map((c) => (
                    <div key={c.id} className="bg-[#161618]/60 p-2.5 rounded-lg border border-[#1F1F23]/60 text-[11px]">
                      <div className="flex justify-between text-[9px] text-[#71717A] mb-1">
                        <span className="font-bold text-indigo-400">{c.user?.name || "User"}</span>
                        <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                      </div>
                      <p className="text-[#A1A1AA] leading-relaxed">{c.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Ask a question or report roadblock..."
                  className="flex-1 bg-[#161618] border border-[#1F1F23] rounded-lg px-3 py-1.5 text-xs text-white"
                />
                <button
                  onClick={handlePostCommentSubmit}
                  className="px-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold"
                >
                  Post
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-[#1F1F23]/40">
              <button
                onClick={async () => {
                  if (confirm("Are you sure you want to delete this task?")) {
                    await onDeleteTask(selectedTask.id);
                    setSelectedTask(null);
                  }
                }}
                className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {t.delete} Task
              </button>

              <button
                onClick={() => setSelectedTask(null)}
                className="px-4 py-1.5 bg-[#1F1F23] hover:bg-[#27272A] text-white rounded-lg text-xs font-bold transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { Clock, AlertTriangle, AlertCircle, Calendar } from "lucide-react";
import { TranslationSet } from "../translations";

interface Task {
  id: string;
  title: string;
  startDate?: string | null;
  deadline?: string | null;
  progress: number;
  status: string;
  priority: string;
  assignee?: { name: string; phone: string } | null;
}

interface GanttChartProps {
  tasks: Task[];
  t: TranslationSet;
}

export function GanttChart({ tasks, t }: GanttChartProps) {
  const [zoom, setZoom] = useState<"day" | "week" | "month">("week");

  const validTasks = tasks.filter((task) => task.startDate || task.deadline);

  // Helper date calculations
  const getTaskDates = (task: Task) => {
    const start = task.startDate ? new Date(task.startDate) : new Date();
    const end = task.deadline ? new Date(task.deadline) : new Date(start.getTime() + 86400000);
    return { start, end };
  };

  // Find min and max date across all tasks to bound the timeline
  let minDate = new Date();
  minDate.setDate(minDate.getDate() - 3);
  let maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 14);

  if (validTasks.length > 0) {
    const dates = validTasks.flatMap((t) => {
      const d = getTaskDates(t);
      return [d.start, d.end];
    });
    minDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    maxDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    
    // Pad dates
    minDate.setDate(minDate.getDate() - 2);
    maxDate.setDate(maxDate.getDate() + 5);
  }

  // Generate grid days/weeks
  const daysDiff = Math.max(1, Math.round((maxDate.getTime() - minDate.getTime()) / (1000 * 60 * 60 * 24)));
  const days: Date[] = [];
  for (let i = 0; i <= daysDiff; i++) {
    const d = new Date(minDate);
    d.setDate(minDate.getDate() + i);
    days.push(d);
  }

  const getPositionPercent = (date: Date) => {
    const totalMs = maxDate.getTime() - minDate.getTime();
    const currentMs = date.getTime() - minDate.getTime();
    return Math.max(0, Math.min(100, (currentMs / totalMs) * 100));
  };

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case "critical":
        return "bg-rose-500/25 border-rose-500 text-rose-400";
      case "high":
        return "bg-amber-500/25 border-amber-500 text-amber-400";
      default:
        return "bg-indigo-500/25 border-indigo-500 text-indigo-400";
    }
  };

  const isOverdue = (task: Task) => {
    if (task.status === "done" || task.status === "cancelled") return false;
    if (!task.deadline) return false;
    return new Date(task.deadline).getTime() < Date.now();
  };

  return (
    <div id="gantt-panel" className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-6 text-[#E4E4E7]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            {t.ganttChart}
          </h3>
          <p className="text-xs text-[#71717A] mt-1">Project milestone scheduling schedule</p>
        </div>
        <div className="flex bg-[#161618] p-1 rounded-lg border border-[#27272A]">
          {(["day", "week", "month"] as const).map((z) => (
            <button
              key={z}
              onClick={() => setZoom(z)}
              className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                zoom === z
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                  : "text-[#71717A] hover:text-white"
              }`}
            >
              {z.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {validTasks.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[#1F1F23] rounded-xl bg-[#0D0D0F]">
          <Clock className="w-10 h-10 text-[#52525B] mx-auto mb-3" />
          <p className="text-sm text-[#71717A]">No tasks has validity dates set to plot schedule.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="min-w-[800px] space-y-4">
            {/* Timeline Header */}
            <div className="relative h-8 border-b border-[#1F1F23] text-[10px] font-mono text-[#52525B]">
              <div className="absolute left-0 w-1/4 pr-4 font-bold uppercase truncate">Task Title / Assignee</div>
              <div className="absolute left-1/4 right-0 h-full">
                {/* Visual marker dates */}
                {days.filter((_, i) => zoom === "day" || (zoom === "week" && i % 7 === 0) || (zoom === "month" && i % 14 === 0)).map((day, dIdx) => (
                  <div
                    key={dIdx}
                    className="absolute border-l border-[#1F1F23] h-full pl-1 truncate"
                    style={{ left: `${getPositionPercent(day)}%` }}
                  >
                    {day.toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                  </div>
                ))}
              </div>
            </div>

            {/* Task Row Panels */}
            {validTasks.map((task) => {
              const { start, end } = getTaskDates(task);
              const leftPercent = getPositionPercent(start);
              const rightPercent = getPositionPercent(end);
              const widthPercent = Math.max(3, rightPercent - leftPercent);
              const overdue = isOverdue(task);

              return (
                <div key={task.id} className="relative h-14 flex items-center border-b border-[#1F1F23]/40 hover:bg-[#161618]/30 transition-all rounded-lg px-2">
                  {/* Task details metadata */}
                  <div className="w-1/4 pr-4 truncate">
                    <div className="text-xs font-semibold text-white flex items-center gap-1.5 truncate">
                      {overdue && <AlertCircle className="w-3.5 h-3.5 text-rose-500 animate-pulse shrink-0" />}
                      <span className="truncate">{task.title}</span>
                    </div>
                    <div className="text-[10px] text-[#71717A] mt-0.5 flex gap-2 items-center">
                      <span className="font-mono bg-[#161618] px-1 py-0.5 rounded border border-[#1F1F23]">
                        {task.status.replace("_", " ").toUpperCase()}
                      </span>
                      {task.assignee ? (
                        <span className="truncate">👤 {task.assignee.name}</span>
                      ) : (
                        <span>unassigned</span>
                      )}
                    </div>
                  </div>

                  {/* Task Scheduling Bar Container */}
                  <div className="relative flex-1 h-full">
                    <div
                      className={`absolute top-3 h-8 rounded-lg border flex flex-col justify-center px-2 shadow-sm transition-all overflow-hidden ${getPriorityColor(
                        task.priority
                      )}`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                      }}
                    >
                      {/* Active inner progress percentage indicator */}
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-white/10 transition-all pointer-events-none"
                        style={{ width: `${task.progress}%` }}
                      />

                      <div className="relative flex items-center justify-between text-[9px] font-bold tracking-tight select-none truncate z-10">
                        <span className="truncate">{task.progress}%</span>
                        {overdue && (
                          <span className="text-xs bg-rose-600 text-white rounded-md px-1 py-0.5 shrink-0 ml-1">LATE</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

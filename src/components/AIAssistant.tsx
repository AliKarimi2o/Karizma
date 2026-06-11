import React, { useState } from "react";
import { Sparkles, Trash, Send, Brain, AlertTriangle, Play, HelpCircle } from "lucide-react";
import { TranslationSet } from "../translations";

interface AIAssistantProps {
  workspaceId?: string;
  onSendChat: (msg: string) => Promise<string>;
  onRunAction: (mode: "summary" | "risks" | "actions" | "report") => Promise<string>;
  t: TranslationSet;
}

export function AIAssistant({ workspaceId, onSendChat, onRunAction, t }: AIAssistantProps) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg }]);
    setLoading(true);

    try {
      const response = await onSendChat(userMsg);
      setMessages((prev) => [...prev, { role: "assistant", text: response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Failed to fetch response." }]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(mode: "summary" | "risks" | "actions" | "report") {
    setLoading(true);
    setMessages((prev) => [
      ...prev,
      { role: "user", text: `[Trigger AI action: ${mode.toUpperCase()} for this workspace]` },
    ]);

    try {
      const response = await onRunAction(mode);
      setMessages((prev) => [...prev, { role: "assistant", text: response }]);
    } catch {
      setMessages((prev) => [...prev, { role: "assistant", text: "Action run failed." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Interactive Chat Console */}
      <div id="ai-chat-console" className="lg:col-span-2 bg-[#111113] border border-[#1F1F23] rounded-2xl flex flex-col h-[520px] overflow-hidden text-[#E4E4E7]">
        <div className="p-4 border-b border-[#1F1F23] flex items-center justify-between bg-[#161618]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-indigo-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-bold tracking-tight text-white">{t.aiInsightsTitle}</span>
          </div>
          <button
            onClick={() => setMessages([])}
            className="text-[#52525B] hover:text-rose-400 p-1 rounded hover:bg-[#1F1F23] transition-all"
            title="Clear Chat"
          >
            <Trash className="w-4 h-4" />
          </button>
        </div>

        {/* Message Logs */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#52525B]">
              <Brain className="w-12 h-12 mb-3 text-indigo-500/55 animate-bounce" />
              <p className="text-sm font-semibold text-white">Ask anything about this team project!</p>
              <p className="text-xs max-w-sm mt-1">Get dynamic task prioritization, sprint summaries, meeting notes generator, or workload analysis at a single click.</p>
            </div>
          )}

          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex flex-col max-w-[85%] rounded-2xl p-4 text-xs whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "bg-indigo-600 text-white ml-auto rounded-tr-none"
                  : "bg-[#161618] border border-[#1F1F23] text-[#A1A1AA] mr-auto rounded-tl-none font-sans"
              }`}
            >
              <div className="text-[10px] font-bold uppercase tracking-wider mb-1 text-white/50">
                {m.role === "user" ? "You" : "GapGPT-Qwen"}
              </div>
              <div>{m.text}</div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-xs text-[#71717A] bg-[#161618]/50 p-3 rounded-xl border border-[#1F1F23] w-max">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-ping"></span>
              <span>Thinking with gapgpt-qwen-3.6...</span>
            </div>
          )}
        </div>

        {/* Prompt Input Box */}
        <div className="p-4 border-t border-[#1F1F23] bg-[#0E0E10]">
          <div className="relative">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
              placeholder="Ask GapGPT to prioritize tasks, summary meeting notes, etc..."
              className="w-full bg-[#161618] border border-[#27272A] rounded-xl py-3 px-4 text-xs focus:ring-1 focus:ring-indigo-500 focus:outline-none placeholder-[#52525B] text-white"
            />
            <button
              onClick={handleSend}
              disabled={loading}
              className="absolute right-2 top-2 p-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Quick-Actions Audit Panel */}
      <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-5 text-[#E4E4E7] flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717A] mb-4">WORKSPACE ANALYSIS</h3>
          <p className="text-xs text-[#A1A1AA] leading-relaxed mb-6">
            Run instant context-aware operations with GapGPT for this current board. The assistant polls active task lists, assignee velocities, and schedule dates to synthesize report insights.
          </p>

          <div className="space-y-3">
            <button
              onClick={() => handleAction("summary")}
              disabled={loading}
              className="w-full p-3 bg-[#161618] hover:bg-[#1c1c1f] border border-[#27272A] rounded-xl text-left transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[10px] text-[#52525B] font-bold uppercase mb-1">Board Context</div>
                <div className="text-[11px] text-[#A1A1AA] font-bold">{t.aiSummarizeBoard}</div>
              </div>
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
            </button>

            <button
              onClick={() => handleAction("risks")}
              disabled={loading}
              className="w-full p-3 bg-[#161618] hover:bg-[#1c1c1f] border border-[#27272A] rounded-xl text-left transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[10px] text-[#52525B] font-bold uppercase mb-1">Hazards & Overload</div>
                <div className="text-[11px] text-rose-400 font-bold">{t.aiFindRisks}</div>
              </div>
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            </button>

            <button
              onClick={() => handleAction("actions")}
              disabled={loading}
              className="w-full p-3 bg-[#161618] hover:bg-[#1c1c1f] border border-[#27272A] rounded-xl text-left transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[10px] text-[#52525B] font-bold uppercase mb-1">Velocity Optimizations</div>
                <div className="text-[11px] text-indigo-400 font-bold">{t.aiSuggestActions}</div>
              </div>
              <Brain className="w-4 h-4 text-indigo-400 shrink-0" />
            </button>

            <button
              onClick={() => handleAction("report")}
              disabled={loading}
              className="w-full p-3 bg-[#161618] hover:bg-[#1c1c1f] border border-[#27272A] rounded-xl text-left transition-all flex items-center justify-between"
            >
              <div>
                <div className="text-[10px] text-[#52525B] font-bold uppercase mb-1">Sprint Performance Documents</div>
                <div className="text-[11px] text-emerald-400 font-bold">{t.aiSprintReport}</div>
              </div>
              <Play className="w-4 h-4 text-emerald-400 shrink-0" />
            </button>
          </div>
        </div>

        <div className="border-t border-[#1F1F23]/60 pt-4 mt-6">
          <div className="flex items-center gap-2 text-[10px] text-[#52525B] font-mono justify-center">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Powered by Model gapgpt-qwen-3.6</span>
          </div>
        </div>
      </div>
    </div>
  );
}

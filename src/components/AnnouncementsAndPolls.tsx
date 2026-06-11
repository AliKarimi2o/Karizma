import React, { useState } from "react";
import { MessageSquare, Megaphone, CheckSquare, Plus, AlertCircle, Play, Sparkles, Send } from "lucide-react";
import { TranslationSet } from "../translations";

interface Poll {
  id: string;
  question: string;
  isClosed: boolean;
  options: { id: string; text: string; votes: { userId: string }[] }[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  creator?: { name: string } | null;
}

interface ChatMessage {
  id: string;
  text: string;
  createdAt: string;
  user?: { name: string } | null;
}

interface AnnouncementsAndPollsProps {
  polls: Poll[];
  announcements: Announcement[];
  chatMessages: ChatMessage[];
  onCreatePoll: (q: string, opt: string[]) => Promise<any>;
  onVotePoll: (pollId: string, optionId: string) => Promise<any>;
  onClosePoll: (pollId: string) => Promise<any>;
  onCreateAnnouncement: (title: string, content: string) => Promise<any>;
  onSendChatMessage: (text: string) => Promise<any>;
  t: TranslationSet;
  userId: string;
}

export function AnnouncementsAndPolls({
  polls,
  announcements,
  chatMessages,
  onCreatePoll,
  onVotePoll,
  onClosePoll,
  onCreateAnnouncement,
  onSendChatMessage,
  t,
  userId,
}: AnnouncementsAndPollsProps) {
  const [activeTab, setActiveTab] = useState<"chat" | "polls" | "announcements">("chat");

  // New Poll States
  const [pollQ, setPollQ] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);

  // New Announcement States
  const [announceTitle, setAnnounceTitle] = useState("");
  const [announceContent, setAnnounceContent] = useState("");

  // New Chat Message
  const [chatInput, setChatInput] = useState("");

  const handlePostPoll = async () => {
    if (!pollQ.trim() || pollOptions.some((o) => !o.trim())) return;
    await onCreatePoll(pollQ, pollOptions.filter((o) => o.trim()));
    setPollQ("");
    setPollOptions(["", ""]);
  };

  const handlePostAnnouncement = async () => {
    if (!announceTitle.trim() || !announceContent.trim()) return;
    await onCreateAnnouncement(announceTitle, announceContent);
    setAnnounceTitle("");
    setAnnounceContent("");
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;
    await onSendChatMessage(chatInput);
    setChatInput("");
  };

  return (
    <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl flex flex-col min-h-[500px] overflow-hidden text-[#E4E4E7]">
      {/* Sub tabs bar */}
      <div className="flex border-b border-[#1F1F23] bg-[#161618] px-4 pt-2 justify-between">
        <div className="flex gap-2">
          {(["chat", "polls", "announcements"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-4 text-xs font-bold transition-all relative ${
                activeTab === tab ? "text-indigo-400 border-b-2 border-indigo-500" : "text-[#71717A] hover:text-[#A1A1AA]"
              }`}
            >
              {tab === "chat" ? t.groupChat : tab === "polls" ? t.polls : t.announcements}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 flex-1 flex flex-col justify-between">
        {/* TAB 1: GROUP CHAT */}
        {activeTab === "chat" && (
          <div className="flex flex-col h-[400px] justify-between">
            <div className="flex-1 overflow-y-auto space-y-3 pr-2">
              {chatMessages.length === 0 ? (
                <div className="text-center py-12 text-[#52525B]">
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No chat logs posted yet. Drop a prompt!</p>
                </div>
              ) : (
                chatMessages.map((m) => (
                  <div key={m.id} className="bg-[#161618] border border-[#1F1F23] rounded-xl p-3 text-xs max-w-[85%]">
                    <div className="flex justify-between items-center mb-1 text-[10px]">
                      <span className="font-bold text-indigo-400">{m.user?.name || "Team Member"}</span>
                      <span className="text-[#52525B]">{new Date(m.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-[#A1A1AA] leading-relaxed">{m.text}</p>
                  </div>
                ))
              )}
            </div>

            <div className="flex gap-2 border-t border-[#1F1F23] pt-4">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                placeholder="Type your message on the workspace channel..."
                className="flex-1 bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white placeholder-[#52525B] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
              <button
                onClick={handleSendChat}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: POLLS */}
        {activeTab === "polls" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Poll */}
            <div className="space-y-4 p-4 bg-[#161618]/40 border border-[#1F1F23] rounded-xl">
              <div className="text-xs font-bold uppercase text-[#71717A] mb-2">{t.createPoll}</div>
              <input
                type="text"
                value={pollQ}
                onChange={(e) => setPollQ(e.target.value)}
                placeholder="Which backend route do we prioritize first?"
                className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#52525B]"
              />

              <div className="space-y-2">
                {pollOptions.map((opt, idx) => (
                  <input
                    key={idx}
                    type="text"
                    value={opt}
                    onChange={(e) => {
                      const copy = [...pollOptions];
                      copy[idx] = e.target.value;
                      setPollOptions(copy);
                    }}
                    placeholder={`Option #${idx + 1}`}
                    className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white placeholder-[#52525B]"
                  />
                ))}
                <button
                  onClick={() => setPollOptions((prev) => [...prev, ""])}
                  className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 mt-1 font-bold"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Options
                </button>
              </div>

              <button
                onClick={handlePostPoll}
                className="w-full py-2 bg-[#27272A] hover:bg-indigo-600 border border-[#3E3E42] text-xs font-bold text-white rounded-lg transition-all"
              >
                Launch Decision Poll
              </button>
            </div>

            {/* List Polls */}
            <div className="space-y-4 h-[350px] overflow-y-auto">
              {polls.length === 0 ? (
                <div className="text-center py-12 text-[#52525B]">
                  <CheckSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No decision polls launched.</p>
                </div>
              ) : (
                polls.map((p) => {
                  const totalVotes = p.options.reduce((sum, opt) => sum + opt.votes.length, 0);

                  return (
                    <div key={p.id} className="bg-[#161618] border border-[#1F1F23] rounded-xl p-4 text-xs">
                      <div className="flex justify-between items-center mb-3">
                        <span className="font-bold text-white">{p.question}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            p.isClosed ? "bg-rose-500/20 text-rose-400" : "bg-emerald-500/10 text-emerald-400"
                          }`}
                        >
                          {p.isClosed ? "CLOSED" : "ACTIVE"}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        {p.options.map((opt) => {
                          const votes = opt.votes.length;
                          const percent = totalVotes > 0 ? Math.round((votes / totalVotes) * 100) : 0;
                          const hasVoted = opt.votes.some((v) => v.userId === userId);

                          return (
                            <button
                              key={opt.id}
                              disabled={p.isClosed}
                              onClick={() => onVotePoll(p.id, opt.id)}
                              className={`w-full relative h-9 px-3 rounded-lg border text-left transition-all overflow-hidden flex items-center justify-between ${
                                hasVoted
                                  ? "border-indigo-500 bg-indigo-500/10 text-white font-semibold"
                                  : "border-[#1F1F23] bg-[#0E0E10] text-[#A1A1AA] hover:bg-[#161618]"
                              }`}
                            >
                              <div
                                className="absolute left-0 top-0 bottom-0 bg-indigo-600/10 transition-all"
                                style={{ width: `${percent}%` }}
                              />
                              <span className="relative z-10">{opt.text}</span>
                              <span className="relative z-10 text-[10px] font-mono text-[#71717A]">
                                {votes} votes ({percent}%)
                              </span>
                            </button>
                          );
                        })}
                      </div>

                      {!p.isClosed && (
                        <button
                          onClick={() => onClosePoll(p.id)}
                          className="text-[10px] text-rose-400 hover:text-rose-300 font-bold block ml-auto"
                        >
                          Lock & Close Poll
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: ANNOUNCEMENTS */}
        {activeTab === "announcements" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Announcement */}
            <div className="space-y-4 p-4 bg-[#161618]/40 border border-[#1F1F23] rounded-xl">
              <div className="text-xs font-bold uppercase text-[#71717A] mb-2">{t.createAnnouncement}</div>
              <input
                type="text"
                value={announceTitle}
                onChange={(e) => setAnnounceTitle(e.target.value)}
                placeholder="Title: Server Maintenance, Demo Pitch Scheduled..."
                className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2.5 text-xs text-white placeholder-[#52525B]"
              />

              <textarea
                value={announceContent}
                onChange={(e) => setAnnounceContent(e.target.value)}
                rows={4}
                placeholder="Type announce description body contents..."
                className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white placeholder-[#52525B] focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />

              <button
                onClick={handlePostAnnouncement}
                className="w-full py-2 bg-[#27272A] hover:bg-indigo-600 border border-[#3E3E42] text-xs font-bold text-white rounded-lg transition-all"
              >
                Broadcast Announcement
              </button>
            </div>

            {/* List Announcements */}
            <div className="space-y-4 h-[350px] overflow-y-auto">
              {announcements.length === 0 ? (
                <div className="text-center py-12 text-[#52525B]">
                  <Megaphone className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">No group notices posted yet.</p>
                </div>
              ) : (
                announcements.map((a) => (
                  <div key={a.id} className="bg-[#161618] border border-indigo-500/20 rounded-xl p-4 text-xs">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                        <Megaphone className="w-4 h-4 text-indigo-400 shrink-0" />
                        {a.title}
                      </h4>
                      <span className="text-[10px] text-[#52525B]">
                        {new Date(a.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-[#A1A1AA] leading-relaxed mb-3 whitespace-pre-wrap">{a.content}</p>
                    <div className="text-[10px] text-[#52525B]">By Owner: {a.creator?.name || "Administrator"}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

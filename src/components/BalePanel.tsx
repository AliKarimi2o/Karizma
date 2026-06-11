import React, { useState, useEffect } from "react";
import { MessageSquare, RefreshCw, Send, CheckCircle, Smartphone, Sliders, Play, AlertCircle } from "lucide-react";
import axios from "axios";
import { TranslationSet } from "../translations";

interface BalePanelProps {
  token: string | null;
  t: TranslationSet;
}

export function BalePanel({ token, t }: BalePanelProps) {
  const [loading, setLoading] = useState(false);
  const [syncReminders, setSyncReminders] = useState(true);
  const [syncAssignments, setSyncAssignments] = useState(true);
  const [syncAnnouncements, setSyncAnnouncements] = useState(true);
  const [status, setStatus] = useState<{
    connected: boolean;
    baleChatId: string | null;
    baleUsername: string | null;
    connectionCode: string | null;
  } | null>(null);

  const fetchStatus = async () => {
    if (!token) return;
    try {
      const response = await axios.get("/api/bale/status", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatus(response.data);
      setSyncReminders(response.data.syncReminders ?? true);
      setSyncAssignments(response.data.syncAssignments ?? true);
      setSyncAnnouncements(response.data.syncAnnouncements ?? true);
    } catch (e) {
      console.error("Failed to load Bale connection state:", e);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const handleConnect = async () => {
    setLoading(true);
    try {
      const response = await axios.post(
        "/api/bale/connect",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.code) {
        setStatus((prev: any) => ({
          ...prev,
          connectionCode: response.data.code,
          connected: false,
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await axios.post(
        "/api/bale/disconnect",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setStatus({
        connected: false,
        baleChatId: null,
        baleUsername: null,
        connectionCode: null,
      });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    setLoading(true);
    try {
      await axios.post(
        "/api/bale/send-test",
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert("Test alert successfully dispatched to @KarizmaBot!");
    } catch (err: any) {
      alert("Dispatch failed. Is user verified?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-[#E4E4E7]">
      {/* Handshake Authentication Panel */}
      <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-2">
            <Smartphone className="w-4 h-4" />
            {t.baleStatus}
          </h3>
          <p className="text-xs text-[#71717A] mb-6 leading-relaxed">
            Synchronize your Karizma operations, task assignments, due alarm flags, and calendar notifications with your official Bale messenger streams.
          </p>

          <div className="p-4 bg-[#161618] rounded-xl border border-[#1F1F23] mb-6">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-[#A1A1AA] font-semibold">Verification Handshake:</span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  status?.connected
                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                }`}
              >
                {status?.connected ? t.baleStatusConnected : t.baleStatusDisconnected}
              </span>
            </div>

            {status?.connected ? (
              <div className="space-y-2">
                <div className="text-xs text-[#71717A] flex justify-between">
                  <span>Chat ID:</span>
                  <span className="text-white font-mono">{status.baleChatId}</span>
                </div>
                <div className="text-xs text-[#71717A] flex justify-between">
                  <span>Username:</span>
                  <span className="text-white font-bold">@{status.baleUsername || "SyncedUser"}</span>
                </div>
              </div>
            ) : status?.connectionCode ? (
              <div className="space-y-4">
                <div className="bg-[#0D0D0F] p-3 rounded-lg border border-[#1F1F23] text-center">
                  <div className="text-[10px] text-[#52525B] font-bold uppercase mb-1">YOUR PIN CODE</div>
                  <div className="text-2xl font-mono font-light tracking-widest text-[#E4E4E7] italic font-serif">
                    {status.connectionCode}
                  </div>
                </div>

                <p className="text-[11px] text-[#A1A1AA] leading-relaxed">
                  📢 {t.baleCodeInstructions}
                  <br />
                  <code className="text-indigo-400 bg-black/40 px-1.5 py-0.5 rounded font-mono text-xs block mt-1 text-center">
                    /connect {status.connectionCode}
                  </code>
                </p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={fetchStatus}
                    className="px-3 py-1 bg-[#1F1F23] hover:bg-[#27272A] border border-[#27272A] rounded-lg text-[10px] uppercase font-bold tracking-wider flex items-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Check Status
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#71717A]">No connection handshake generated. Link your profile below.</p>
            )}
          </div>

          {/* Sync Preferences (Optional) */}
          {status?.connected && (
            <div className="space-y-3 mb-6 p-4 border border-[#1F1F23] bg-[#161618]/30 rounded-xl">
              <div className="text-xs font-bold text-[#71717A] flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                SYNC COMPONENT SWITCHBOARD
              </div>
              <label className="flex items-center gap-2 cursor-pointer text-xs justify-between">
                <span className="text-[#A1A1AA]">Sync Personal Reminders</span>
                <input
                  type="checkbox"
                  checked={syncReminders}
                  onChange={(e) => setSyncReminders(e.target.checked)}
                  className="rounded border-[#27272A] bg-[#161618] text-indigo-600 focus:ring-0"
                />
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs justify-between">
                <span className="text-[#A1A1AA]">Sync Task Assignments</span>
                <input
                  type="checkbox"
                  checked={syncAssignments}
                  onChange={(e) => setSyncAssignments(e.target.checked)}
                  className="rounded border-[#27272A] bg-[#161618] text-indigo-600 focus:ring-0"
                />
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs justify-between">
                <span className="text-[#A1A1AA]">Sync announcements</span>
                <input
                  type="checkbox"
                  checked={syncAnnouncements}
                  onChange={(e) => setSyncAnnouncements(e.target.checked)}
                  className="rounded border-[#27272A] bg-[#161618] text-indigo-600 focus:ring-0"
                />
              </label>
            </div>
          )}
        </div>

        <div className="flex gap-3 justify-end border-t border-[#1F1F23]/60 pt-4">
          {status?.connected ? (
            <>
              <button
                onClick={handleSendTest}
                disabled={loading}
                className="px-4 py-2 bg-[#161618] hover:bg-[#1C1C1F] border border-[#27272A] text-[#A1A1AA] text-xs font-bold rounded-lg flex items-center gap-2 hover:text-white transition-all"
              >
                <Send className="w-3.5 h-3.5" />
                {t.baleTestMessage}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={loading}
                className="px-4 py-2 bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 border border-rose-500/20 text-xs font-bold rounded-lg transition-all"
              >
                {t.baleDisconnect}
              </button>
            </>
          ) : (
            <button
              onClick={handleConnect}
              disabled={loading}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition-all"
            >
              Connect Bale Bot
            </button>
          )}
        </div>
      </div>

      {/* Bale Bot Command & Interaction Guide Checklist */}
      <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-6 text-[#E4E4E7] flex flex-col justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717A] mb-4">@KarizmaBot Commands Checklist</h3>
          <p className="text-xs text-[#A1A1AA] leading-relaxed mb-6">
            Bale users can tap directly into the team core from inside any bot discussion stream. Use these custom commands in the bot channel to query status on the fly.
          </p>

          <div className="space-y-3 font-mono text-[11px]">
            <div className="p-3 bg-[#161618] border border-[#1F1F23] rounded-xl flex justify-between items-center">
              <div>
                <span className="text-indigo-400 font-bold block">/start</span>
                <span className="text-[#71717A] text-[10px]">Introduces bot credentials</span>
              </div>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="p-3 bg-[#161618] border border-[#1F1F23] rounded-xl flex justify-between items-center">
              <div>
                <span className="text-indigo-400 font-bold block">/connect &lt;CODE&gt;</span>
                <span className="text-[#71717A] text-[10px]">Executes manual user linking</span>
              </div>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="p-3 bg-[#161618] border border-[#1F1F23] rounded-xl flex justify-between items-center">
              <div>
                <span className="text-indigo-400 font-bold block">/today</span>
                <span className="text-[#71717A] text-[10px]">Lists all personal tasks due today</span>
              </div>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="p-3 bg-[#161618] border border-[#1F1F23] rounded-xl flex justify-between items-center">
              <div>
                <span className="text-indigo-400 font-bold block">/tasks</span>
                <span className="text-[#71717A] text-[10px]">Renders all assigned active tasks</span>
              </div>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>

            <div className="p-3 bg-[#161618] border border-[#1F1F23] rounded-xl flex justify-between items-center">
              <div>
                <span className="text-indigo-400 font-bold block">/overdue</span>
                <span className="text-[#71717A] text-[10px]">Pulls all overdue milestones</span>
              </div>
              <CheckCircle className="w-4 h-4 text-emerald-500" />
            </div>
          </div>
        </div>

        <div className="mt-6 flex items-center gap-2 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-[10px] text-indigo-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>If using tapi.bale.ai local simulation, updates can take up to 4 seconds to sync.</span>
        </div>
      </div>
    </div>
  );
}

import React, { useState } from "react";
import { Settings, ShieldAlert, AlertTriangle, Trash2, Edit3, Sliders } from "lucide-react";
import { TranslationSet } from "../translations";

interface Workspace {
  id: string;
  name: string;
  description?: string | null;
  category?: string | null;
  goal?: string | null;
}

interface WorkspaceSettingsProps {
  workspace: Workspace;
  onUpdateWorkspace: (name: string, desc: string, cat: string, goal: string) => Promise<any>;
  onDeleteWorkspace: (id: string) => Promise<any>;
  t: TranslationSet;
}

export function WorkspaceSettings({ workspace, onUpdateWorkspace, onDeleteWorkspace, t }: WorkspaceSettingsProps) {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || "");
  const [category, setCategory] = useState(workspace.category || "general");
  const [goal, setGoal] = useState(workspace.goal || "");

  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleUpdate = async () => {
    setUpdating(true);
    await onUpdateWorkspace(name, description, category, goal);
    setUpdating(false);
  };

  const handleDelete = async () => {
    if (deleteConfirmation.trim().toLowerCase() !== workspace.name.trim().toLowerCase()) return;
    setUpdating(true);
    await onDeleteWorkspace(workspace.id);
    setUpdating(false);
    setShowDeleteModal(false);
  };

  return (
    <div className="space-y-8 text-[#E4E4E7]">
      {/* Settings Grid Profile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-[#111113] border border-[#1F1F23] rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-bold uppercase tracking-widest text-indigo-400 mb-2 flex items-center gap-1.5">
            <Edit3 className="w-4 h-4" />
            Workspace Metadata Configuration
          </h3>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#71717A] block uppercase">Workspace Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[11px] font-bold text-[#71717A] block uppercase">{t.description}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#71717A] block uppercase">{t.category}</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              >
                <option value="engineering">Engineering</option>
                <option value="research">Academic / Research Lab</option>
                <option value="startup">Startup</option>
                <option value="marketing">Marketing / Design</option>
                <option value="general">General Operations</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-[#71717A] block uppercase">{t.projectGoal}</label>
              <input
                type="text"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                placeholder="Publish paper, demo sprint deploy..."
                className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
              />
            </div>
          </div>

          <button
            onClick={handleUpdate}
            disabled={updating}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all block ml-auto mt-4"
          >
            Update Configuration
          </button>
        </div>

        {/* Danger Zone Component */}
        <div className="bg-rose-950/10 border border-rose-900/30 rounded-2xl p-6 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-rose-400 flex items-center gap-1">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Safety Danger Zone
            </h4>
            <p className="text-xs text-rose-300 leading-relaxed">
              Archiving or deleting a workspace terminates all active timelines, database task records, audit history logs, and Bale connection alerts recursively on the system.
            </p>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full py-2.5 bg-rose-900/20 hover:bg-rose-900/40 border border-rose-500/20 text-xs font-bold text-rose-400 rounded-xl transition-all flex items-center justify-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Delete Workspace
          </button>
        </div>
      </div>

      {/* CASCADE DELETE CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D0D0F] border border-rose-900/40 rounded-3xl p-6 max-w-md w-full text-left space-y-4 shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <h3 className="text-lg font-bold text-white tracking-tight">{t.workspaceDeleteConfirm}</h3>
            </div>

            <p className="text-xs text-[#71717A] leading-relaxed">
              ⚠️ {t.deleteWarning}
            </p>

            <div className="space-y-2 p-3 bg-rose-950/10 border border-rose-900/20 rounded-xl text-[10px]">
              <span className="text-[#A1A1AA] font-bold uppercase block">Confirm by typing name:</span>
              <span className="text-[#E4E4E7] font-mono italic select-none block text-xs">{workspace.name}</span>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                placeholder="Type workspace name to confirm..."
                className="w-full bg-[#161618] border border-rose-900/30 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation("");
                }}
                className="px-4 py-2 bg-[#161618] hover:bg-[#1C1C1F] text-[#A1A1AA] hover:text-white rounded-lg text-xs font-bold transition-all"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleteConfirmation.trim().toLowerCase() !== workspace.name.trim().toLowerCase() || updating}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

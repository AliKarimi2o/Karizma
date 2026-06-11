import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Sparkles,
  Search,
  Plus,
  Users,
  Grid,
  CheckCircle,
  Clock,
  LogOut,
  Moon,
  Sun,
  Layout,
  UserPlus,
  Phone,
  Lock,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  History,
  MessageSquare,
  Building,
  Bell,
  CheckSquare,
  User
} from "lucide-react";

// Import custom helpers and modular tabs
import { translations } from "./translations";
import { GanttChart } from "./components/GanttChart";
import { AIAssistant } from "./components/AIAssistant";
import { BalePanel } from "./components/BalePanel";
import { AnnouncementsAndPolls } from "./components/AnnouncementsAndPolls";
import { WorkspaceSettings } from "./components/WorkspaceSettings";
import { TaskBoard } from "./components/TaskBoard";

export default function App() {
  // Session Authentication State
  const [token, setToken] = useState<string | null>(localStorage.getItem("karizma_token"));
  const [user, setUser] = useState<any>(null);
  const [loadingUser, setLoadingUser] = useState(!!localStorage.getItem("karizma_token"));

  // Auth form states
  const [phone, setPhone] = useState("");
  const [phonePrefix, setPhonePrefix] = useState("+98");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authError, setAuthError] = useState("");

  // System General States
  const [lang, setLang] = useState<"en" | "fa">("en");
  const [darkMode, setDarkMode] = useState(true);
  const [activeTab, setActiveTab] = useState<"dashboard" | "personal_tasks" | "reminders" | "workspaces" | "bale" | "profile">("dashboard");

  // User Profile edit states
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileSkills, setProfileSkills] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState("");
  const [profilePassword, setProfilePassword] = useState("");
  const [profileRepeatPassword, setProfileRepeatPassword] = useState("");
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");
  const [isPhotoUploading, setIsPhotoUploading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfilePhone(user.phone || "");
      setProfileSkills(user.skills || []);
    }
  }, [user]);

  // Core Data Collections
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string | null>(null);
  const [workspaceDetail, setWorkspaceDetail] = useState<any>(null);
  const [personalTasks, setPersonalTasks] = useState<any[]>([]);
  const [reminders, setReminders] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Workspace View Tab Switch (Overview | Tasks | Members | AI Assistant | Schedule | Chat & Polls | Files | Settings)
  const [wsTab, setWsTab] = useState<"overview" | "tasks" | "members" | "ai" | "schedule" | "discussions" | "settings">("overview");

  // Dialog / Form States
  const [showWorkspaceModal, setShowWorkspaceModal] = useState(false);
  const [wsName, setWsName] = useState("");
  const [wsDesc, setWsDesc] = useState("");
  const [wsCategory, setWsCategory] = useState("general");
  const [wsGoal, setWsGoal] = useState("");

  // Personal task creator states
  const [personalTaskTitle, setPersonalTaskTitle] = useState("");
  const [personalTaskDeadline, setPersonalTaskDeadline] = useState("");
  const [personalTaskPriority, setPersonalTaskPriority] = useState("medium");

  // Reminder creator states
  const [reminderTitle, setReminderTitle] = useState("");
  const [reminderTime, setReminderTime] = useState("");

  // Workspace Invite states
  const [invitePhone, setInvitePhone] = useState("");
  const [inviteRole, setInviteRole] = useState("member");

  // Translation hook shorthand
  const t = translations[lang];

  // Fetch authentication status on mount
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUserProfile();
    }
  }, [token]);

  // Handle general dynamic settings update or loading profiles
  const fetchUserProfile = async () => {
    try {
      const response = await axios.get("/api/auth/me");
      setUser(response.data);
      setLang(response.data.lang || "en");
      setDarkMode(response.data.darkMode ?? true);
      // Fetch user specific collections concurrently
      await Promise.all([
        fetchPersonalTasks(),
        fetchReminders(),
        fetchWorkspaces(),
        fetchNotifications()
      ]);
    } catch {
      handleLogout();
    } finally {
      setLoadingUser(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    if (!phone || !password || (isRegisterMode && !name)) {
      setAuthError("All inputs are required.");
      return;
    }

    if (isRegisterMode && password !== repeatPassword) {
      setAuthError(t.passwordsDoNotMatch);
      return;
    }

    let sanitizedPhone = phone.trim();
    if (sanitizedPhone.startsWith("0")) {
      sanitizedPhone = sanitizedPhone.slice(1);
    }
    const finalPhone = sanitizedPhone.startsWith("+") ? sanitizedPhone : (phonePrefix + sanitizedPhone);

    try {
      setLoadingUser(true);
      const endpoint = isRegisterMode ? "/api/auth/register" : "/api/auth/login";
      const payload = { phone: finalPhone, password, name: isRegisterMode ? name : undefined };
      const response = await axios.post(endpoint, payload);

      const returnedToken = response.data.token;
      localStorage.setItem("karizma_token", returnedToken);
      setToken(returnedToken);
    } catch (err: any) {
      setLoadingUser(false);
      setAuthError(err.response?.data?.error || "Connection failure. Please try again.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("karizma_token");
    setToken(null);
    setUser(null);
    setWorkspaces([]);
    setSelectedWorkspaceId(null);
    setWorkspaceDetail(null);
    setLoadingUser(false);
  };

  const toggleLanguage = async () => {
    const nextLang = lang === "en" ? "fa" : "en";
    setLang(nextLang);
    if (token) {
      await axios.patch("/api/auth/settings", { lang: nextLang });
    }
  };

  // ==========================================
  // API DATA FETCHER LOGIC
  // ==========================================

  const fetchWorkspaces = async () => {
    try {
      const response = await axios.get("/api/workspaces");
      setWorkspaces(response.data);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchPersonalTasks = async () => {
    try {
      const response = await axios.get("/api/tasks/personal");
      setPersonalTasks(response.data);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchReminders = async () => {
    try {
      const response = await axios.get("/api/reminders");
      setReminders(response.data);
    } catch (e) {
      console.warn(e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await axios.get("/api/notifications");
      setNotifications(response.data);
    } catch (e) {
      console.warn(e);
    }
  };

  const loadWorkspaceDetail = async (id: string, avoidTabReset = false) => {
    try {
      const response = await axios.get(`/api/workspaces/${id}`);
      setWorkspaceDetail(response.data);
      setSelectedWorkspaceId(id);
      setActiveTab("workspaces");
      if (!avoidTabReset) {
        setWsTab("overview");
      }
    } catch (e: any) {
      alert(e.response?.data?.error || "Error reading workspace logs.");
    }
  };

  // ==========================================
  // CORE ACTIONS (CREATE, DELETE, UPDATE)
  // ==========================================

  const handleCreateWorkspace = async () => {
    if (!wsName.trim()) return;
    try {
      const response = await axios.post("/api/workspaces", {
        name: wsName,
        description: wsDesc,
        category: wsCategory,
        goal: wsGoal,
      });
      fetchWorkspaces();
      setShowWorkspaceModal(false);
      setWsName("");
      setWsDesc("");
      loadWorkspaceDetail(response.data.id);
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleWorkspaceDeleteCascade = async (id: string) => {
    try {
      await axios.delete(`/api/workspaces/${id}`);
      // Immediate clean state removal per strict mandate Section 4.D
      setWorkspaces((prev) => prev.filter((w) => w.id !== id));
      if (selectedWorkspaceId === id) {
        setSelectedWorkspaceId(null);
        setWorkspaceDetail(null);
      }
      setActiveTab("dashboard");
      // Notify success
      alert(t.workspaceDeleted);
    } catch (err: any) {
      alert(err.response?.data?.error || "Workspace deletion failure");
    }
  };

  const handleUpdateWorkspaceMetadata = async (name: string, desc: string, cat: string, goal: string) => {
    if (!selectedWorkspaceId) return;
    try {
      const response = await axios.patch(`/api/workspaces/${selectedWorkspaceId}`, {
        name,
        description: desc,
        category: cat,
        goal,
      });
      setWorkspaceDetail((prev: any) => ({ ...prev, ...response.data }));
      fetchWorkspaces();
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleCreatePersonalTask = async () => {
    if (!personalTaskTitle.trim()) return;
    try {
      await axios.post("/api/tasks", {
        title: personalTaskTitle,
        deadline: personalTaskDeadline || null,
        priority: personalTaskPriority,
        isPersonal: true,
      });
      setPersonalTaskTitle("");
      setPersonalTaskDeadline("");
      fetchPersonalTasks();
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleDeletePersonalTask = async (id: string) => {
    try {
      await axios.delete(`/api/tasks/${id}`);
      fetchPersonalTasks();
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleCreateReminder = async () => {
    if (!reminderTitle.trim() || !reminderTime) return;
    try {
      await axios.post("/api/reminders", {
        title: reminderTitle,
        dueTime: reminderTime,
      });
      setReminderTitle("");
      setReminderTime("");
      fetchReminders();
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleToggleReminder = async (id: string) => {
    try {
      await axios.patch(`/api/reminders/${id}/toggle`);
      fetchReminders();
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      await axios.delete(`/api/reminders/${id}`);
      fetchReminders();
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  // ==========================================
  // WORKSPACE ACTION LOGS CORES
  // ==========================================

  const handleCreateTeamTask = async (taskData: any) => {
    if (!selectedWorkspaceId) return;
    try {
      await axios.post("/api/tasks", {
        ...taskData,
        workspaceId: selectedWorkspaceId,
        isPersonal: false,
      });
      loadWorkspaceDetail(selectedWorkspaceId, true);
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleUpdateTeamTask = async (taskId: string, updateData: any) => {
    try {
      await axios.patch(`/api/tasks/${taskId}`, updateData);
      if (selectedWorkspaceId) {
        loadWorkspaceDetail(selectedWorkspaceId, true);
      }
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleDeleteTeamTask = async (taskId: string) => {
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      if (selectedWorkspaceId) {
        loadWorkspaceDetail(selectedWorkspaceId, true);
      }
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handlePostComment = async (taskId: string, text: string) => {
    try {
      const response = await axios.post(`/api/tasks/${taskId}/comments`, { text });
      if (selectedWorkspaceId) {
        loadWorkspaceDetail(selectedWorkspaceId, true);
      }
      return response.data;
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleUploadFile = async (taskId: string, file: File): Promise<any> => {
    try {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            const response = await axios.post("/api/files/upload-base64", {
              filename: file.name,
              fileData: base64Data,
              taskId: taskId,
              workspaceId: selectedWorkspaceId,
            });
            if (selectedWorkspaceId) {
              loadWorkspaceDetail(selectedWorkspaceId, true);
            }
            resolve(response.data);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
      });
    } catch (err: any) {
      alert(err.response?.data?.error || "Error uploading file.");
    }
  };

  const handleProfileUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError("");
    setProfileSuccess("");

    if (!profileName.trim()) {
      setProfileError("Full Name is required.");
      return;
    }

    if (profilePassword && profilePassword !== profileRepeatPassword) {
      setProfileError(t.passwordsDoNotMatch);
      return;
    }

    try {
      const payload: any = {
        name: profileName,
        phone: profilePhone,
        skills: profileSkills,
      };

      if (profilePassword) {
        payload.password = profilePassword;
      }

      const response = await axios.patch("/api/auth/settings", payload);
      setUser(response.data);
      setProfileSuccess(lang === "en" ? "Profile updated successfully!" : "پروفایل با موفقیت بروزرسانی شد!");
      setProfilePassword("");
      setProfileRepeatPassword("");
    } catch (err: any) {
      setProfileError(err.response?.data?.error || "Error updating profile.");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        setIsPhotoUploading(true);
        setProfileError("");
        setProfileSuccess("");

        const reader = new FileReader();
        reader.onload = async () => {
          try {
            const base64Data = reader.result as string;
            const response = await axios.post("/api/user/upload-avatar", {
              filename: file.name,
              fileData: base64Data,
            });
            setUser((prev: any) => ({ ...prev, avatarUrl: response.data.avatarUrl }));
            setProfileSuccess(lang === "en" ? "Profile photo uploaded!" : "تصویر پروفایل با موفقیت بارگذاری شد!");
          } catch (uploadErr: any) {
            setProfileError("Failed to upload profile photo.");
          } finally {
            setIsPhotoUploading(false);
          }
        };
        reader.onerror = () => {
          setProfileError("FileReader read error.");
          setIsPhotoUploading(false);
        };
        reader.readAsDataURL(file);
      } catch (err) {
        setIsPhotoUploading(false);
      }
    }
  };

  const handleInviteMember = async () => {
    if (!selectedWorkspaceId || !invitePhone.trim()) return;
    try {
      await axios.post(`/api/workspaces/${selectedWorkspaceId}/members`, {
        phone: invitePhone,
        role: inviteRole,
        workspaceName: workspaceDetail.name,
      });
      setInvitePhone("");
      loadWorkspaceDetail(selectedWorkspaceId, true);
      alert("Member invited successfully!");
    } catch (err: any) {
      alert(err.response?.data?.error || "Invitation error. Make sure user is registered.");
    }
  };

  const handleUpdateMemberRole = async (memberId: string, role: string) => {
    if (!selectedWorkspaceId) return;
    try {
      await axios.patch(`/api/workspaces/${selectedWorkspaceId}/members/${memberId}`, { role });
      loadWorkspaceDetail(selectedWorkspaceId, true);
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!selectedWorkspaceId) return;
    try {
      await axios.delete(`/api/workspaces/${selectedWorkspaceId}/members/${memberId}`);
      loadWorkspaceDetail(selectedWorkspaceId, true);
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  // Chat Discussions, Polls, announcements
  const handleCreatePoll = async (question: string, options: string[]) => {
    if (!selectedWorkspaceId) return;
    try {
      await axios.post(`/api/workspaces/${selectedWorkspaceId}/polls`, { question, options });
      loadWorkspaceDetail(selectedWorkspaceId, true);
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleVotePoll = async (pollId: string, optionId: string) => {
    try {
      await axios.post(`/api/polls/${pollId}/vote`, { optionId });
      if (selectedWorkspaceId) loadWorkspaceDetail(selectedWorkspaceId, true);
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleClosePoll = async (pollId: string) => {
    try {
      await axios.post(`/api/polls/${pollId}/close`);
      if (selectedWorkspaceId) loadWorkspaceDetail(selectedWorkspaceId, true);
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleCreateAnnouncement = async (title: string, content: string) => {
    if (!selectedWorkspaceId) return;
    try {
      await axios.post(`/api/workspaces/${selectedWorkspaceId}/announcements`, { title, content });
      loadWorkspaceDetail(selectedWorkspaceId, true);
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  const handleSendChatMessage = async (text: string) => {
    if (!selectedWorkspaceId) return;
    try {
      await axios.post(`/api/workspaces/${selectedWorkspaceId}/chat`, { text });
      loadWorkspaceDetail(selectedWorkspaceId, true);
    } catch (err: any) {
      alert(err.response?.data?.error);
    }
  };

  // GapGPT AI Call Proxies
  const handleSendAIChat = async (message: string) => {
    try {
      const response = await axios.post("/api/ai/chat", {
        message,
        workspaceId: selectedWorkspaceId,
      });
      return response.data.answer;
    } catch {
      return "Unable to communicate with GapGPT co-pilot";
    }
  };

  const handleRunAIWorkspaceAction = async (mode: "summary" | "risks" | "actions" | "report") => {
    try {
      const response = await axios.post("/api/ai/workspace-summary", {
        workspaceId: selectedWorkspaceId,
        mode,
      });
      return response.data.answer;
    } catch {
      return "AI analysis failed.";
    }
  };

  // Check if task is overdue helper
  const getOverdueCount = () => {
    const now = Date.now();
    const teamOverdue = workspaceDetail?.tasks?.filter(
      (t: any) => t.status !== "done" && t.deadline && new Date(t.deadline).getTime() < now
    ).length || 0;
    const personalOverdue = personalTasks.filter(
      (t: any) => t.status !== "done" && t.deadline && new Date(t.deadline).getTime() < now
    ).length || 0;
    return teamOverdue + personalOverdue;
  };

  // ==========================================
  // LAYOUT RENDER (AUTH SHELL STATS)
  // ==========================================

  if (loadingUser) {
    return (
      <div className="flex h-screen w-screen bg-[#0A0A0B] items-center justify-center font-sans p-6 text-[#E4E4E7]">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm font-bold tracking-tight text-white animate-pulse">
            {lang === "fa" ? "در حال تایید نشست کاربری..." : "Verifying secure session..."}
          </div>
          <div className="text-xs text-[#71717A]">
            {lang === "fa" ? "لطفا چند لحظه منتظر بمانید" : "Please wait, initializing workspace..."}
          </div>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div 
        className={`flex h-screen w-screen bg-[#0A0A0B] text-[#E4E4E7] items-center justify-center font-sans p-6 ${lang === "fa" ? "rtl" : "ltr"}`}
        dir={lang === "fa" ? "rtl" : "ltr"}
      >
        <div className="bg-[#111113] border border-[#1F1F23] rounded-3xl p-8 max-w-md w-full space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 italic text-xl">
                K
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-white">{t.appName}</h1>
                <p className="text-[10px] uppercase font-bold text-indigo-400 tracking-widest">{t.slogan}</p>
              </div>
            </div>

            <button
              onClick={toggleLanguage}
              className="px-2.5 py-1 text-xs font-bold border border-[#27272A] bg-[#161618] text-[#A1A1AA] hover:text-white rounded-lg"
            >
              {lang === "en" ? "FA" : "EN"}
            </button>
          </div>

          <div className="border-t border-[#1F1F23]/60 pt-4">
            <h2 className="text-lg font-bold tracking-tight text-white">{isRegisterMode ? t.register : t.login}</h2>
          </div>

          {authError && (
            <div className="p-3 bg-rose-950/20 border border-rose-900/30 text-rose-400 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {isRegisterMode && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#71717A] tracking-wider block uppercase">{t.name}</label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sina Ahmadi"
                    className="w-full bg-[#161618] border border-[#27272A] rounded-xl py-2.5 px-4 text-xs text-white placeholder-[#52525B] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#71717A] block uppercase">{t.phone}</label>
              <div className="flex gap-2">
                <select
                  value={phonePrefix}
                  onChange={(e) => setPhonePrefix(e.target.value)}
                  className="bg-[#161618] border border-[#27272A] rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono shrink-0"
                >
                  <option value="+98">🇮🇷 +98</option>
                  <option value="+1">🇺🇸 +1</option>
                  <option value="+44">🇬🇧 +44</option>
                  <option value="+964">🇮🇶 +964</option>
                  <option value="+90">🇹🇷 +90</option>
                  <option value="+971">🇦🇪 +971</option>
                  <option value="+49">🇩🇪 +49</option>
                </select>
                <div className="relative flex-1">
                  <Phone className="w-4 h-4 text-[#52525B] absolute left-3 top-3.5" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9331111111"
                    className="w-full bg-[#161618] border border-[#27272A] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#52525B] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#71717A] block uppercase">{t.password}</label>
              <div className="relative">
                <Lock className="w-4 h-4 text-[#52525B] absolute left-3 top-3.5" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#161618] border border-[#27272A] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#52525B] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {isRegisterMode && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#71717A] block uppercase">{t.repeatPassword}</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#52525B] absolute left-3 top-3.5" />
                  <input
                    type="password"
                    value={repeatPassword}
                    onChange={(e) => setRepeatPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#161618] border border-[#27272A] rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-[#52525B] focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/20"
            >
              {isRegisterMode ? t.register : t.login}
            </button>
          </form>

          <button
            onClick={() => {
              setIsRegisterMode(!isRegisterMode);
              setAuthError("");
            }}
            className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-medium pt-2"
          >
            {isRegisterMode ? t.hasAccount : t.noAccount}
          </button>
        </div>
      </div>
    );
  }

  // Loaded Application Frame Interface
  return (
    <div
      className={`min-h-screen bg-[#0A0A0B] text-[#E4E4E7] font-sans flex flex-col md:flex-row overflow-hidden ${
        lang === "fa" ? "rtl" : "ltr"
      }`}
      dir={lang === "fa" ? "rtl" : "ltr"}
    >
      {/* SIDEBAR NAVIGATION CONTROL */}
      <aside className="w-full md:w-64 border-r md:border-r border-b md:border-b-0 border-[#1F1F23] bg-[#0D0D0F] flex flex-col shrink-0">
        <div className="p-6 flex items-center justify-between border-b border-[#1F1F23]/60">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20 italic">
              K
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white">{t.appName}</h1>
          </div>

          <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-400 font-mono">
            SaaS
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <div className="py-2 px-3 text-[10px] uppercase tracking-widest text-[#52525B] font-semibold">
            Main Navigation
          </div>

          <button
            onClick={() => {
              setActiveTab("dashboard");
              setSelectedWorkspaceId(null);
              setWorkspaceDetail(null);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "dashboard" && !selectedWorkspaceId
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold"
                : "text-[#A1A1AA] hover:bg-[#161618]"
            }`}
          >
            <Grid className="w-4 h-4" />
            {t.navDashboard}
          </button>

          <button
            onClick={() => {
              setActiveTab("personal_tasks");
              setSelectedWorkspaceId(null);
              setWorkspaceDetail(null);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "personal_tasks"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold"
                : "text-[#A1A1AA] hover:bg-[#161618]"
            }`}
          >
            <CheckSquare className="w-4 h-4" />
            {t.navMyTasks}
          </button>

          <button
            onClick={() => {
              setActiveTab("reminders");
              setSelectedWorkspaceId(null);
              setWorkspaceDetail(null);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "reminders"
                ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                : "text-[#A1A1AA] hover:bg-[#161618]"
            }`}
          >
            <Clock className="w-4 h-4" />
            {t.navReminders}
          </button>

          <button
            onClick={() => {
              setActiveTab("bale");
              setSelectedWorkspaceId(null);
              setWorkspaceDetail(null);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "bale" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20" : "text-[#A1A1AA] hover:bg-[#161618]"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            {t.navBale}
          </button>

          <button
            onClick={() => {
              setActiveTab("profile");
              setSelectedWorkspaceId(null);
              setWorkspaceDetail(null);
            }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === "profile" ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold" : "text-[#A1A1AA] hover:bg-[#161618]"
            }`}
          >
            <User className="w-4 h-4" />
            {t.navProfile}
          </button>

          <div className="py-4 px-3 text-[10px] uppercase tracking-widest text-[#52525B] font-semibold">
            {t.navWorkspaces}
          </div>

          <div className="space-y-1">
            {workspaces.map((ws) => (
              <div
                key={ws.id}
                onClick={() => loadWorkspaceDetail(ws.id)}
                className={`flex items-center justify-between px-3 py-2 group cursor-pointer rounded-lg transition-all ${
                  selectedWorkspaceId === ws.id ? "bg-indigo-600/10 border border-indigo-500/20 text-white" : "hover:bg-[#161618]"
                }`}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 shrink-0"></div>
                  <span className="text-xs truncate font-medium">{ws.name}</span>
                </div>
              </div>
            ))}

            <button
              onClick={() => setShowWorkspaceModal(true)}
              className="w-full text-center text-xs text-indigo-400 hover:text-indigo-300 font-bold block pt-2 mt-2"
            >
              + {t.createWorkspace}
            </button>
          </div>
        </nav>

        {/* User profile footer info block */}
        <div className="p-4 border-t border-[#1F1F23]/60 bg-[#0A0A0C]">
          <div className="flex items-center justify-between gap-3 text-xs">
            <div
              onClick={() => {
                setActiveTab("profile");
                setSelectedWorkspaceId(null);
                setWorkspaceDetail(null);
              }}
              className="flex items-center gap-2.5 truncate cursor-pointer hover:bg-[#161618]/65 p-1 rounded-xl transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 border border-[#27272A] flex items-center justify-center text-white font-bold shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user?.name ? user.name[0].toUpperCase() : "U"
                )}
              </div>
              <div className="truncate">
                <div className="text-white font-bold truncate">{user?.name}</div>
                <div className="text-[#52525B] text-[10px] truncate">{user?.phone}</div>
              </div>
            </div>

            <button onClick={handleLogout} className="text-[#71717A] hover:text-rose-400 transition-colors shrink-0">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* CORE WORKSPACE ENTRY CONTAINER */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-[#1F1F23] flex items-center justify-between px-6 bg-[#0A0A0B]/80 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-xs text-[#71717A]">
              {selectedWorkspaceId ? workspaceDetail?.category?.toUpperCase() : "KARIZMA"}
            </span>
            <span className="text-[#52525B]">/</span>
            <span className="text-white text-sm font-bold truncate max-w-xs block">
              {selectedWorkspaceId ? workspaceDetail?.name : t.navDashboard}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={toggleLanguage}
              className="px-3 py-1 text-xs font-bold bg-[#161618] text-[#A1A1AA] border border-[#27272A] rounded-lg hover:text-white"
            >
              {lang === "en" ? "FA" : "EN"}
            </button>

            {/* Quick Overdue and alert center */}
            <div className="flex items-center gap-2 text-xs">
              {getOverdueCount() > 0 && (
                <div className="flex items-center gap-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded-lg text-[10px] font-bold">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  <span>{getOverdueCount()} {t.overdueText}</span>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* ACTIVE MODULE VIEW LAYOUTS */}
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* ==========================================
              A. PERSONAL DASHBOARD RENDER
              ========================================== */}
          {activeTab === "dashboard" && !selectedWorkspaceId && (
            <div className="space-y-6">
              {/* Slogan Hero Banner card */}
              <div className="bg-gradient-to-r from-indigo-900/40 to-[#111113] border border-[#1F1F23] rounded-3xl p-6 relative overflow-hidden">
                <div className="max-w-xl space-y-2 relative z-10">
                  <div className="flex items-center gap-2 text-[10px] font-bold text-indigo-400 tracking-wider">
                    <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
                    GapGPT PRODUCTIVITY POWERED
                  </div>
                  <h2 className="text-xl font-black text-white">{t.welcomeTitle.replace("{name}", user?.name || "")}</h2>
                  <p className="text-xs text-[#71717A] leading-relaxed">
                    {t.welcomeDesc}
                  </p>
                </div>
              </div>

              {/* Bento Grid Metrics summaries */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-4 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-[#52525B]">{t.yourPrivateTasks}</div>
                  <div className="text-3xl font-serif text-white font-light italic mt-2">{personalTasks.length}</div>
                </div>

                <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-4 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-[#52525B]">{t.baleConnStatus}</div>
                  <div className="text-sm font-bold text-indigo-400 mt-2">
                    {user?.baleConnected ? t.syncActive : t.setupRequired}
                  </div>
                </div>

                <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-4 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-[#52525B]">{t.overdueReminders}</div>
                  <div className="text-3xl font-serif text-rose-400 font-light italic mt-2">
                    {getOverdueCount()}
                  </div>
                </div>

                <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-4 flex flex-col justify-between">
                  <div className="text-[10px] uppercase font-bold text-[#52525B]">{t.activeWorkspaces}</div>
                  <div className="text-3xl font-serif text-emerald-400 font-light italic mt-2">{workspaces.length}</div>
                </div>
              </div>

              {/* Main Landing Sections */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Active Workspaces Overview List */}
                <div className="lg:col-span-2 bg-[#111113] border border-[#1F1F23] rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-[#1F1F23]/60 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                      {t.activeWorkspaces}
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {workspaces.map((ws) => (
                      <div
                        key={ws.id}
                        onClick={() => loadWorkspaceDetail(ws.id)}
                        className="p-4 bg-[#161618] border border-[#1F1F23] hover:border-indigo-500/30 rounded-xl cursor-pointer transition-all space-y-2 group"
                      >
                        <h4 className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                          {ws.name}
                        </h4>
                        <p className="text-[10px] text-[#71717A] max-w-sm shrink-0 truncate">
                          {ws.description || "Project dashboard"}
                        </p>
                        <div className="flex justify-between items-center text-[10px] border-t border-[#1F1F23]/50 pt-2 text-[#52525B]">
                          <span>👥 {ws.members?.length || 1} {t.membersCount}</span>
                          <span>📌 {ws.tasks?.length || 0} {t.tasksCount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notifications & Announcements Feed */}
                <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-5 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717A]">{t.notificationLog}</h3>
                  <div className="space-y-3 h-52 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-[11px] text-[#52525B] italic text-center py-6">{t.noRecentNotices}</p>
                    ) : (
                      notifications.map((n) => (
                        <div key={n.id} className="p-2.5 bg-[#161618] border border-[#1F1F23] rounded-xl text-[11px]">
                          <span className="font-bold text-white block">{n.title}</span>
                          <span className="text-[#A1A1AA] mt-1 block leading-relaxed">{n.message}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* Consolidated Personal Tasks and Reminders Panel in Dashboard */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                
                {/* A. My Private Tasks Widget */}
                <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-[#1F1F23]/60 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                      📝 {t.managePersonalTasks}
                    </h3>
                  </div>

                  {/* Input form */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <input
                      type="text"
                      value={personalTaskTitle}
                      onChange={(e) => setPersonalTaskTitle(e.target.value)}
                      placeholder={t.personalPlaceHolder}
                      className="flex-1 bg-[#161618] border border-[#1F1F23] rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="date"
                      value={personalTaskDeadline}
                      onChange={(e) => setPersonalTaskDeadline(e.target.value)}
                      className="bg-[#161618] border border-[#1F1F23] rounded-xl px-3 py-2 text-[11px] text-white font-mono focus:outline-none"
                    />
                    <button
                      onClick={handleCreatePersonalTask}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shrink-0 transition-all"
                    >
                      {t.addTask}
                    </button>
                  </div>

                  {/* Tasks List */}
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {personalTasks.length === 0 ? (
                      <div className="text-center py-10 text-[#52525B] text-xs italic">{t.emptyList}</div>
                    ) : (
                      personalTasks.map((tItem) => (
                        <div
                          key={tItem.id}
                          className="p-3 bg-[#161618] border border-[#1F1F23] rounded-xl flex items-center justify-between text-xs hover:border-[#27272A] transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <CheckCircle className="w-4 h-4 text-[#52525B]" />
                            <span className="font-bold text-[#E4E4E7]">{tItem.title}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-[#71717A]">
                            {tItem.deadline && <span>⌛ {t.dueText} {new Date(tItem.deadline).toLocaleDateString()}</span>}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeletePersonalTask(tItem.id);
                              }}
                              className="text-rose-400 hover:text-rose-300 font-bold"
                            >
                              {t.purge}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* B. My Reminders Widget */}
                <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center border-b border-[#1F1F23]/60 pb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#E4E4E7]">
                      ⏰ {t.setPersonalReminders}
                    </h3>
                  </div>

                  {/* Input form */}
                  <div className="flex flex-col sm:flex-row gap-2 mt-2">
                    <input
                      type="text"
                      value={reminderTitle}
                      onChange={(e) => setReminderTitle(e.target.value)}
                      placeholder={t.reminderPlaceHolder}
                      className="flex-1 bg-[#161618] border border-[#1F1F23] rounded-xl px-3 py-2 text-[11px] text-white focus:outline-none focus:border-indigo-500"
                    />
                    <input
                      type="datetime-local"
                      value={reminderTime}
                      onChange={(e) => setReminderTime(e.target.value)}
                      className="bg-[#161618] border border-[#1F1F23] rounded-xl px-3 py-2 text-[11px] text-white font-mono focus:outline-none"
                    />
                    <button
                      onClick={handleCreateReminder}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shrink-0 transition-all"
                    >
                      {t.setupReminder}
                    </button>
                  </div>

                  {/* Reminders list */}
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                    {reminders.length === 0 ? (
                      <div className="text-[#52525B] text-center py-10 text-xs italic">{t.emptyReminders}</div>
                    ) : (
                      reminders.map((r) => (
                        <div
                          key={r.id}
                          className="p-3 bg-[#161618] border border-[#1F1F23] rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="checkbox"
                              checked={r.isCompleted}
                              onChange={() => handleToggleReminder(r.id)}
                              className="rounded border-[#27272A] bg-[#161618] text-indigo-600 focus:ring-0"
                            />
                            <span className={r.isCompleted ? "line-through text-[#52525B]" : "font-bold text-[#E4E4E7]"}>{r.title}</span>
                          </div>
                          <div className="flex items-center gap-4 text-[11px] font-mono">
                            <span className="text-[#71717A] text-[10px]">{new Date(r.dueTime).toLocaleString()}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteReminder(r.id);
                              }}
                              className="text-rose-400 hover:text-rose-300"
                            >
                              {t.delete}
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* ==========================================
              B. PERSONAL PRIVATE TASKS
              ========================================== */}
          {activeTab === "personal_tasks" && (
            <div className="space-y-6">
              <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-5">
                <h3 className="text-md font-bold text-white mb-4">{t.managePersonalTasks}</h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <input
                    type="text"
                    value={personalTaskTitle}
                    onChange={(e) => setPersonalTaskTitle(e.target.value)}
                    placeholder={t.personalPlaceHolder}
                    className="md:col-span-2 bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white"
                  />
                  <input
                    type="date"
                    value={personalTaskDeadline}
                    onChange={(e) => setPersonalTaskDeadline(e.target.value)}
                    className="bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white font-mono"
                  />
                  <button
                    onClick={handleCreatePersonalTask}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                  >
                    {t.addTask}
                  </button>
                </div>

                <div className="space-y-2">
                  {personalTasks.length === 0 ? (
                    <div className="text-center py-12 text-[#52525B]">{t.emptyList}</div>
                  ) : (
                    personalTasks.map((tItem) => (
                      <div
                        key={tItem.id}
                        className="p-3 bg-[#161618] border border-[#1F1F23] rounded-xl flex items-center justify-between text-xs hover:border-[#27272A] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <CheckCircle className="w-4 h-4 text-[#52525B]" />
                          <span className="font-bold text-[#E4E4E7]">{tItem.title}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[10px] text-[#71717A]">
                          {tItem.deadline && <span>⌛ {t.dueText} {new Date(tItem.deadline).toLocaleDateString()}</span>}
                          <button
                            onClick={() => handleDeletePersonalTask(tItem.id)}
                            className="text-rose-400 hover:text-rose-300 font-bold"
                          >
                            {t.purge}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              C. PERSONAL REMINDERS
              ========================================== */}
          {activeTab === "reminders" && (
            <div className="space-y-6">
              <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-5">
                <h3 className="text-md font-bold text-white mb-4">{t.setPersonalReminders}</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <input
                    type="text"
                    value={reminderTitle}
                    onChange={(e) => setReminderTitle(e.target.value)}
                    placeholder={t.reminderPlaceHolder}
                    className="bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white"
                  />
                  <input
                    type="datetime-local"
                    value={reminderTime}
                    onChange={(e) => setReminderTime(e.target.value)}
                    className="bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white font-mono"
                  />
                  <button
                    onClick={handleCreateReminder}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                  >
                    {t.setupReminder}
                  </button>
                </div>

                <div className="space-y-2">
                  {reminders.length === 0 ? (
                    <div className="text-[#52525B] text-center py-12 text-xs">{t.emptyReminders}</div>
                  ) : (
                    reminders.map((r) => (
                      <div
                        key={r.id}
                        className="p-3 bg-[#161618] border border-[#1F1F23] rounded-xl flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={r.isCompleted}
                            onChange={() => handleToggleReminder(r.id)}
                            className="rounded border-[#27272A] bg-[#161618]"
                          />
                          <span className={r.isCompleted ? "line-through text-[#52525B]" : "font-bold"}>{r.title}</span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-mono">
                          <span className="text-[#71717A]">{new Date(r.dueTime).toLocaleString()}</span>
                          <button onClick={() => handleDeleteReminder(r.id)} className="text-rose-400 hover:text-rose-300">
                            {t.delete}
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ==========================================
              D. BALE CONNECTION MANAGEMENT PANEL
              ========================================== */}
          {activeTab === "bale" && <BalePanel token={token} t={t} />}

          {/* ==========================================
              X. USER PROFILE CUSTOMIZATION PANEL
              ========================================== */}
          {activeTab === "profile" && (
            <div className="space-y-6 max-w-2xl mx-auto">
              <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-6 sm:p-8 space-y-6 animate-fadeIn">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-[#71717A]">{t.editProfileTitle}</h3>
                  <p className="text-xs text-[#52525B] mt-1">{t.slogan}</p>
                </div>

                {/* Status Banners */}
                {profileSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-xl font-bold">
                    ✓ {profileSuccess}
                  </div>
                )}
                {profileError && (
                  <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-xl font-bold">
                    ✗ {profileError}
                  </div>
                )}

                {/* Photo Upload Form Block */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-[#1F1F23]/60">
                  <div className="relative group shrink-0">
                    <div className="w-24 h-24 rounded-full bg-[#161618] border-2 border-indigo-500/40 flex items-center justify-center text-white font-black text-2xl overflow-hidden shadow-lg shadow-indigo-500/5 transition-all group-hover:border-indigo-400">
                      {user?.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                      ) : (
                        user?.name ? user.name[0].toUpperCase() : "U"
                      )}
                    </div>
                    {isPhotoUploading && (
                      <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center text-[10px] text-white font-mono animate-pulse">
                        Uploading...
                      </div>
                    )}
                  </div>
                  <div className="space-y-2 text-center sm:text-left">
                    <h4 className="text-xs font-bold text-[#E4E4E7]">{t.uploadAvatar}</h4>
                    <p className="text-[10px] text-[#71717A] max-w-xs">{lang === 'en' ? 'Upload a high quality square JPEG or PNG profile image' : 'یک تصویر مربعی با کیفیت بالا با فرمت JPEG یا PNG برای پروفایل خود آپلود کنید'}</p>
                    <label className="inline-block cursor-pointer px-3 py-1.5 bg-[#161618] hover:bg-[#1E1E22] text-[#A1A1AA] hover:text-white border border-[#27272A] rounded-xl text-xs font-bold transition-all">
                      Choose File
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleAvatarUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Main profile update form */}
                <form onSubmit={handleProfileUpdateSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#71717A] block">{t.name}</label>
                      <input
                        type="text"
                        value={profileName}
                        onChange={(e) => setProfileName(e.target.value)}
                        className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#71717A] block">{t.phone} ({lang === 'en' ? 'Username' : 'نام کاربری'})</label>
                      <input
                        type="text"
                        value={profilePhone}
                        onChange={(e) => setProfilePhone(e.target.value)}
                        className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        placeholder="+98xxxxxxxxxx"
                      />
                    </div>
                  </div>

                  {/* Skills tags selection field as list tags */}
                  <div className="space-y-1 pt-2">
                    <label className="text-[10px] uppercase font-bold text-[#71717A] block">{t.skillsLabel}</label>
                    <p className="text-[10px] text-[#52525B]">{t.skillsDescription}</p>
                    
                    {/* Active skill tags display container */}
                    <div className="flex flex-wrap gap-2.5 p-3 bg-[#161618] border border-[#1F1F23] rounded-xl mt-1.5 min-h-[48px] items-center">
                      {profileSkills.length === 0 ? (
                        <span className="text-[10px] text-[#52525B] italic">{lang === 'en' ? 'No skill tags set' : 'مهارتی ثبت نشده است'}</span>
                      ) : (
                        profileSkills.map((skill, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1.5 px-2 py-1 bg-indigo-500/15 border border-indigo-500/25 text-indigo-300 text-[10px] rounded-lg font-medium animate-scaleIn"
                          >
                            {skill}
                            <button
                              type="button"
                              onClick={() => setProfileSkills(profileSkills.filter((_, i) => i !== index))}
                              className="text-indigo-400 hover:text-indigo-200 font-bold ml-1 text-xs"
                            >
                              ×
                            </button>
                          </span>
                        ))
                      )}
                    </div>

                    {/* Skill tag input element */}
                    <div className="pt-1.5">
                      <input
                        type="text"
                        value={newSkillInput}
                        onChange={(e) => setNewSkillInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const val = newSkillInput.trim();
                            if (val && !profileSkills.includes(val)) {
                              setProfileSkills([...profileSkills, val]);
                              setNewSkillInput("");
                            }
                          }
                        }}
                        className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 placeholder-[#52525B]"
                        placeholder={t.addSkillPlural}
                      />
                    </div>
                  </div>

                  {/* Password modifier block */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-[#1F1F23]/60">
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#71717A] block">{t.password} ({lang === 'en' ? 'Leave blank to keep current' : 'برای عدم تغییر خالی بگذارید'})</label>
                      <input
                        type="password"
                        value={profilePassword}
                        onChange={(e) => setProfilePassword(e.target.value)}
                        className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        placeholder="••••••••"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-bold text-[#71717A] block">{t.repeatPassword}</label>
                      <input
                        type="password"
                        value={profileRepeatPassword}
                        onChange={(e) => setProfileRepeatPassword(e.target.value)}
                        className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                        placeholder="••••••••"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/10"
                    >
                      {t.updateProfileButton}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* ==========================================
              E. WORKSPACE INTERFACE CONTROL
              ========================================== */}
          {activeTab === "workspaces" && selectedWorkspaceId && workspaceDetail && (
            <div className="space-y-6">
              {/* Workspace Navigation Subtabs bar per Section 3.5 */}
              <div className="flex border-b border-[#1F1F23] pb-1 gap-4 overflow-x-auto">
                <button
                  onClick={() => setWsTab("overview")}
                  className={`pb-3 text-xs font-bold transition-all px-3 rounded-lg ${
                    wsTab === "overview" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  {t.overview}
                </button>
                <button
                  onClick={() => setWsTab("tasks")}
                  className={`pb-3 text-xs font-bold transition-all px-3 rounded-lg ${
                    wsTab === "tasks" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  {t.tasks}
                </button>
                <button
                  onClick={() => setWsTab("members")}
                  className={`pb-3 text-xs font-bold transition-all px-3 rounded-lg ${
                    wsTab === "members" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  {t.members}
                </button>
                <button
                  onClick={() => setWsTab("ai")}
                  className={`pb-3 text-xs font-bold transition-all px-3 rounded-lg ${
                    wsTab === "ai" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  {t.aiAssistant}
                </button>
                <button
                  onClick={() => setWsTab("schedule")}
                  className={`pb-3 text-xs font-bold transition-all px-3 rounded-lg ${
                    wsTab === "schedule" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  {t.schedule}
                </button>
                <button
                  onClick={() => setWsTab("discussions")}
                  className={`pb-3 text-xs font-bold transition-all px-3 rounded-lg ${
                    wsTab === "discussions" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  {t.chatDecisions}
                </button>
                <button
                  onClick={() => setWsTab("settings")}
                  className={`pb-3 text-xs font-bold transition-all px-3 rounded-lg ${
                    wsTab === "settings" ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/10" : "text-[#71717A] hover:text-[#A1A1AA]"
                  }`}
                >
                  {t.settings}
                </button>
              </div>

              {/* RENDER CURRENT TAB SUB-MODULE */}
              {wsTab === "overview" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Overview details summary */}
                  <div className="md:col-span-2 bg-[#111113] border border-[#1F1F23] rounded-2xl p-5 space-y-4">
                    <h3 className="text-md font-bold text-indigo-400">{t.projectGoalObjectives}</h3>
                    <p className="text-xs text-[#A1A1AA] leading-relaxed">
                      {workspaceDetail.description || "General performance workspace board."}
                    </p>

                    <div className="p-4 bg-[#161618] border border-[#1F1F23] rounded-xl flex items-center justify-between">
                      <div>
                        <div className="text-[10px] text-[#52525B] font-bold">{t.currentCategory}</div>
                        <span className="text-xs text-white font-mono">{workspaceDetail.category}</span>
                      </div>
                      <div>
                        <div className="text-[10px] text-[#52525B] font-bold">{t.milestoneTargets}</div>
                        <span className="text-xs text-[#E4E4E7]">{workspaceDetail.goal || "Generic Launch"}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quick summary and metrics */}
                  <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl p-5 space-y-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-[#71717A]">{t.boardMetrics}</h3>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span>{t.totalTasks}</span>
                        <span className="text-white font-mono">{workspaceDetail.tasks?.length || 0}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>{t.workspaceMembers}</span>
                        <span className="text-white font-mono">{workspaceDetail.members?.length || 1}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span>{t.polls}:</span>
                        <span className="text-white font-mono">{workspaceDetail.polls?.length || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {wsTab === "tasks" && (
                <TaskBoard
                  tasks={workspaceDetail.tasks || []}
                  members={workspaceDetail.members || []}
                  onCreateTask={handleCreateTeamTask}
                  onUpdateTask={handleUpdateTeamTask}
                  onDeleteTask={handleDeleteTeamTask}
                  onPostComment={handlePostComment}
                  onUploadFile={handleUploadFile}
                  t={t}
                />
              )}

              {wsTab === "members" && (
                <div className="space-y-6">
                  {/* Invite forms */}
                  <div className="p-5 bg-[#111113] border border-[#1F1F23] rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-wider">{t.inviteMember}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <input
                        type="text"
                        value={invitePhone}
                        onChange={(e) => setInvitePhone(e.target.value)}
                        placeholder="Invitee Phone (e.g., 09121111111)"
                        className="bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white"
                      />
                      <select
                        value={inviteRole}
                        onChange={(e) => setInviteRole(e.target.value)}
                        className="bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white"
                      >
                        <option value="member">Member</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Administrator</option>
                        <option value="viewer">Viewer</option>
                      </select>
                      <button
                        onClick={handleInviteMember}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold"
                      >
                        Add Member
                      </button>
                    </div>
                  </div>

                  {/* Members list representation */}
                  <div className="bg-[#111113] border border-[#1F1F23] rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-xs text-[#A1A1AA]">
                      <thead className="bg-[#161618]/65 text-[#71717A] text-[10px] font-bold uppercase tracking-widest border-b border-[#1F1F23]">
                        <tr>
                          <th className="p-4">Name</th>
                          <th className="p-4">Phone</th>
                          <th className="p-4">Workspace access role</th>
                          <th className="p-4">Action Options</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1F1F23]/60">
                        {workspaceDetail.members?.map((mem: any) => (
                          <tr key={mem.id} className="hover:bg-[#161618]/30">
                            <td className="p-4 font-bold text-white">{mem.user.name}</td>
                            <td className="p-4 font-mono">{mem.user.phone}</td>
                            <td className="p-4 uppercase text-[10px] font-bold tracking-wider">{mem.role}</td>
                            <td className="p-4 flex gap-3">
                              {mem.role !== "owner" && (
                                <button
                                  onClick={() => handleRemoveMember(mem.id)}
                                  className="text-rose-400 hover:text-rose-300 font-bold"
                                >
                                  {t.remove}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {wsTab === "ai" && (
                <AIAssistant
                  workspaceId={workspaceDetail.id}
                  onSendChat={handleSendAIChat}
                  onRunAction={handleRunAIWorkspaceAction}
                  t={t}
                />
              )}

              {wsTab === "schedule" && <GanttChart tasks={workspaceDetail.tasks || []} t={t} />}

              {wsTab === "discussions" && (
                <AnnouncementsAndPolls
                  polls={workspaceDetail.polls || []}
                  announcements={workspaceDetail.announcements || []}
                  chatMessages={workspaceDetail.chatMessages || []}
                  onCreatePoll={handleCreatePoll}
                  onVotePoll={handleVotePoll}
                  onClosePoll={handleClosePoll}
                  onCreateAnnouncement={handleCreateAnnouncement}
                  onSendChatMessage={handleSendChatMessage}
                  t={t}
                  userId={user?.id}
                />
              )}

              {wsTab === "settings" && (
                <WorkspaceSettings
                  workspace={workspaceDetail}
                  onUpdateWorkspace={handleUpdateWorkspaceMetadata}
                  onDeleteWorkspace={handleWorkspaceDeleteCascade}
                  t={t}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* CREATE WORKSPACE POPUP MODAL */}
      {showWorkspaceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-[#0D0D0F] border border-[#1F1F23] rounded-3xl p-6 max-w-md w-full space-y-4 shadow-2xl text-left">
            <h3 className="text-md font-bold text-white tracking-tight flex items-center gap-2">
              <Building className="w-5 h-5 text-indigo-500" />
              {t.createWorkspace}
            </h3>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#71717A]">{t.workspaceNameLabel}</label>
              <input
                type="text"
                value={wsName}
                onChange={(e) => setWsName(e.target.value)}
                placeholder="E.g., Engineering Lab, Qwen Research..."
                className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2.5 text-xs text-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-[#71717A]">{t.workspaceDescLabel}</label>
              <textarea
                value={wsDesc}
                onChange={(e) => setWsDesc(e.target.value)}
                placeholder="Brief summary profile..."
                className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#71717A]">{t.category}</label>
                <select
                  value={wsCategory}
                  onChange={(e) => setWsCategory(e.target.value)}
                  className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2 text-xs text-white"
                >
                  <option value="engineering">Engineering</option>
                  <option value="research">Academic / Research</option>
                  <option value="startup">Startup</option>
                  <option value="general">General</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-[#71717A]">{t.goalTargetLabel}</label>
                <input
                  type="text"
                  value={wsGoal}
                  onChange={(e) => setWsGoal(e.target.value)}
                  placeholder="Demo Pitch, paper release..."
                  className="w-full bg-[#161618] border border-[#1F1F23] rounded-xl px-4 py-2.5 text-xs text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 justify-end pt-4 border-t border-[#1F1F23]/60">
              <button
                onClick={() => setShowWorkspaceModal(false)}
                className="px-4 py-2 bg-[#161618] text-[#A1A1AA] hover:text-white rounded-lg text-xs font-bold transition-all"
              >
                {t.cancel}
              </button>
              <button
                onClick={handleCreateWorkspace}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all"
              >
                {t.launchWorkspaceButton}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

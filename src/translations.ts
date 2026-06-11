export interface TranslationSet {
  appName: string;
  slogan: string;
  navDashboard: string;
  navMyTasks: string;
  navReminders: string;
  navWorkspaces: string;
  navBale: string;
  langEn: string;
  langFa: string;
  darkMode: string;
  lightMode: string;
  login: string;
  logout: string;
  register: string;
  phone: string;
  password: string;
  repeatPassword: string;
  passwordsDoNotMatch: string;
  name: string;
  noAccount: string;
  hasAccount: string;
  todayTasks: string;
  overdueTasks: string;
  activeWorkspaces: string;
  recentActivity: string;
  aiDailySummary: string;
  quickCreate: string;
  createTask: string;
  createReminder: string;
  createWorkspace: string;
  createAnnouncement: string;
  searchPlaceholder: string;
  personalStats: string;
  todo: string;
  inProgress: string;
  waiting: string;
  done: string;
  cancelled: string;
  archived: string;
  low: string;
  medium: string;
  high: string;
  critical: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  deadline: string;
  startDate: string;
  estDuration: string;
  assignName: string;
  actions: string;
  delete: string;
  save: string;
  cancel: string;
  category: string;
  projectGoal: string;
  workspaceDeleted: string;
  workspaceDeleteConfirm: string;
  deleteWarning: string;
  members: string;
  overview: string;
  tasks: string;
  aiAssistant: string;
  schedule: string;
  chatDecisions: string;
  files: string;
  settings: string;
  recentLogs: string;
  subtasks: string;
  comments: string;
  addComment: string;
  ganttChart: string;
  createPoll: string;
  polls: string;
  announcements: string;
  groupChat: string;
  uploadedFiles: string;
  uploadNewFile: string;
  baleStatus: string;
  baleGuide: string;
  baleConnectCode: string;
  baleDisconnect: string;
  baleTestMessage: string;
  baleStatusConnected: string;
  baleStatusDisconnected: string;
  baleCodeInstructions: string;
  inviteMember: string;
  memberRole: string;
  promote: string;
  remove: string;
  aiInsightsTitle: string;
  aiSummarizeBoard: string;
  aiFindRisks: string;
  aiSuggestActions: string;
  aiSprintReport: string;
  success: string;
  error: string;
  comingSoon: string;
  assignedTo: string;
  creator: string;
  noTasks: string;
  emptyReminders: string;
  welcomeTitle: string;
  welcomeDesc: string;
  yourPrivateTasks: string;
  baleConnStatus: string;
  syncActive: string;
  setupRequired: string;
  overdueReminders: string;
  membersCount: string;
  tasksCount: string;
  notificationLog: string;
  noRecentNotices: string;
  overdueText: string;
  managePersonalTasks: string;
  personalPlaceHolder: string;
  addTask: string;
  emptyList: string;
  dueText: string;
  purge: string;
  setPersonalReminders: string;
  reminderPlaceHolder: string;
  setupReminder: string;
  projectGoalObjectives: string;
  currentCategory: string;
  milestoneTargets: string;
  boardMetrics: string;
  totalTasks: string;
  workspaceMembers: string;
  workspaceNameLabel: string;
  workspaceDescLabel: string;
  categoryLabel: string;
  goalTargetLabel: string;
  launchWorkspaceButton: string;
  navProfile: string;
  skillsLabel: string;
  addSkillPlural: string;
  uploadAvatar: string;
  editProfileTitle: string;
  skillsDescription: string;
  updateProfileButton: string;
}

export const translations: Record<"en" | "fa", TranslationSet> = {
  en: {
    appName: "Karizma",
    slogan: "AI-Assisted Bilingual Team Hub with Bale Bot reminders",
    navDashboard: "Dashboard",
    navMyTasks: "My Tasks",
    navReminders: "Reminders",
    navWorkspaces: "Teams",
    navBale: "Bale Bot Link",
    langEn: "EN",
    langFa: "FA",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    login: "Log In",
    logout: "Log Out",
    register: "Register",
    phone: "Phone Number",
    password: "Password",
    repeatPassword: "Repeat Password",
    passwordsDoNotMatch: "Passwords do not match!",
    name: "Full Name",
    noAccount: "Don't have an account? Sign up",
    hasAccount: "Already have an account? Log in",
    todayTasks: "Today's Tasks",
    overdueTasks: "Overdue Tasks",
    activeWorkspaces: "Active Teams",
    recentActivity: "Recent Team Activity",
    aiDailySummary: "AI Team Insight",
    quickCreate: "Quick Create",
    createTask: "Create Task",
    createReminder: "Create Reminder",
    createWorkspace: "Create Team",
    createAnnouncement: "Post Announcement",
    searchPlaceholder: "Search tasks or plans...",
    personalStats: "Personal Analytics",
    todo: "To Do",
    inProgress: "In Progress",
    waiting: "Waiting",
    done: "Done",
    cancelled: "Cancelled",
    archived: "Archived",
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
    title: "Title",
    description: "Description",
    priority: "Priority",
    status: "Status",
    deadline: "Deadline",
    startDate: "Start Date",
    estDuration: "Estimated Duration (hrs)",
    assignName: "Assignee Phone",
    actions: "Actions",
    delete: "Delete",
    save: "Save / Create",
    cancel: "Cancel",
    category: "Category",
    projectGoal: "Project Goal & Objectives",
    workspaceDeleted: "Team Deleted Successfully",
    workspaceDeleteConfirm: "Are you absolutely sure you want to delete this team?",
    deleteWarning: "All team tasks, logs, threads, files, reminders, and polls will be permanently purged from the server! This action is irreversible.",
    members: "Members",
    overview: "Overview",
    tasks: "Tasks & Board",
    aiAssistant: "AI Assistant",
    schedule: "Timeline Schedule",
    chatDecisions: "Chat & Polls",
    files: "Docs & Files",
    settings: "Settings",
    recentLogs: "Team Audit Logs",
    subtasks: "Subtasks Checklist",
    comments: "Discussion Thread",
    addComment: "Post Comment",
    ganttChart: "Gantt Timeline Chart",
    createPoll: "Create Decision Poll",
    polls: "Interactive Polls",
    announcements: "Announcements Board",
    groupChat: "Team Channel",
    uploadedFiles: "Team Files Storage",
    uploadNewFile: "Upload or Drop File",
    baleStatus: "Bale Bot Integration",
    baleGuide: "Bale Bot Synchronizer Guide",
    baleConnectCode: "Connection Handshake Code",
    baleDisconnect: "Disconnect Bot",
    baleTestMessage: "Send Test Message",
    baleStatusConnected: "Bale Connection Active",
    baleStatusDisconnected: "Bale Connection Idle",
    baleCodeInstructions: "To link your account, open the @KarizmaBot on Bale Messenger, start chatting, and send:",
    inviteMember: "Invite Member by Phone",
    memberRole: "Member Role",
    promote: "Promote / Update Role",
    remove: "Remove Member",
    aiInsightsTitle: "GapGPT Team Copilot",
    aiSummarizeBoard: "Summarize Board",
    aiFindRisks: "Find Technical Risks",
    aiSuggestActions: "Suggest Solution Actions",
    aiSprintReport: "Generate Sprint Report",
    success: "Operation succeeded!",
    error: "Operation failed",
    comingSoon: "Coming soon feature!",
    assignedTo: "Assigned To",
    creator: "Creator",
    noTasks: "No active tasks in this context.",
    emptyReminders: "No reminders due.",
    welcomeTitle: "How is your day tracking, {name}?",
    welcomeDesc: "Welcome to Karizma! Connect to @KarizmaBot inside Bale Messenger to manage tasks, reminders, and team milestones on the fly without keeping the app open.",
    yourPrivateTasks: "Your Private Tasks",
    baleConnStatus: "Bale Connection Status",
    syncActive: "Sync Active",
    setupRequired: "Setup Required / Offline",
    overdueReminders: "Overdue Reminders",
    membersCount: "members",
    tasksCount: "tasks",
    notificationLog: "Notification Log",
    noRecentNotices: "No recent notices.",
    overdueText: "Overdue",
    managePersonalTasks: "Manage Personal Private Tasks",
    personalPlaceHolder: "E.g., Read technical specs paper...",
    addTask: "Add Task",
    emptyList: "Empty list",
    dueText: "Due:",
    purge: "Purge",
    setPersonalReminders: "Set Personal Reminders & Alarms",
    reminderPlaceHolder: "E.g., Call professor regarding draft...",
    setupReminder: "Setup Reminder",
    projectGoalObjectives: "Team Goal Objectives",
    currentCategory: "CURRENT CATEGORY",
    milestoneTargets: "MILESTONE TARGETS",
    boardMetrics: "Team Metrics",
    totalTasks: "Total tasks:",
    workspaceMembers: "Team members:",
    workspaceNameLabel: "TEAM NAME",
    workspaceDescLabel: "DESCRIPTION",
    categoryLabel: "CATEGORY Label",
    goalTargetLabel: "GOAL TARGET",
    launchWorkspaceButton: "Launch Team",
    navProfile: "My Profile",
    skillsLabel: "My Skills (Tags)",
    addSkillPlural: "Enter a skill and press Enter",
    uploadAvatar: "Upload Profile Image",
    editProfileTitle: "Edit User Profile & Settings",
    skillsDescription: "Specify your area of expertise as tags",
    updateProfileButton: "Update Profile Info",
  },
  fa: {
    appName: "کاریزما",
    slogan: "سامانه مدیریت تیم تیمی دو زبانه هوشمند مجهز به یادآور روبات بله",
    navDashboard: "پیشخوان",
    navMyTasks: "کارهای من",
    navReminders: "یادآورها",
    navWorkspaces: "تیم‌ها",
    navBale: "روبات پیام‌رسان بله",
    langEn: "EN",
    langFa: "FA",
    darkMode: "حالت تاریک",
    lightMode: "حالت روشن",
    login: "ورود به سیستم",
    logout: "خروج",
    register: "ثبت نام کاربر جدید",
    phone: "شماره تلفن همراه",
    password: "رمز عبور",
    repeatPassword: "تکرار رمز عبور",
    passwordsDoNotMatch: "رمزهای عبور با هم همخوانی ندارند!",
    name: "نام و نام خانوادگی",
    noAccount: "حسابی ندارید؟ ثبت‌نام کنید",
    hasAccount: "قبلا ثبت نام کرده‌اید؟ وارد شوید",
    todayTasks: "کارهای امروز",
    overdueTasks: "کارهای به تعویق افتاده",
    activeWorkspaces: "تیم‌های فعال",
    recentActivity: "آخرین فعالیت‌های تیمی",
    aiDailySummary: "بینش هوشمند تیمی کاریزما",
    quickCreate: "ایجاد سریع",
    createTask: "ایجاد کار جدید",
    createReminder: "ایجاد یادآور جدید",
    createWorkspace: "ایجاد تیم جدید",
    createAnnouncement: "ارسال اطلاعیه تیمی",
    searchPlaceholder: "جستجوی کارها، اعضا یا اهداف...",
    personalStats: "آمارهای بهره‌وری فردی",
    todo: "برای انجام",
    inProgress: "در حال انجام",
    waiting: "در انتظار",
    done: "انجام شده",
    cancelled: "لغو شده",
    archived: "آرشیو شده",
    low: "کم",
    medium: "متوسط",
    high: "زیاد",
    critical: "بحرانی",
    title: "عنوان",
    description: "توضیحات",
    priority: "اولویت",
    status: "وضعیت",
    deadline: "موعد تحویل",
    startDate: "تاریخ شروع",
    estDuration: "مدت تخمینی (ساعت)",
    assignName: "تلفن مسئول انجام",
    actions: "عملیات",
    delete: "حذف",
    save: "ذخیره و ایجاد",
    cancel: "انصراف",
    category: "دسته‌بندی",
    projectGoal: "هدف بزرگ پروژه",
    workspaceDeleted: "تیم با موفقیت حذف شد",
    workspaceDeleteConfirm: "آیا از حذف دائم این تیم اطمینان کامل دارید؟",
    deleteWarning: "با این عمل تمام کارها، فایل‌ها، پیام‌ها، گزارشات و نظرسنجی‌های مربوط به این تیم حذف خواهند شد! این عملیات غیرقابل بازگشت است.",
    members: "اعضای تیم",
    overview: "نمای کلی پروژه",
    tasks: "بورد کارهای تیمی",
    aiAssistant: "دستیار هوش مصنوعی",
    schedule: "برنامه زمان‌بندی (گانت)",
    chatDecisions: "گفتگو و نظرسنجی‌ها",
    files: "مدارک و فایل‌ها",
    settings: "تنظیمات تیم",
    recentLogs: "تاریخچه فعالیت‌های تیم",
    subtasks: "لیست زیرکارها",
    comments: "بخش پرسش و پاسخ",
    addComment: "ارسال یادداشت تیمی",
    ganttChart: "نمودار زمان‌بندی گانت",
    createPoll: "ایجاد نظرسنجی تصمیم‌گیری",
    polls: "نظرسنجی‌های تیمی",
    announcements: "اطلاعیه‌های رسمی",
    groupChat: "کانال گفتگو تیم",
    uploadedFiles: "آرشیو فایل‌های تیم",
    uploadNewFile: "بارگذاری یا رها کردن فایل در اینجا",
    baleStatus: "اتصال به روبات پیام‌رسان بله",
    baleGuide: "راهنمای همگام‌ساز پیام‌رسان بله",
    baleConnectCode: "کد اتصال ایمن کاریزما",
    baleDisconnect: "قطع اتصال بله",
    baleTestMessage: "ارسال پیام آزمایشی",
    baleStatusConnected: "اتصال به روبات بله فعال است",
    baleStatusDisconnected: "اتصال به روبات بله غیرفعال است",
    baleCodeInstructions: "برای اتصال حساب کاربری تیمی، ابتدا بات KarizmaBot@ را در پیام‌رسان بله باز کرده، دکمه شروع را بزنید و سپس دستور زیر را بفرستید:",
    inviteMember: "افزودن عضو با شماره تلفن",
    memberRole: "نقش عضو جدید",
    promote: "بروزرسانی نقش / دسترسی",
    remove: "حذف و اخراج عضو",
    aiInsightsTitle: "دستیار هوش مصنوعی تیمی GapGPT",
    aiSummarizeBoard: "خلاصه‌سازی وضعیت تیم",
    aiFindRisks: "شناسایی ریسک‌های تیمی پروژه",
    aiSuggestActions: "پیشنهاد عملیات راه حل",
    aiSprintReport: "تولید گزارش پیشرفت تیم",
    success: "عملیات با موفقیت انجام شد!",
    error: "عملیات ناموفق بود",
    comingSoon: "این ویژگی به زودی اضافه می‌شود!",
    assignedTo: "محول شده به",
    creator: "ایجادکننده",
    noTasks: "هیچ کاری در این نما وجود ندارد.",
    emptyReminders: "یادآوری برای موعد مقرر ثبت نشده است.",
    welcomeTitle: "روز شما چطور سپری می‌شود، {name}؟",
    welcomeDesc: "به کاریزما خوش آمدید! پس از اتصال به KarizmaBot@ در پیام‌رسان بله، می‌توانید کارهای تیمی، اهداف و یادآورهای خود را بدون نیاز به باز نگه داشتن اپلیکیشن در لحظه هماهنگ و مدیریت کنید.",
    yourPrivateTasks: "کارهای شخصی شما",
    baleConnStatus: "وضعیت اتصال بله",
    syncActive: "همگام‌سازی فعال",
    setupRequired: "نیاز به راه‌اندازی / آفلاین",
    overdueReminders: "یادآورهای معوقه",
    membersCount: "عضو",
    tasksCount: "تسک",
    notificationLog: "دفترچه اعلان‌های سیستم",
    noRecentNotices: "هیچ اعلان جدیدی وجود ندارد.",
    overdueText: "معوقه",
    managePersonalTasks: "مدیریت کارهای شخصی و خصوصی",
    personalPlaceHolder: "مثال: مطالعه مقالات فنی، پروپوزال کاریزما...",
    addTask: "افزودن تسک",
    emptyList: "لیست کارهای شما خالی است",
    dueText: "موعد تحویل:",
    purge: "پاکسازی",
    setPersonalReminders: "تنظیم یادآورها و آلارم‌های شخصی",
    reminderPlaceHolder: "مثال: هماهنگی و تماس با استاد یا مدیر پروژه...",
    setupReminder: "ثبت یادآور تیمی",
    projectGoalObjectives: "اهداف و چشم‌انداز بزرگ تیم",
    currentCategory: "دسته‌بندی فعلی",
    milestoneTargets: "نقاط عطف هدف تیم",
    boardMetrics: "آمارهای بورد تیم",
    totalTasks: "تعداد کل کارهای تیم:",
    workspaceMembers: "اعضای فعال تیم:",
    workspaceNameLabel: "نام تیم",
    workspaceDescLabel: "توضیحات و معرف تیم",
    categoryLabel: "دسته‌بندی موضوعی",
    goalTargetLabel: "هدف بزرگ تیم",
    launchWorkspaceButton: "راه‌اندازی تیم",
    navProfile: "پروفایل من",
    skillsLabel: "مهارت‌های من (برچسب‌ها)",
    addSkillPlural: "مهارت را وارد کرده و Enter بزنید",
    uploadAvatar: "بارگذاری تصویر پروفایل",
    editProfileTitle: "ویرایش پروفایل و اطلاعات کاربری",
    skillsDescription: "حوزه‌های تخصص و مهارت خود را به صورت برچسب مشخص کنید",
    updateProfileButton: "بروزرسانی مشخصات پروفایل",
  },
};

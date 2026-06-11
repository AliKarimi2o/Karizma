# Karizma (کاریزما) — User & Developer Guide

Welcome to **Karizma**, an elite, bilingual (English & Persian) team productivity platform, task board, and AI-assisted planning system. Karizma features persistent cloud-state task synchronization, interactive decision polls, dynamic Gantt timeline scheduling, and a full native integration with **Bale Messenger** to feed real-time alerts, reminders, and notifications straight to chat threads.

This guide provides a comprehensive walkthrough on how to use the platform as an end-user, followed by a logical mapping of the codebase's architecture and task flows to enable continuous development or customization.

---

## 📖 Table of Contents
1. [User Onboarding & Quick Start](#1-user-onboarding--quick-start)
2. [Bale Messenger Sync Guide (@KarizmaBot)](#2-bale-messenger-sync-guide-karizmabot)
3. [Team & Board Management](#3-team--board-management)
4. [Tasks, Subtasks & Discussions](#4-tasks-subtasks--discussions)
5. [Polls, Gantt & Timelines](#5-polls-gantt--timelines)
6. [Personal Spaces (Private Tasks & Reminders)](#6-personal-spaces-private-tasks--reminders)
7. [GapGPT AI Integration](#7-gapgpt-ai-integration)
8. [User Profile Settings & Consolidated Dashboard](#8-user-profile-settings--consolidated-dashboard)
9. [Developer Architecture & Logical Flows](#9-developer-architecture--logical-flows)

---

## 1. User Onboarding & Quick Start

### Step 1: Accessing the App & Authentication
- **Registration**: When starting, users create an account with their **Full Name**, choose a country prefix from the pre-filled selector (e.g., `+98` for Iran), enter their **Phone Number** (formatted, e.g., `9331111111`), enter a secure **Password**, and **Repeat Password** to verify matches.
- **Login**: Existing users select their prefix, enter their remaining Phone Number, and input their Password. Karizma maintains session persistence using standard web tokens (`localStorage.getItem("karizma_token")`).
- **Language Switcher**: At the upper corner of the login form and application sidebar, a toggle switch alternates between **English (EN)** and **Persian (FA)**. It instantly alters the text orientation (supporting Left-to-Right layout for EN and Right-to-Left layout for FA) and translates all headings, labels, button tags, and metric cards.

---

## 2. Bale Messenger Sync Guide (@KarizmaBot)

Karizma includes native integration with a Bale Messenger automated notification bot, allowing you or your team to receive task summaries and alerts on-the-go.

### Step 1: Linking your Account
1. From the main sidebar navigation, select **Bale Bot Link** (روبات پیام‌رسان بله).
2. Copy your unique **Connection Handshake Code** (کد اتصال ایمن کاریزما). This is a token unique to your phone number.
3. Open **Bale Messenger** on your device, search for **`@KarizmaBot`**, and start a conversation.
4. Paste the connection command verbatim in the bot chat (e.g. `/connect YOUR_HANDSHAKE_CODE`).
5. Once complete, the status in Karizma changes immediately to **Bale Connection Active** (اتصال به روبات بله فعال است) with a real-time health indicator.

### Step 2: Testing & Event Alerts
- You can trigger a manual test ping using the "Send Test Message" button to verify your device connection.
- When you set a personal reminder, when a team task near its deadline is assigned to you, or when a collaborative decision poll is completed, the background synchronizer dispatches interactive messages directly into your Bale Messenger window.

---

## 3. Team & Board Management

Teams are secure environments housing a dedicated team's tasks, goals, files, discussions, and schedules.

### Step 1: Launching a Team
1. Locate **Active Teams** on the Dashboard and click **Create Team** (ایجاد تیم جدید).
2. Set a **Team Name** (e.g. `Qwen NLP Laboratory`, `Core Startup Deck`).
3. Describe the **Project Goal** or **Milestones** (e.g. `Prepare prototype deck for investors`).
4. Apply a metadata tag option: **Engineering**, **Academic / Research**, **Startup**, or **General**.
5. Click **Launch Team** to instantly populate your dashboard with a fully localized productivity hub.

### Step 2: Onboarding Team Members
1. Within any active team, select the **Members** (اعضای تیم) sub-tab.
2. Enter a new member's Phone Number and click **Add Member**.
3. Members can be promoted or assigned custom governance roles to define permission levels:
   - `Viewer`: Read-only access to files, Gantt tables, and task statuses.
   - `Member`: Default team executor who can create/claim tasks.
   - `Manager`: Project lead who can delete items, design polls, and run co-pilot commands.
   - `Owner/Administrator`: Maximum governance.

---

## 4. Tasks, Subtasks & Discussions

The centerpiece of any team is its **Kanban & List Board**.

### Step 1: Creating Team Tasks
- Open the **Tasks & Board** tab.
- Click **Add Task** to input title details, description scope, priority metrics (`Low`, `Medium`, `High`, `Critical`), assign responsible executors, and define deadlines.

### Step 2: Interactive Kanban Workflows
- Change status on any task instantly (move from `To Do` to `In Progress`, `Waiting`, `Done` or `Cancelled`).
- Click on any task card to enter its **Detail Sandbox Panel**.

### Step 3: Granular Checklists (Subtasks)
- Inside the detail panel, you can write discrete milestone milestones as subtasks (e.g. `Draft methodology section`, `Run hyperparameter optimization`).
- Checking progress elements updates visual meter percentage bars automatically.

### Step 4: Discussion Thread
- The detail panel also integrates post comments. Team members write instant notes directly tied to specific issues to record peer feedback or code specs seamlessly.

---

## 5. Polls, Gantt & Timelines

### Decisions Center (Polls & Announcements)
- Lead teams with professional **Decision Polls** (e.g., `Should we shift the API from REST to WebSockets?`).
- Members vote interactively. Results render with progressive percentage metrics.
- Managers post official project **Announcements** that stay pinned on the group wall.

### Timeline Scheduling (Gantt Chart)
- Head to **Timeline Schedule (Gantt)**.
- Task durations are estimated, and dependencies are plotted on an interactive, responsive chronological Gantt SVG diagram dynamically rendered based on real dates.
- Color codes instantly map milestones based on status (`Done` as emerald green, `Critical` overdue items as crimson red, etc.).

---

## 6. Personal Spaces (Private Tasks & Reminders)

Keep your independent checklist and alarm schedules isolated from collaborative team noise.

- **Private Todo Lists**: Add simple private tasks on the **My Tasks** sub-module. Complete them dynamically or purge them instantly when finished.
- **Personal Alarms / Reminders**: Create time-sensitive alarms with exact date/time fields under the **Reminders** module. Karizma checks timestamps periodically and sends corresponding Bale warnings immediately.

---

## 7. GapGPT AI Integration

The platform co-pilot, **GapGPT Deep Insights engine**, assists with team-wide planning using Gemini models:

- **Summarize Workspace**: Instantly audits active task balances and formats brief executive status profiles.
- **Find Technical Risks**: Analyzes active deadlines, estimating bottleneck patterns or potential dependency issues.
- **Suggest Solution Actions**: Synthesizes action recommendations for lagging bottlenecks.
- **Generate Sprint Report**: Summarizes completed milestones vs overdue items, formatting professional progress reports.

---

## 8. User Profile Settings & Consolidated Dashboard

Karizma features a comprehensive personal customization space and a cohesive main workspace:

- **Centralized Dashboard (Dashboard Sub-Tab)**: Displays personal productivity charts, an interactive Private Todo Manager (My Tasks), and upcoming alarm/alert configs (Reminders). Real-time calendar events, overdue tasks, and reminders are consolidated on a single, easy-to-use homepage dashboard.
- **Bespoke Profile Customizer (User Profile Sub-Tab)**:
  - **Dynamic Skills & Tags**: Allows users to input professional capability tags (e.g., `NodeJS`, `React`, `AI`, `Data Science`) and display them on their profile.
  - **Profile Photo Upload**: Real-time image asset upload (supports JPG, PNG) and instantaneous rendering.
  - **Account Verification & Editing**: Instant client-side verification to update standard details, display name, registered phone prefix, or secure credentials (with repeated matching confirmation).

---

## 9. Developer Architecture & Logical Flows

Karizma's frontend is an elegant React SPA powered by Vite and styled using Tailwind. It communicates seamlessly with an Express server hosting the API gateways.

### Core File Structure
- `/src/App.tsx`: The primary orchestrator. Houses authenticated lifecycle checks, language direction parameters (`rtl`/`ltr`), data collection states, and acts as the parent navigation layout dispatcher.
- `/src/translations.ts`: Stores bilingual definition records (`en` vs `fa` sets). It defines the type contract `TranslationSet` and maps dictionary values sequentially.
- `/src/components/TaskBoard.tsx`: Manages Kanban and List states, creating task forms, dragging columns, and editing subtask states.
- `/src/components/GanttChart.tsx`: Dynamically parses dates into scalable HTML/SVG time blocks to project duration charts.
- `/src/components/AIAssistant.tsx`: Dispatches commands directly to server-side AI routes and renders Markdown responses.
- `/src/components/BalePanel.tsx`: Houses instructions, connection statuses, test trigger tools, and disconnect flows.

### Dynamic RTL Text-Flow Logical Guard
RTL formatting is enforced using dynamic DOM binding:
1. When the user sets the language state `setLang("fa")`, the wrapper div receives classes `rtl`, changing the base container context.
2. The HTML `dir="rtl"` attribute is assigned to the authenticated and unauthenticated containers.
3. Standard Flexbox elements flow direction flips naturally.
4. Input forms use logical tailwind definitions like `ps-10` / `pe-4` instead of static `pl-10` / `pr-4` to reposition icons and paddings organically based on direction.

---
 
*For custom backend changes, update endpoints in `server.ts`. For styling additions, declare them globally inside `/src/index.css` under the `@theme` rules.*

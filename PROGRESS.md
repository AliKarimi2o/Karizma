# Karizma Project Progress Tracking

This is the master tracking document and system state log for **Karizma**, a bilingual project-based SaaS Team, productivity, and task management platform with AI planning and Bale Bot integration.

---

## Progress Overview

- [x] **Phase 1: Setup & Project Initialization**
- [x] **Phase 2: Database Schema & Migrations**
- [x] **Phase 3: Backend Foundations & Auth**
- [x] **Phase 4: Frontend Base & State Management**
- [x] **Phase 5: Personal Dashboard & Personal Tasks**
- [x] **Phase 6: Teams & Core Team Panels**
- [x] **Phase 7: GapGPT Integration**
- [x] **Phase 8: Bale Bot Integration**
- [x] **Phase 9: Polls, Discussions, and File Uploads**
- [x] **Phase 10: Polishing, RTL/LTR Layout, & Production Readiness**
- [x] **Phase 11: Profile Customization & Dashboard Consolidation**

---

## Detailed Task Breakdown

### [x] Phase 1: Setup & Project Initialization
* [x] Update `metadata.json` with app name and description
* [x] Create directory structure for backend endpoints and frontend components
* [x] Define TypeScript standard config and model scopes
* [x] Configure backend packages and bundlers

### [x] Phase 2: Database Schema & Migrations
* [x] Initialize Prisma ORM with SQLite database engine for zero-configuration relational capability
* [x] Define Prisma models:
  * `User`
  * `Workspace`
  * `WorkspaceMember` (with Roles & Permissions)
  * `Task`
  * `Subtask`
  * `Comment`
  * `FileAttachment`
  * `Reminder`
  * `Notification`
  * `Poll`, `PollOption`, `PollVote`
  * `Announcement`
  * `ChatMessage`
  * `AIConversation` / `AIMessage`
  * `ActivityLog`
  * `BaleConnection`
* [x] Run initial migrations to construct the database schema

### [x] Phase 3: Backend Foundations & Auth
* [x] Implement full-stack Express server in `server.ts`
* [x] Establish secure session token flow (JWT) & password hashing using pure-JS `bcryptjs`
* [x] Build auth routes: `/api/auth/register`, `/api/auth/login`, `/api/auth/me`
* [x] Add global request parser and error handler

### [x] Phase 4: Frontend Base & State Management
* [x] Establish bilingual translation contexts and language toggles (Persian / English)
* [x] Install lightweight local state hooks for dynamic UI responsive views
* [x] Formulate navigation rails, sidebars, and basic authentication page shell

### [x] Phase 5: Personal Dashboard & Personal Tasks
* [x] Build beautiful personal landing page displaying daily statistics, overdue markers, and reminder logs
* [x] Create client modules to insert, check, filter, sort, and complete personal items

### [x] Phase 6: Teams & Core Team Panels
* [x] Code Team creation modal and structured layout separating Team Boards from Personal views
* [x] Build role-based membership and permission matrices
* [x] Design fully-interactive Gantt scheduling dashboard displaying timeline items with drag-friendly timeline views
* [x] Implement reliable, state-cleared team deletion flow with proper modal validation

### [x] Phase 7: GapGPT Integration
* [x] Connect Express proxy endpoint calling official GapGPT `/chat/completions` using the model `gapgpt-qwen-3.6`
* [x] Format strict data contexts sending team status to AI for summarization, risk alerts, and workload evaluations

### [x] Phase 8: Bale Bot Integration
* [x] Configure Bale client invoking `tapi.bale.ai` API securely
* [x] Program bot webhook processor handling user connections and command flows (`/start`, `/connect`, `/today`, `/tasks`)
* [x] Create the in-app connection panel showing token connection guides and system messages

### [x] Phase 9: Polls, Discussions, and File Uploads
* [x] Build multi-choice voting structures for research/lab team fast polling
* [x] Code safe file attachments, subtask file logs, and central document repositories

### [x] Phase 10: Polishing, RTL/LTR Layout, & Production Readiness
* [x] Conduct end-to-end full TypeScript/Vite compilations
* [x] Check RTL layouts inside Persian views and LTR margins inside English screens
* [x] Finalize `.env.example` and documentation

### [x] Phase 11: Profile Customization & Dashboard Consolidation
* [x] Design User Settings & Profile panel with profile image download/upload support
* [x] Implement user skills tags management interface
* [x] Implement user profile updates (name, username, password) on the backend
* [x] Move and display personal tasks and reminders inside the central Dashboard view


<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=1a237e,283593,3949ab,5c6bc0&height=220&section=header&text=StudyFlow&fontSize=60&fontColor=ffffff&fontAlignY=38&desc=Academic%20Momentum%20—%20Smart%20Task%20Management%20for%20Students&descAlignY=58&descSize=16&descColor=c5cae9&animation=fadeIn" width="100%"/>

<br/>

<p>
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=for-the-badge&logo=node.js&logoColor=white"/>
  <img src="https://img.shields.io/badge/Frontend-HTML%20%2F%20CSS%20%2F%20JS-1a237e?style=for-the-badge&logo=javascript&logoColor=white"/>
  <img src="https://img.shields.io/badge/Storage-JSON%20Data-5c6bc0?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/License-MIT-1d9e75?style=for-the-badge"/>
  <img src="https://img.shields.io/badge/Status-Live-ba7517?style=for-the-badge"/>
</p>

<br/>

<table>
<tr>
<td align="center" width="200">
<img src="https://img.shields.io/badge/Task%20Tracking-Real--time-1a237e?style=flat-square"/><br/>
<sub>Active, Completed, Pending</sub>
</td>
<td align="center" width="200">
<img src="https://img.shields.io/badge/Priority%20System-3%20Levels-5c6bc0?style=flat-square"/><br/>
<sub>Low, Medium, High</sub>
</td>
<td align="center" width="200">
<img src="https://img.shields.io/badge/Streak%20System-Daily%20Goals-ba7517?style=flat-square"/><br/>
<sub>Consistency tracking</sub>
</td>
<td align="center" width="200">
<img src="https://img.shields.io/badge/Analytics-Weekly%20Progress-1d9e75?style=flat-square"/><br/>
<sub>Visual performance dashboard</sub>
</td>
</tr>
</table>

<br/>

> **StudyFlow** is a full-stack academic task management web application built for students who want to organize their study workload, track deadlines, and maintain consistent academic momentum — all in one clean, intuitive dashboard.

</div>

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Application Pages](#application-pages)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Usage](#usage)
- [Tech Stack](#tech-stack)
- [License](#license)

---

## Overview

StudyFlow is designed around one core idea: students perform better when their tasks, priorities, and progress are visible and organized. The application provides a full academic planner experience — from a public landing page to a personalized authenticated dashboard — with real-time task management, priority classification, deadline tracking, and weekly performance analytics.

```
┌────────────────────────────────────────────────────────────────────┐
│                      StudyFlow — Core Flow                         │
│                                                                    │
│   Student visits landing page                                      │
│           │                                                        │
│           ▼                                                        │
│   Registers / Logs in                                              │
│           │                                                        │
│           ▼                                                        │
│   Personal Dashboard loads                                         │
│           │                                                        │
│           ├──▶  Add study tasks with title, subject, deadline      │
│           ├──▶  Set priority: Low / Medium / High                  │
│           ├──▶  Mark tasks complete as you progress                │
│           ├──▶  View Today's Focus and pending items               │
│           └──▶  Track weekly progress and streak                   │
└────────────────────────────────────────────────────────────────────┘
```

---

## Features

**Task Management**
- Create study tasks with title, subject, description, due date, and estimated study time
- Quick-add task input directly from the dashboard
- Edit and delete tasks at any time
- Filter tasks by: All, Pending, High Priority, Completed

**Priority System**
- Three-level classification: Low, Medium, High
- Priority badges visible on every task card
- Sort tasks by date or priority

**Progress Tracking**
- Live stat cards: Active Tasks, Completed, Pending, Deadlines
- Weekly progress ring with percentage completion
- Goal Efficiency indicator
- Daily streak counter to maintain consistency

**Schedule and Resources**
- Dedicated schedule view for time-based planning
- Resources section for academic reference material

**User Experience**
- Light and dark mode toggle
- Responsive layout for desktop and mobile
- Clean sidebar navigation with account-aware header
- Personalized greeting with username

---

## Application Pages

### Landing Page
```
┌────────────────────────────────────────────────────────────────┐
│  Navigation: Dashboard | Resources | Schedule | Login/Register │
├────────────────────────────────────────────────────────────────┤
│                                                                │
│   Hero Section                                                 │
│   "Manage your study tasks efficiently"                        │
│   Get Started  |  View Demo                                    │
│                                                                │
├────────────────────────────────────────────────────────────────┤
│  Features Section — Smart Tools for Modern Learning            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │ Add Study    │  │ Assign       │  │ Track        │        │
│  │ Tasks        │  │ Priority     │  │ Progress     │        │
│  │              │  │ Levels       │  │ Dynamically  │        │
│  └──────────────┘  └──────────────┘  └──────────────┘        │
├────────────────────────────────────────────────────────────────┤
│  CTA: "Ready to master your semester?"                         │
│  Start Your Free Trial                                         │
├────────────────────────────────────────────────────────────────┤
│  Footer: Product | Support | Connect                           │
└────────────────────────────────────────────────────────────────┘
```

### Dashboard
```
┌──────────────┬─────────────────────────────────────────────────┐
│              │  Search tasks or subjects...        alyabbas11  │
│  StudyFlow   ├─────────────────────────────────────────────────┤
│              │                                                  │
│  Dashboard   │  Welcome back, alyabbas11!    [ 5 Day Streak ]  │
│  Schedule    │                                                  │
│  Tasks       │  ┌──────────┐ ┌──────────┐ ┌──────┐ ┌───────┐  │
│  Analytics   │  │ Active   │ │Completed │ │Pend. │ │Dead.  │  │
│              │  │ Tasks    │ │          │ │Tasks │ │lines  │  │
│              │  └──────────┘ └──────────┘ └──────┘ └───────┘  │
│  + Add Task  │                                                  │
│              │  Today's Focus          │  Weekly Progress      │
│  Help        │  [ task list ]          │  [ progress ring ]    │
│  Logout      │  + Quick add a task...  │  Goal Efficiency      │
└──────────────┴─────────────────────────────────────────────────┘
```

### Tasks View
```
┌──────────────────────────────────────────────────────────────────┐
│  Master Your Tasks                          Sort by Date | Filter│
│  You have 2 tasks due this week.                                 │
│                                                                  │
│  Quick Filters: [ All Tasks ] [ Pending ] [ High Priority ]      │
│                 [ Completed ]                                    │
│                                                                  │
│  ┌───────────────────────┐  ┌───────────────────────┐           │
│  │ ACADEMIC PRIORITY     │  │ CRITICAL PRIORITY     │           │
│  │ Explore Dashboard     │  │ Create First Task     │           │
│  │ Due Tomorrow    edit  │  │ 8 Jun 2026      edit  │           │
│  └───────────────────────┘  └───────────────────────┘           │
└──────────────────────────────────────────────────────────────────┘
```

---

## System Architecture

```
╔══════════════════════════════════════════════════════════════════╗
║                  StudyFlow — System Architecture                 ║
╠══════════════════════════════════════════════════════════════════╣
║                                                                  ║
║   Browser (Client)                                               ║
║   ┌─────────────────────────────────────────────────────────┐   ║
║   │  HTML Pages  │  CSS Styles  │  JavaScript (client-side) │   ║
║   └───────────────────────┬─────────────────────────────────┘   ║
║                           │  HTTP Requests                       ║
║                           ▼                                      ║
║   Server (Node.js + Express)                                     ║
║   ┌─────────────────────────────────────────────────────────┐   ║
║   │  server.js                                              │   ║
║   │  ├── Static file serving (public/)                      │   ║
║   │  ├── Auth routes  (register / login / logout)           │   ║
║   │  ├── Task routes  (create / read / update / delete)     │   ║
║   │  └── Session management                                 │   ║
║   └───────────────────────┬─────────────────────────────────┘   ║
║                           │                                      ║
║                           ▼                                      ║
║   Data Layer                                                     ║
║   ┌─────────────────────────────────────────────────────────┐   ║
║   │  data/                                                  │   ║
║   │  ├── users.json    (user accounts)                      │   ║
║   │  └── tasks.json    (task records per user)              │   ║
║   └─────────────────────────────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════╝
```

---

## Project Structure

```
StudyFlow-Academic-Momentum/
│
├── data/
│   ├── users.json              # Registered user accounts
│   └── tasks.json              # Task records stored per user
│
├── public/
│   ├── index.html              # Landing page
│   ├── dashboard.html          # Main authenticated dashboard
│   ├── login.html              # Login page
│   ├── register.html           # Registration page
│   ├── css/
│   │   └── styles.css          # Global stylesheet
│   └── js/
│       └── app.js              # Client-side JavaScript
│
├── server.js                   # Express server — routes and logic
├── package.json                # Project metadata and dependencies
├── package-lock.json           # Locked dependency tree
├── .gitignore                  # Excludes node_modules
└── README.md
```

---

## Installation

### Prerequisites

- Node.js v16 or higher
- npm (comes with Node.js)

### Setup

```bash
# Clone the repository
git clone https://github.com/aly-abbas11/StudyFlow-Academic-Momentum.git
cd StudyFlow-Academic-Momentum

# Install dependencies
npm install

# Start the server
node server.js
```

Then open your browser and go to:

```
http://localhost:3000
```

---

## Usage

**Register an account** on the landing page, then log in to access your personal dashboard.

From the dashboard you can:

```
1. Click "+ Add New Task" to create a study task
   — Enter title, subject, due date, priority, and estimated time

2. View your tasks under the Tasks section
   — Filter by All / Pending / High Priority / Completed

3. Check Today's Focus on the dashboard
   — See what needs attention right now

4. Monitor Weekly Progress
   — Track your completion percentage and goal efficiency

5. Mark tasks complete as you finish them
   — Watch your streak and progress ring update
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Server Framework | Express.js |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Data Storage | JSON flat files |
| Authentication | Session-based (server-side) |
| Hosting | Localhost / deployable to any Node host |

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.

---

<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=1a237e,283593,3949ab,5c6bc0&height=120&section=footer&animation=fadeIn" width="100%"/>

<sub>Web Technologies Lab — OEL Project | Air University Lahore, Spring 2026</sub>

</div>

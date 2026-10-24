# User Manual

**Document Title:** User Manual  
**System Name:** EEC IT Asset & Ticket Management System  
**Version:** 1.0  
**Date:** October 2026  
**Audience:** All end users (Requesters, Technicians, Managers, Super Admins)

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Getting Started](#2-getting-started)
3. [Dashboard Overview](#3-dashboard-overview)
4. [Requester Guide](#4-requester-guide)
5. [Technician Guide](#5-technician-guide)
6. [Manager (Admin) Guide](#6-manager-admin-guide)
7. [Notifications](#7-notifications)
8. [Calendar View](#8-calendar-view)
9. [Help Center and Chatbot](#9-help-center-and-chatbot)
10. [Settings](#10-settings)
11. [Telegram Integration](#11-telegram-integration)

---

## 1. Introduction

The **EEC IT Asset & Ticket Management System** is a web-based platform for managing IT maintenance requests, tracking assets, and coordinating support across multiple departments.

**What you can do with this system:**
- Submit and track IT maintenance and support requests
- View the status of your tickets in real-time
- Receive notifications via the app, SMS, and Telegram
- Browse a help center with AI-free keyword search
- Use the built-in chatbot to find answers quickly

**Access the system at:** `https://app.yourdomain.com`

---

## 2. Getting Started

### 2.1 Creating an Account

1. Navigate to the system URL in your browser.
2. On the login page, click **"Register"** or **"Create an account"**.
3. Fill in the registration form:
   - **Full Name** — your name as it will appear in the system
   - **Email Address** — your work email (used for login)
   - **Password** — minimum 8 characters
   - **Confirm Password**
   - **Phone Number** (optional) — for SMS notifications
   - **Telegram Username** (optional) — for Telegram notifications
   - **Location** (optional) — your building/branch
4. Click **"Register"**.

> **Important:** Your account will be in **"Pending Approval"** status after registration. You cannot log in until an administrator approves your account. You will receive a notification once approved.

### 2.2 Logging In

1. Enter your **email** and **password**.
2. Click **"Login"**.

If your account is still pending, you will see a message: *"Your account is awaiting admin approval."*

### 2.3 Logging Out

Click your profile avatar in the top-right corner and select **"Logout"**, or navigate to **Settings → Sign Out**.

### 2.4 Forgot / Change Password

To change your password after logging in:
1. Go to **Settings → Security**.
2. Enter your **current password**.
3. Enter and confirm your **new password**.
4. Click **"Update Password"**.

---

## 3. Dashboard Overview

After logging in, you land on the **Dashboard** (`/`). The dashboard shows:

| Widget | Description |
|--------|-------------|
| **Ticket Summary** | Count of your active, completed, and pending tickets |
| **Recent Tickets** | Latest ticket activity |
| **Asset Overview** | (Admins) Asset status distribution |
| **Performance Metrics** | (Admins/Technicians) Completion rates and averages |
| **Quick Actions** | Shortcuts to submit a request, view tickets |

The **sidebar** on the left provides navigation to all sections. It adapts based on your role — some menu items are only visible to Admins and Super Admins.

---

## 4. Requester Guide

As a **Requester**, your primary activities are submitting support requests and tracking their progress.

### 4.1 Submitting a New Request

1. Click **"Requests"** in the sidebar (or the **"New Request"** button on the dashboard).
2. Fill in the **New Request Form**:

   | Field | Description | Required |
   |-------|-------------|----------|
   | **Title** | Brief summary of the issue (e.g., "Laptop keyboard not working") | ✅ |
   | **Type** | Category: Maintenance, Repair, Installation, Inspection, Other | ✅ |
   | **Support Category** | IT Support, SAP/ERP, or General (routes to the right team) | ❌ |
   | **Priority** | Low, Medium, High, Critical | ❌ |
   | **Scheduled Date** | When you need the work done | ✅ |
   | **Description** | Detailed description of the issue | ❌ |
   | **Asset** | The affected asset (optional) | ❌ |
   | **Attachments** | Upload screenshots or documents (max 5 files, 5MB each) | ❌ |
   | **Recurring** | Set if this is a periodic request | ❌ |

3. Click **"Submit Request"**.

> **Limit:** You may have a maximum of **3 active requests** at the same time. Once existing requests are completed, you can submit new ones.

### 4.2 Tracking Your Requests

1. Click **"Requests"** in the sidebar to see all your submitted tickets.
2. Each ticket shows its **current status**:

   | Status | Meaning |
   |--------|---------|
   | 🔵 **Submitted** | Awaiting manager approval |
   | ✅ **Approved** | Approved; awaiting technician assignment |
   | ❌ **Rejected** | Not approved (check the rejection reason) |
   | 👷 **Assigned** | A technician has been assigned |
   | 🔧 **In Progress** | Work is underway |
   | 🔍 **Completed – Pending Review** | Work done; awaiting your review |
   | ✔️ **Completed** | Issue resolved |
   | 🔄 **Reopened** | Completion was not accepted; work continues |
   | 🚫 **Cancelled** | Request cancelled |

3. Click on any ticket to view its **full details** including technician notes, actions taken, and timeline.

### 4.3 Reviewing Ticket Completion

When your ticket reaches **"Completed – Pending Review"** status:
1. You will receive an in-app notification (and SMS if configured).
2. Open the ticket and review the work that was done.
3. Click **"Approve Completion"** if the issue is resolved, or **"Request Rework"** and provide notes if it needs more work.

### 4.4 Submitting Feedback

After a ticket is marked **"Completed"**:
1. Open the ticket.
2. Click **"Submit Feedback"**.
3. Select a **star rating** (1–5 stars).
4. Optionally, enter a **comment** (confidential — visible to managers only, not technicians).
5. Click **"Submit"**.

---

## 5. Technician Guide

As a **Technician**, you receive assigned tickets and resolve them.

### 5.1 Viewing Assigned Tickets

1. Click **"Tickets"** in the sidebar.
2. You will see only tickets assigned to you.
3. Use the filter bar to narrow by **status**, **priority**, or **support category**.

### 5.2 Starting Work on a Ticket

1. Open an **"Assigned"** ticket.
2. Click **"Start Work"**.
3. The ticket status changes to **"In Progress"** and the start time is recorded.

### 5.3 Updating Progress

While working on a ticket, you can log your progress:
1. Open the ticket.
2. Click **"Update Progress"**.
3. Fill in:
   - **Diagnosis** — What you found
   - **Actions Taken** — What you did
   - **Spare Parts** — List any parts used
   - **Estimated Duration** — Updated time estimate in minutes
4. Click **"Save"**.

### 5.4 Marking a Ticket Complete

1. Open an **"In Progress"** ticket.
2. Click **"Mark as Complete"**.
3. Fill in the **completion form**:
   - **Actions Taken** (required) — Full description of work done
   - **Spare Parts** — Final parts list
   - **Actual Duration** — Time spent in minutes
4. Click **"Submit"**.

The ticket moves to **"Completed – Pending Review"** and the manager/requester is notified.

### 5.5 Viewing Reports

Technicians have access to the **Reports** page (`/reports`) where they can see:
- Ticket statistics filtered by date, status, type, and priority
- Asset reports

---

## 6. Manager (Admin) Guide

As a **Manager (Admin)**, you oversee ticket workflows for your support department.

### 6.1 Reviewing Submitted Tickets

1. Click **"Tickets"** in the sidebar.
2. Tickets submitted to your department appear at the top.
3. Open a **"Submitted"** ticket to review it.

### 6.2 Approving a Ticket

1. Open a **"Submitted"** ticket.
2. Click **"Approve"**.
3. Confirm the approval.

The requester receives an in-app notification and SMS.

### 6.3 Rejecting a Ticket

1. Open a **"Submitted"** ticket.
2. Click **"Reject"**.
3. Enter a **rejection reason** (required).
4. Confirm.

The requester is notified with the rejection reason.

### 6.4 Assigning a Technician

1. Open an **"Approved"** or **"Submitted"** ticket.
2. Click **"Assign Technician"**.
3. Select a technician from the list.

> **Domain Isolation:** The system only allows technicians matching the ticket's support category:
> - SAP tickets → SAP technicians only
> - IT Support tickets → IT Support technicians only
> - General tickets → General/Facility technicians

4. Click **"Assign"**.

### 6.5 Reviewing Ticket Completion

1. When a technician marks a ticket complete, you receive a notification.
2. Open the **"Completed – Pending Review"** ticket.
3. Review the technician's notes, actions taken, and any spare parts.
4. Click **"Approve Completion"** or **"Reopen"** with notes.

### 6.6 Transferring a Ticket

If a ticket was submitted to the wrong department:
1. Open the ticket.
2. Click **"Transfer"**.
3. Select the correct **Support Category**.
4. Provide an optional **reason**.
5. Click **"Transfer"**.

The ticket is re-routed to the correct department manager automatically.

### 6.7 Managing Assets

Navigate to **"Assets"** (`/assets`) to:

- **View** all IT assets with their status and assignments
- **Add** new assets (click **"Add Asset"**)
- **Edit** asset details (click on an asset → **"Edit"**)
- **Delete** an asset
- **Import** assets in bulk from a CSV file

**CSV Import Format:** The CSV must include these columns: `name`, `type`, `serial_number`, `purchase_date`, `location`, `status`. Optional: `warranty_expiry`, `notes`.

### 6.8 Managing Users

Navigate to **"Users"** (`/users`) to:
- View all registered users with their roles and status
- **Approve** or **Reject** pending user registrations
- **Create** new user accounts directly
- Change a user's **role** or **profile details**

### 6.9 Managing FAQs

Navigate to **"FAQs"** (`/faqs`) to:
- Create and edit help articles for the knowledge base
- Publish/unpublish articles (only published articles are visible to regular users)
- Set article categories and display order

### 6.10 Managing Locations and Departments

- **Locations** (`/locations`) — Manage physical office locations for user assignment
- **Departments** (`/departments`) — Manage organizational departments
- Both support CSV import

### 6.11 Preventive Maintenance Schedules

Navigate to **"Schedules"** (`/schedules`) to:
- Create recurring maintenance schedules for specific assets
- Set frequency (daily, weekly, monthly, quarterly, yearly)
- Enable/disable schedules

### 6.12 Activity Logs

Navigate to **"Activity Logs"** (`/activity-logs`) to view a complete audit trail of all system actions with timestamps and user attribution.

### 6.13 Reports

Navigate to **"Reports"** (`/reports`) to:
- View ticket and asset analytics with charts
- Filter by date range, status, type, priority, technician
- **Export data to CSV** for external analysis

---

## 7. Notifications

### 7.1 In-App Notifications

The **bell icon** 🔔 in the top navigation bar shows your unread notification count.

Click the bell to open the **Notifications Panel** or navigate to **"Notifications"** (`/notifications`) for the full list.

**Notification Events by Role:**

| Event | Requester | Technician | Manager | Super Admin |
|-------|-----------|------------|---------|-------------|
| New registration submitted | | | ✅ | ✅ |
| Account approved | ✅ | | | |
| Ticket submitted | | | ✅ | ✅ |
| Ticket approved | ✅ | ✅ | | |
| Ticket rejected | ✅ | | | |
| Technician assigned | ✅ | ✅ | | |
| Ticket completed (pending review) | ✅ | | ✅ | ✅ |
| Completion approved | | ✅ | | |
| Ticket reopened | ✅ | | ✅ | ✅ |
| Feedback received | | ✅ | ✅ | |

### 7.2 Marking Notifications as Read

- Click on a single notification to open it (auto-marks as read).
- Click **"Mark All as Read"** to clear all unread notifications at once.

---

## 8. Calendar View

Navigate to **"Calendar"** (`/calendar`) to see a monthly/weekly calendar view of:
- Scheduled maintenance tickets
- Preventive maintenance schedules

This helps you plan and visualize upcoming work.

---

## 9. Help Center and Chatbot

Navigate to **"Help"** (`/help`) to access:

### 9.1 Help Center

Browse published FAQ articles organized by category. Use the **search bar** to find articles by keyword.

### 9.2 AI-Free Chatbot

The floating **chat bubble** 💬 in the bottom-right corner opens the chatbot.

**How it works:**
- Type your question in plain language.
- The chatbot searches published FAQ articles for keyword matches.
- Up to 3 matching articles are returned.
- If no match is found, you are prompted to submit a ticket.

**The chatbot does NOT use external AI.** It relies entirely on the FAQ knowledge base. The better the FAQ content, the more helpful it is.

**Example questions:**
- "How do I connect to the VPN?"
- "My printer is not working"
- "How do I reset my password?"

---

## 10. Settings

Navigate to **"Settings"** (`/settings`) to manage:

### 10.1 Profile Settings
- Update your name, phone number, department, and location
- Upload a profile picture
- Update your Telegram username

### 10.2 Security
- Change your password

### 10.3 Notifications Preferences
- *(Currently managed through profile — SMS notifications are sent to the phone number on your profile)*

### 10.4 Theme
- Toggle between **light** and **dark** mode

---

## 11. Telegram Integration

Linking your Telegram account allows you to receive instant notifications directly in the Telegram app.

### 11.1 Linking Your Telegram Account

1. Go to **Settings → Telegram** (or find the Telegram section in your profile settings).
2. Click **"Link Telegram Account"**.
3. A **deep link** is generated (valid for 15 minutes).
4. Click the link — it opens the Telegram app and starts the bot.
5. Send `/start` to the bot (the token is automatically included).
6. You will see a confirmation message: *"Your Telegram account has been linked successfully!"*

### 11.2 Unlinking Your Telegram Account

1. Go to **Settings → Telegram**.
2. Click **"Unlink Telegram Account"**.
3. Confirm the action.

### 11.3 What Notifications Are Sent via Telegram?

You will receive Telegram messages for:
- Account approval confirmation
- New ticket submitted (managers/super admins)
- Ticket approved/rejected (requesters)
- Technician assigned (requesters and technicians)
- Ticket completed (managers/super admins)

> **Note:** Telegram notifications require the system's Telegram bot to be configured by the administrator.

---

## Appendix A: Ticket Priority Guide

| Priority | Use When |
|----------|---------|
| **Low** | Non-urgent, can wait several days |
| **Medium** | Normal business impact, standard SLA |
| **High** | Significant impact on productivity |
| **Critical** | System down, business operations halted |

## Appendix B: Support Category Guide

| Category | Use When |
|----------|---------|
| **IT Support** | Hardware, network, software issues on computers, printers, etc. |
| **SAP / ERP** | Issues with SAP software, ERP system, business application problems |
| **General** | Facility maintenance, non-IT issues, general workplace support |

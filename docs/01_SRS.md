# Software Requirements Specification (SRS)

**Document Title:** Software Requirements Specification  
**System Name:** EEC IT Asset & Ticket Management System  
**Version:** 1.0  
**Date:** October 2026  
**Status:** Based on Implemented Codebase

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Overall Description](#2-overall-description)
3. [System Users and Roles](#3-system-users-and-roles)
4. [Functional Requirements](#4-functional-requirements)
5. [Non-Functional Requirements](#5-non-functional-requirements)
6. [External Interface Requirements](#6-external-interface-requirements)
7. [Business Rules and Constraints](#7-business-rules-and-constraints)
8. [Incomplete / Planned Features](#8-incomplete--planned-features)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the functional and non-functional requirements for the **EEC IT Asset & Ticket Management System** (hereafter referred to as "the System"). It is intended for developers, system administrators, testers, and business stakeholders.

### 1.2 Scope

The System is a web-based application designed for enterprise IT departments to:

- Manage and track physical IT assets (computers, printers, servers, network devices).
- Handle maintenance and support ticket workflows across multiple departments and support categories.
- Facilitate multi-channel notifications (in-app, SMS, Telegram, Email).
- Provide reporting and analytics on asset health and technician performance.
- Support preventive maintenance scheduling.

### 1.3 Definitions and Abbreviations

| Term | Definition |
|------|-----------|
| **Ticket** | A maintenance or support request submitted by a user |
| **Requester** | A user who submits a maintenance/support request |
| **Technician** | A user who resolves assigned tickets |
| **Admin (Manager)** | A department manager who approves/rejects tickets and assigns technicians |
| **Super Admin** | Highest authority; manages the entire system and other administrators |
| **SPA** | Single Page Application (the React frontend) |
| **API** | Application Programming Interface (the Laravel backend) |
| **SMS** | Short Message Service, delivered via an Ethiopian telecom gateway |
| **RBAC** | Role-Based Access Control |
| **UUID** | Universally Unique Identifier, used as primary keys for core entities |

### 1.4 References

- [CPANEL_DEPLOYMENT.md](../CPANEL_DEPLOYMENT.md) — Production deployment guide
- [SMS_SETUP.md](../SMS_SETUP.md) — SMS gateway configuration
- [TELEGRAM_SETUP.md](../TELEGRAM_SETUP.md) — Telegram bot integration
- [EMAIL_SETUP.md](../EMAIL_SETUP.md) — Email configuration
- [microsoft_graph_email_integration.md.resolved](../microsoft_graph_email_integration.md.resolved) — Microsoft Graph email setup

---

## 2. Overall Description

### 2.1 Product Perspective

The System consists of two independently deployed components:

1. **Backend (REST API):** A Laravel 12 application serving JSON responses, handling authentication, business logic, database operations, and external integrations.
2. **Frontend (SPA):** A React 18 + TypeScript application that communicates exclusively with the backend API.

Both components are deployed on cPanel shared hosting, typically on separate subdomains (e.g., `api.domain.com` and `app.domain.com`).

### 2.2 Product Functions (Summary)

- User registration with admin approval workflow
- Role-based access control (4 roles)
- IT asset registry with CSV import
- Multi-step ticket lifecycle management (10 statuses)
- Intelligent ticket routing to department managers
- Preventive maintenance scheduling
- Multi-channel notifications (in-app, SMS, Telegram, Email)
- FAQ management with an AI-free keyword chatbot
- Reports and CSV data exports
- Activity audit logging
- Telegram bot integration for account linking and notifications

### 2.3 User Classes and Characteristics

| User Class | Technical Proficiency | Primary Use Case |
|------------|-----------------------|-----------------|
| Requester | Low | Submit and track maintenance requests |
| Technician | Medium | View and resolve assigned tickets |
| Admin (Manager) | Medium-High | Approve tickets, assign technicians, manage department |
| Super Admin | High | Full system administration, user management |

### 2.4 Operating Environment

- **Server OS:** Linux (cPanel compatible)
- **PHP Version:** 8.2 or higher
- **Database:** SQLite (development) / MySQL (production)
- **Web Server:** Apache (with `.htaccess` mod_rewrite)
- **Node.js:** Required only for building the frontend (not runtime)
- **Browser Support:** Modern browsers supporting ES2020+ (Chrome, Firefox, Edge, Safari)

---

## 3. System Users and Roles

### 3.1 Role Definitions

The System implements Role-Based Access Control (RBAC) via the **Spatie Laravel Permission** package.

#### 3.1.1 Requester

- Default role assigned to all self-registered users after admin approval.
- Can submit up to **3 simultaneous active requests**.
- Can view only their own tickets.
- Can cancel their own submitted/reopened tickets.
- Can review ticket completion (approve or request rework).
- Can submit star ratings and feedback comments after ticket completion.

#### 3.1.2 Technician

- Assigned by managers to tickets within their support domain.
- Can view tickets assigned to them.
- Can start work, update progress (diagnosis, actions taken, spare parts), and mark tickets complete.
- Sees ticket feedback ratings but **not** feedback comments (confidential to managers).
- Can access the Reports page.

#### 3.1.3 Admin (Manager)

- Reviews and approves or rejects submitted tickets in their support category.
- Assigns technicians to approved tickets.
- Reviews technician completions.
- Manages assets, locations, departments, users (within their team scope), FAQs.
- Can access activity logs, reports, preventive maintenance schedules.
- Can transfer tickets to other departments.
- Can create technician accounts only within their own support domain.
- Cannot create other Admin or Super Admin accounts.

#### 3.1.4 Super Admin

- Full system access with no domain restrictions.
- Can approve/reject pending user registrations.
- Can create accounts for all roles including other Admins and Super Admins.
- Receives oversight notifications for all ticket activities.
- Has unrestricted visibility of all tickets across all departments.

### 3.2 Permission Matrix

| Permission | Requester | Technician | Admin | Super Admin |
|-----------|-----------|------------|-------|-------------|
| view assets | ✅ | ✅ | ✅ | ✅ |
| manage assets | ❌ | ❌ | ✅ | ✅ |
| view tickets | ✅ | ✅ | ✅ | ✅ |
| manage tickets | ❌ | ✅* | ✅ | ✅ |
| manage users | ❌ | ❌ | ✅ | ✅ |

> *Technicians can update ticket progress but cannot approve/reject/assign.

---

## 4. Functional Requirements

### 4.1 Authentication and User Management

| ID | Requirement | Status |
|----|------------|--------|
| FR-AUTH-01 | Users can self-register with name, email, password, optional phone, Telegram username, and location | ✅ Implemented |
| FR-AUTH-02 | Registered users start with `pending` status and cannot login until approved | ✅ Implemented |
| FR-AUTH-03 | Super Admins and Admins receive in-app and email notifications on new registrations | ✅ Implemented |
| FR-AUTH-04 | Admins and Super Admins can approve or reject pending users | ✅ Implemented |
| FR-AUTH-05 | Approved users receive a Telegram notification (if linked) | ✅ Implemented |
| FR-AUTH-06 | Rejected users receive an in-app error notification | ✅ Implemented |
| FR-AUTH-07 | Admins and Super Admins can directly create user accounts (bypassing the pending state) | ✅ Implemented |
| FR-AUTH-08 | Authentication uses token-based sessions (Laravel Sanctum Bearer tokens) | ✅ Implemented |
| FR-AUTH-09 | Users can update their own passwords | ✅ Implemented |
| FR-AUTH-10 | Optional auto-approval after N minutes (configurable via `REGISTRATION_AUTO_APPROVE_AFTER_MINUTES`) | ✅ Implemented |
| FR-AUTH-11 | Session timeout handling on the frontend | ✅ Implemented |
| FR-AUTH-12 | Admin managers can only create technicians within their own support domain (SAP or IT) | ✅ Implemented |

### 4.2 Asset Management

| ID | Requirement | Status |
|----|------------|--------|
| FR-ASSET-01 | Admins can create, view, update, and delete IT assets | ✅ Implemented |
| FR-ASSET-02 | Assets have fields: name, type, serial number, purchase date, warranty expiry, location, status, assigned user, notes | ✅ Implemented |
| FR-ASSET-03 | Asset types: computer, printer, server, network_device, other | ✅ Implemented |
| FR-ASSET-04 | Asset statuses: active, maintenance, retired, disposed | ✅ Implemented |
| FR-ASSET-05 | Assets can be assigned to a specific user profile | ✅ Implemented |
| FR-ASSET-06 | Assets can be searched by name or serial number | ✅ Implemented |
| FR-ASSET-07 | Assets can be filtered by type and status | ✅ Implemented |
| FR-ASSET-08 | Bulk import of assets from CSV file | ✅ Implemented |
| FR-ASSET-09 | All asset operations are logged in the activity log | ✅ Implemented |
| FR-ASSET-10 | Each asset tracks its associated maintenance tickets | ✅ Implemented |

### 4.3 Maintenance Ticket Workflow

The ticket lifecycle follows a strict state machine with 10 possible statuses:

```
submitted → approved → assigned → in_progress → completed_pending_review → completed
         ↘ rejected                                                       ↗
                                              ← reopened ←
```

| ID | Requirement | Status |
|----|------------|--------|
| FR-TICK-01 | Any authenticated user can submit a maintenance ticket | ✅ Implemented |
| FR-TICK-02 | Requesters are limited to 3 simultaneous active tickets | ✅ Implemented |
| FR-TICK-03 | Tickets have fields: title, description, type, support_category, priority, scheduled_date, asset (optional), attachments | ✅ Implemented |
| FR-TICK-04 | Ticket types: maintenance, repair, installation, inspection, other | ✅ Implemented |
| FR-TICK-05 | Support categories: it_support, sap, general | ✅ Implemented |
| FR-TICK-06 | Ticket priority: low, medium, high, critical | ✅ Implemented |
| FR-TICK-07 | Tickets are automatically routed to the correct department manager upon submission | ✅ Implemented |
| FR-TICK-08 | Admins can approve tickets in `submitted` status | ✅ Implemented |
| FR-TICK-09 | Admins can reject tickets in `submitted` status with a required rejection reason | ✅ Implemented |
| FR-TICK-10 | Admins can assign a technician to approved/submitted tickets | ✅ Implemented |
| FR-TICK-11 | Domain isolation: SAP tickets can only be assigned to SAP technicians | ✅ Implemented |
| FR-TICK-12 | Technicians can start work on assigned tickets | ✅ Implemented |
| FR-TICK-13 | Technicians can update progress (diagnosis, actions taken, spare parts) | ✅ Implemented |
| FR-TICK-14 | Technicians can mark tickets complete; status becomes `completed_pending_review` | ✅ Implemented |
| FR-TICK-15 | Managers, Super Admins, and the original Requester can review ticket completions | ✅ Implemented |
| FR-TICK-16 | Completion review can either approve (→ `completed`) or reopen (→ `reopened`) the ticket | ✅ Implemented |
| FR-TICK-17 | Requesters can submit star ratings (1–5) and optional text feedback after completion | ✅ Implemented |
| FR-TICK-18 | Feedback comments are confidential; technicians see ratings only | ✅ Implemented |
| FR-TICK-19 | Tickets can be transferred between support categories by Admins | ✅ Implemented |
| FR-TICK-20 | Tickets support recurring intervals: daily, weekly, monthly, quarterly, yearly | ✅ Implemented |
| FR-TICK-21 | Attachments (images, PDFs) can be uploaded on ticket creation (max 5 files, 5MB each) | ✅ Implemented |
| FR-TICK-22 | Admins can delete tickets | ✅ Implemented |

### 4.4 Smart Ticket Routing

| ID | Requirement | Status |
|----|------------|--------|
| FR-ROUTE-01 | Upon submission, the system automatically assigns the ticket to the appropriate manager based on `support_category` | ✅ Implemented |
| FR-ROUTE-02 | Routing uses a 3-step resolution: (1) explicit category match, (2) keyword heuristic on department/name/email, (3) fallback to any available admin | ✅ Implemented |
| FR-ROUTE-03 | Routing results are cached for 1–5 minutes to reduce database queries | ✅ Implemented |
| FR-ROUTE-04 | Cache is invalidated when user roles change | ✅ Implemented |
| FR-ROUTE-05 | On ticket transfer, the system re-routes to the manager of the new category | ✅ Implemented |

### 4.5 Preventive Maintenance Schedules

| ID | Requirement | Status |
|----|------------|--------|
| FR-SCHED-01 | Admins can create preventive maintenance schedules linked to specific assets | ✅ Implemented |
| FR-SCHED-02 | Schedules have: title, description, type, frequency, next_run_date, last_run_date, is_active | ✅ Implemented |
| FR-SCHED-03 | Frequency options: daily, weekly, monthly, quarterly, yearly | ✅ Implemented |
| FR-SCHED-04 | A console command `maintenance:check-schedules` exists to generate tickets from due schedules | ⚠️ Exists but not scheduled by default |

### 4.6 Notification System

| ID | Requirement | Channel | Status |
|----|------------|---------|--------|
| FR-NOTIF-01 | In-app notifications for all major ticket events | In-App (DB) | ✅ Implemented |
| FR-NOTIF-02 | Deduplication: identical notifications within 60 seconds are suppressed | In-App | ✅ Implemented |
| FR-NOTIF-03 | SMS notifications for key ticket events | SMS Gateway | ✅ Implemented |
| FR-NOTIF-04 | Telegram notifications for ticket events and account approval | Telegram Bot | ✅ Implemented |
| FR-NOTIF-05 | Email notifications for new user registration (to Super Admins) and ticket approval | Microsoft Graph | ✅ Implemented |
| FR-NOTIF-06 | Users can link their Telegram account via a deep-link token (15-minute expiry) | Telegram | ✅ Implemented |
| FR-NOTIF-07 | Users can unlink their Telegram account | Telegram | ✅ Implemented |
| FR-NOTIF-08 | Users can mark individual notifications as read | In-App | ✅ Implemented |
| FR-NOTIF-09 | Users can mark all notifications as read at once | In-App | ✅ Implemented |

### 4.7 Location and Department Management

| ID | Requirement | Status |
|----|------------|--------|
| FR-ORG-01 | Admins can create, update, and delete locations | ✅ Implemented |
| FR-ORG-02 | Admins can create, update, and delete departments | ✅ Implemented |
| FR-ORG-03 | Locations and departments can be imported via CSV | ✅ Implemented |
| FR-ORG-04 | User profiles can be associated with a location | ✅ Implemented |

### 4.8 FAQ and Chatbot

| ID | Requirement | Status |
|----|------------|--------|
| FR-FAQ-01 | Admins can create, update, publish/unpublish, and delete FAQ articles | ✅ Implemented |
| FR-FAQ-02 | FAQs have: question, answer, category, is_published, sort_order | ✅ Implemented |
| FR-FAQ-03 | Non-admins can only view published FAQs | ✅ Implemented |
| FR-FAQ-04 | A chatbot endpoint accepts user messages and returns keyword-matched FAQ results | ✅ Implemented |
| FR-FAQ-05 | The chatbot handles small talk (greetings, thank-you) without database queries | ✅ Implemented |
| FR-FAQ-06 | The chatbot uses no external AI; it is entirely keyword/scoring based | ✅ Implemented |

### 4.9 Reports and Analytics

| ID | Requirement | Status |
|----|------------|--------|
| FR-REPORT-01 | Ticket report with filters: date range, status, type, priority, asset, technician | ✅ Implemented |
| FR-REPORT-02 | Asset report with filters: status, type, location | ✅ Implemented |
| FR-REPORT-03 | Performance report: total/completed/in-progress/overdue tickets, completion rate, avg completion days, technician stats, avg feedback ratings | ✅ Implemented |
| FR-REPORT-04 | Export tickets to CSV | ✅ Implemented |
| FR-REPORT-05 | Export assets to CSV | ✅ Implemented |
| FR-REPORT-06 | Reports page accessible to Admins and Technicians | ✅ Implemented |

### 4.10 Activity Logging

| ID | Requirement | Status |
|----|------------|--------|
| FR-LOG-01 | All significant operations are logged to an `activity_logs` table | ✅ Implemented |
| FR-LOG-02 | Log entries record: action, model type, model ID, description, and user | ✅ Implemented |
| FR-LOG-03 | Activity logs are viewable by Admins and Super Admins only | ✅ Implemented |

---

## 5. Non-Functional Requirements

### 5.1 Performance

| ID | Requirement |
|----|------------|
| NFR-PERF-01 | Database performance indexes are applied on frequently queried columns (status, priority, scheduled_date, assigned_technician_id, etc.) |
| NFR-PERF-02 | Frontend uses TanStack Query with 5-minute stale time and 10-minute cache retention for optimistic UI |
| NFR-PERF-03 | Manager routing results are cached in the application cache (1–5 minutes) |
| NFR-PERF-04 | Pages are lazy-loaded in the SPA to reduce initial bundle size |
| NFR-PERF-05 | SMS and Telegram messages are dispatched via queued jobs to avoid blocking HTTP responses |

### 5.2 Security

| ID | Requirement |
|----|------------|
| NFR-SEC-01 | All API endpoints (except `/register`, `/login`, and Telegram webhook) require a valid Bearer token |
| NFR-SEC-02 | Passwords are hashed using bcrypt (12 rounds) |
| NFR-SEC-03 | User status (`pending`, `rejected`) is enforced at login; blocked users cannot obtain tokens |
| NFR-SEC-04 | Authorization is enforced via Laravel Policies and Gate checks on every sensitive operation |
| NFR-SEC-05 | CORS is restricted to the configured `FRONTEND_URL` |
| NFR-SEC-06 | No sensitive data (passwords, tokens, API keys) is exposed in API responses |
| NFR-SEC-07 | Admin managers cannot escalate privileges (cannot create Admin/Super Admin accounts) |

### 5.3 Reliability

| ID | Requirement |
|----|------------|
| NFR-REL-01 | In-app notifications are written synchronously (never queued) to ensure delivery even without a queue worker |
| NFR-REL-02 | External notification failures (SMS, Telegram, Email) are caught and logged; they do not fail the API request |
| NFR-REL-03 | User registration, asset creation, and ticket submission use database transactions |

### 5.4 Maintainability

| ID | Requirement |
|----|------------|
| NFR-MAINT-01 | Migrations are idempotent and support rollback |
| NFR-MAINT-02 | The `RolesAndPermissionsSeeder` is safe to run multiple times (`firstOrCreate`) |
| NFR-MAINT-03 | Configuration is externalized via `.env` files |
| NFR-MAINT-04 | Services (SMS, Telegram, MicrosoftGraph, Notifications) are isolated in dedicated service classes |

### 5.5 Usability

| ID | Requirement |
|----|------------|
| NFR-USE-01 | The frontend is fully responsive and accessible from mobile and desktop browsers |
| NFR-USE-02 | All pages provide loading states (skeleton components) |
| NFR-USE-03 | Role-specific navigation is enforced; unauthorized routes redirect with a 403 guard |
| NFR-USE-04 | Toast notifications provide real-time feedback on all user actions |

---

## 6. External Interface Requirements

### 6.1 SMS Gateway

- **Provider:** Configurable (defaults to Milkotech Ethiopian SMS gateway)
- **API URL:** Configured via `SMS_API_URL`
- **Phone Number Format:** Ethiopian mobile numbers (Ethio Telecom `09x`, Safaricom `07x`)
- **Auth Modes:** body, bearer, header, basic, none
- **Driver Modes:** `log` (development), `api` (production)

### 6.2 Telegram Bot API

- **Integration:** Bot token via `TELEGRAM_BOT_TOKEN`
- **Webhook Endpoint:** `POST /api/telegram/webhook` (public, no auth)
- **Functions:** Account linking via deep-link token, send approval/ticket notifications

### 6.3 Microsoft Graph Email API

- **Auth:** OAuth2 Client Credentials (Azure Entra ID app registration)
- **Endpoint:** `https://graph.microsoft.com/v1.0/users/{sender}/sendMail`
- **Token Cache:** 3,300 seconds (55 minutes)
- **Used For:** New user registration email to Super Admins, ticket approval email

### 6.4 Frontend–Backend Interface

- **Protocol:** HTTPS REST API
- **Auth Header:** `Authorization: Bearer {token}`
- **Content Type:** `application/json` (multipart for file uploads)
- **CORS:** Configured to accept requests only from `FRONTEND_URL`

---

## 7. Business Rules and Constraints

| ID | Rule |
|----|------|
| BR-01 | A requester may not have more than 3 simultaneously active tickets (statuses: submitted, approved, assigned, in_progress, reopened) |
| BR-02 | Tickets can only transition to specific statuses based on current state (enforced in controller logic) |
| BR-03 | SAP tickets may only be assigned to SAP-domain technicians |
| BR-04 | IT Support tickets may not be assigned to SAP or Facility technicians |
| BR-05 | Ticket feedback comments are hidden from technicians; they see only the numeric rating |
| BR-06 | Ticket completion review can be performed by the assigned manager, super admins, or the original requester |
| BR-07 | Manager (Admin) accounts can only be created by Super Admins |
| BR-08 | An Admin manager can only create technicians for their own support domain |
| BR-09 | Telegram account linking tokens expire after 15 minutes |
| BR-10 | Notification deduplication: duplicate in-app notifications within 60 seconds are suppressed |

---

## 8. Incomplete / Planned Features

> The following features are partially implemented or not yet activated in the default configuration. They are documented here to distinguish implemented from planned functionality.

| Feature | Status | Notes |
|---------|--------|-------|
| `maintenance:check-schedules` command | ⚠️ Implemented but not scheduled | Exists in console routes but not added to the Laravel scheduler in `console.php` |
| Queue worker auto-start on cPanel | ⚠️ Manual setup required | Queue worker must be configured separately; not started automatically |
| Microsoft Graph Email (approval email) | ⚠️ Requires external setup | Needs Azure App Registration with tenant ID, client ID, client secret |
| SMS in production | ⚠️ Requires configuration | Defaults to `SMS_DRIVER=log`; production requires `SMS_DRIVER=api` + valid gateway credentials |
| Telegram notifications | ⚠️ Requires bot configuration | `TELEGRAM_BOT_TOKEN` and `TELEGRAM_BOT_USERNAME` must be set |
| `tickets:auto-close` command | ⚠️ Exists, requires cron | Auto-closes tickets pending review for 3+ days; must be scheduled via cPanel cron |

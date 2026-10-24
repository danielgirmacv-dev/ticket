# 01 — Introduction

**Document:** User Manual  
**System:** EEC IT Asset & Ticket Management System  
**Version:** 1.0  
**Date:** October 2026  
**Audience:** All users

---

## What this system is

The **EEC IT Asset & Ticket Management System** is the web application staff use to:

- Report IT, SAP/ERP, and general maintenance problems
- Track request status from submission to completion
- See assigned work (technicians)
- Approve work and manage assets (managers)
- Receive alerts in the app, by SMS, and optionally on Telegram

Open the application in a modern browser (Chrome, Edge, Firefox, or Safari) at the address your IT team provides, for example `https://app.yourdomain.com`.

---

## Who uses it

| Role | You typically… |
|------|----------------|
| **Requester** | Submit requests, wait for approval, review completed work, rate the service. |
| **Technician** | Open tickets assigned to you, log diagnosis and parts, mark work complete. |
| **Admin (Manager)** | Approve or reject requests for your department, assign technicians, review completions, maintain assets and users. |
| **Super Admin** | Full system access, including approving new accounts and seeing every department. |

Your menu on the left changes with your role. If you cannot see **Users**, **Assets**, or **Reports**, your account does not have those permissions.

---

## What a ticket is

A **ticket** (also called a request) is one maintenance or support job. It has:

- A **title** and optional description
- A **type** (maintenance, repair, installation, inspection, other)
- A **support category** (IT Support, SAP/ERP, or General) so the right manager receives it
- A **priority** (low, medium, high, critical)
- A **scheduled date**
- Optional **asset**, **attachments**, and **recurring** settings

Statuses you will see:

| Status | Meaning |
|--------|---------|
| Submitted | Waiting for a manager |
| Approved | Accepted; waiting for a technician |
| Rejected | Not approved (read the reason) |
| Assigned | A technician is named |
| In Progress | Work has started |
| Completed – Pending Review | Technician finished; you or a manager must confirm |
| Completed | Accepted as done |
| Reopened | Completion was not accepted |
| Cancelled | The request was cancelled |

---

## Notifications

- **Bell icon** in the header: in-app messages
- **SMS:** sent to the phone number on your profile when the gateway is configured
- **Telegram:** optional; link your account in Settings (see Feature Guides)

---

## How this manual is organized

| Guide | Contents |
|-------|----------|
| [02-Login-Guide.md](02-Login-Guide.md) | Register, wait for approval, sign in, sign out, change password |
| [03-Dashboard-Guide.md](03-Dashboard-Guide.md) | Home screen, sidebar, calendar, notifications |
| [04-Feature-Guides.md](04-Feature-Guides.md) | Tickets, assets, users, reports, help, Telegram, settings — by role |
| [05-FAQ.md](05-FAQ.md) | Common questions |

If something in the live screens differs from this manual, follow the application and ask your Super Admin; labels can change with new releases.

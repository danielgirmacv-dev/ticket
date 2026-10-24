# API Documentation

**Document Title:** API Reference Documentation  
**System Name:** EEC IT Asset & Ticket Management System  
**Version:** 1.0  
**Date:** October 2026  
**Base URL:** `https://api.yourdomain.com/api`  
**Auth:** Bearer Token (Laravel Sanctum)

---

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Users & Auth Endpoints](#3-users--auth-endpoints)
4. [Asset Endpoints](#4-asset-endpoints)
5. [Maintenance Ticket Endpoints](#5-maintenance-ticket-endpoints)
6. [Maintenance Schedule Endpoints](#6-maintenance-schedule-endpoints)
7. [Notification Endpoints](#7-notification-endpoints)
8. [Profile Endpoints](#8-profile-endpoints)
9. [Report Endpoints](#9-report-endpoints)
10. [FAQ & Chatbot Endpoints](#10-faq--chatbot-endpoints)
11. [Location Endpoints](#11-location-endpoints)
12. [Department Endpoints](#12-department-endpoints)
13. [Telegram Endpoints](#13-telegram-endpoints)
14. [Activity Log Endpoints](#14-activity-log-endpoints)
15. [Error Reference](#15-error-reference)

---

## 1. Overview

### 1.1 Request Format

- **Content-Type:** `application/json` for JSON bodies
- **Content-Type:** `multipart/form-data` for file uploads
- All requests include `Accept: application/json` header

### 1.2 Authentication Header

```
Authorization: Bearer {your_token}
```

### 1.3 Response Format

**Success (single resource):**
```json
{ ...resource fields... }
```

**Success (collection):**
```json
[ { ...resource... } ]
```

**Error:**
```json
{
  "message": "Description of the error",
  "errors": {
    "field_name": ["Error message"]
  }
}
```

### 1.4 HTTP Status Codes

| Code | Meaning |
|------|---------|
| `200` | OK — Request succeeded |
| `201` | Created — Resource created |
| `204` | No Content — Resource deleted |
| `400` | Bad Request — Business rule violation |
| `401` | Unauthorized — Invalid or missing token |
| `403` | Forbidden — Insufficient permissions |
| `404` | Not Found — Resource not found |
| `422` | Unprocessable Entity — Validation error |
| `500` | Internal Server Error |

---

## 2. Authentication

All protected endpoints require the `Authorization: Bearer {token}` header. Tokens are obtained via the `/login` endpoint.

### Token Lifetime

Tokens do not expire by default (Laravel Sanctum personal access tokens). Tokens are invalidated on logout.

---

## 3. Users & Auth Endpoints

### POST `/register`

Register a new user account. Account starts in `pending` status.

**Auth Required:** No  
**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Full name (max 255) |
| `email` | string | ✅ | Valid email address (unique) |
| `password` | string | ✅ | Min 8 characters |
| `password_confirmation` | string | ✅ | Must match password |
| `phone` | string | ❌ | Phone number (max 30) |
| `telegram_username` | string | ❌ | Telegram handle |
| `location_id` | UUID | ❌ | Must exist in locations table |

**Response `201`:**
```json
{
  "message": "Registration successful! Your account is pending admin approval...",
  "status": "pending",
  "auto_approve_after_minutes": null,
  "support_email": "itsupport@eecproducts.com",
  "telegram_bot_username": "eec_it_bot",
  "telegram_bot_link": "https://t.me/eec_it_bot?start",
  "user": { "name": "John Doe", "email": "john@example.com" }
}
```

---

### POST `/login`

Authenticate and receive a Bearer token.

**Auth Required:** No  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `email` | string | ✅ |
| `password` | string | ✅ |

**Response `200`:**
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "status": "active",
    "profile": { "id": "uuid", "phone": "...", "telegram_chat_id": null, "location": {...}, ... },
    "roles": [{ "name": "requester" }]
  },
  "token": "1|plainTextToken"
}
```

**Errors:**
- `422` — Invalid credentials
- `422` — Account pending approval
- `422` — Account registration not approved

---

### POST `/logout`

Revoke the current access token.

**Auth Required:** Yes  
**Response `200`:**
```json
{ "message": "Logged out successfully" }
```

---

### GET `/user`

Get the currently authenticated user.

**Auth Required:** Yes  
**Response `200`:** Same structure as login user object.

---

### POST `/user/update-password`

Update the authenticated user's password.

**Auth Required:** Yes  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `current_password` | string | ✅ |
| `new_password` | string | ✅ Min 8 chars |
| `new_password_confirmation` | string | ✅ |

**Response `200`:**
```json
{ "message": "Password updated successfully" }
```

---

### POST `/users`

Create a new user account (Admin/Super Admin only).

**Auth Required:** Yes (admin or super_admin role)  
**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | |
| `email` | string | ✅ | Unique |
| `password` | string | ✅ | Min 8 chars |
| `role` | string | ✅ | `super_admin`, `admin`, `technician`, `requester` |
| `department` | string | ❌ | |
| `support_category` | string | ❌ | `it_support`, `sap`, `general` |
| `phone` | string | ❌ | |
| `location_id` | UUID | ❌ | |

**Response `201`:**
```json
{
  "message": "User created successfully",
  "user": { ...user with profile and roles... }
}
```

**Business Rules:**
- Only `super_admin` can create `admin` or `super_admin` accounts
- `admin` managers can only create `technician` accounts within their own support domain

---

### POST `/users/{id}/approve`

Approve a pending user registration.

**Auth Required:** Yes (admin or super_admin)  
**Response `200`:**
```json
{
  "message": "User approved successfully",
  "user": { ...user with profile and roles... }
}
```

---

### POST `/users/{id}/reject`

Reject a pending user registration.

**Auth Required:** Yes (admin or super_admin)  
**Response `200`:**
```json
{
  "message": "User rejected successfully",
  "user": { ...user... }
}
```

---

## 4. Asset Endpoints

### GET `/assets`

List all assets with optional filters.

**Auth Required:** Yes  
**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by: `active`, `maintenance`, `retired`, `disposed` |
| `type` | string | Filter by: `computer`, `printer`, `server`, `network_device`, `other` |
| `search` | string | Search in name or serial_number |

**Response `200`:** Array of asset objects including `assignedUser` and `maintenanceTickets`.

---

### POST `/assets`

Create a new asset.

**Auth Required:** Yes (requires `manage assets` permission)  
**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Asset name |
| `type` | string | ✅ | See enum values |
| `serial_number` | string | ✅ | Unique identifier |
| `purchase_date` | date | ✅ | `YYYY-MM-DD` |
| `warranty_expiry` | date | ❌ | `YYYY-MM-DD` |
| `location` | string | ✅ | Free text location |
| `status` | string | ✅ | See enum values |
| `assigned_to` | UUID | ❌ | Profile ID |
| `notes` | string | ❌ | |

**Response `201`:** Created asset object.

---

### GET `/assets/{id}`

Get a specific asset.

**Auth Required:** Yes  
**Response `200`:** Asset object with `assignedUser` and `maintenanceTickets`.

---

### PUT/PATCH `/assets/{id}`

Update an asset.

**Auth Required:** Yes (requires `manage assets` permission)  
**Request Body:** Same fields as POST, all optional.  
**Response `200`:** Updated asset object.

---

### DELETE `/assets/{id}`

Delete an asset.

**Auth Required:** Yes (requires `manage assets` permission)  
**Response `204`:** No content.

---

### POST `/assets/import-csv`

Bulk import assets from a CSV file.

**Auth Required:** Yes (requires `manage assets` permission)  
**Content-Type:** `multipart/form-data`  
**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `file` | file | CSV file (max 10MB). Required headers: `name`, `type`, `serial_number`, `purchase_date`, `location`, `status` |

**Response `200`:**
```json
{
  "message": "Successfully imported 25 assets",
  "success_count": 25,
  "error_count": 2,
  "errors": [
    { "row": 3, "data": {...}, "errors": { "type": ["Invalid type value"] } }
  ]
}
```

---

## 5. Maintenance Ticket Endpoints

### GET `/maintenance-tickets`

List tickets (role-filtered).

**Auth Required:** Yes  
**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by ticket status |
| `priority` | string | Filter by priority |
| `support_category` | string | Filter by: `it_support`, `sap`, `general` |
| `assigned_technician_id` | UUID | Filter by technician (admin/super_admin only) |
| `requester_id` | UUID | Filter by requester (admin/super_admin only) |
| `asset_id` | UUID | Filter by asset |

**Visibility by Role:**
- `super_admin`: all tickets
- `admin`: tickets routed to them via `assigned_manager_id` or matching their `support_category`
- `technician`: tickets where `assigned_technician_id` = their profile ID
- `requester`: tickets where `requester_id` = their profile ID

**Response `200`:** Array of ticket objects, ordered by urgency (submitted/pending-review first), then newest.

---

### POST `/maintenance-tickets`

Submit a new maintenance ticket.

**Auth Required:** Yes  
**Content-Type:** `multipart/form-data` (for attachments) or `application/json`  
**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Max 255 chars |
| `description` | string | ❌ | |
| `type` | string | ✅ | `maintenance`, `repair`, `installation`, `inspection`, `other` |
| `support_category` | string | ❌ | Defaults to `general` |
| `priority` | string | ❌ | Defaults to `medium` |
| `asset_id` | UUID | ❌ | Must exist in assets |
| `scheduled_date` | date | ✅ | `YYYY-MM-DD` |
| `estimated_duration` | integer | ❌ | In minutes |
| `is_recurring` | boolean | ❌ | |
| `recurring_interval` | string | ❌ | Required if is_recurring=true |
| `recurring_ends_at` | date | ❌ | Must be future date |
| `notes` | string | ❌ | |
| `attachments[]` | file | ❌ | Max 5 files, 5MB each, types: jpg, jpeg, png, gif, webp, pdf |

**Business Rules:**
- Requesters may not exceed 3 simultaneous active tickets
- Ticket is automatically routed to the relevant department manager

**Response `201`:** Created ticket object with related data.

---

### GET `/maintenance-tickets/{id}`

Get a specific ticket.

**Auth Required:** Yes (must have `view tickets` permission and pass Policy check)  
**Response `200`:** Full ticket object with asset, requester, assignedTechnician, assignedManager.

> **Note:** `feedback_comment` is hidden from technicians.

---

### PUT/PATCH `/maintenance-tickets/{id}`

Update ticket fields.

**Auth Required:** Yes (requires `manage tickets` permission or ownership of submitted ticket)  
**Request Body:** Any ticket fields (partial update supported).  
**Response `200`:** Updated ticket.

---

### DELETE `/maintenance-tickets/{id}`

Delete a ticket.

**Auth Required:** Yes (admin or super_admin only)  
**Response `204`:** No content.

---

### POST `/maintenance-tickets/{id}/approve`

Approve a submitted ticket.

**Auth Required:** Yes (requires `manage tickets` permission)  
**Precondition:** Ticket status must be `submitted`  
**Response `200`:** Updated ticket with `approved_by` and `approvedBy` relation.

**Side Effects:** In-app notifications to requester, assigned technician, assigned manager; queued Telegram + MS Graph email.

---

### POST `/maintenance-tickets/{id}/reject`

Reject a submitted ticket.

**Auth Required:** Yes (requires `manage tickets` permission)  
**Precondition:** Ticket status must be `submitted`  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `rejection_reason` | string | ✅ |

**Response `200`:** Updated ticket with `requester` relation.

---

### POST `/maintenance-tickets/{id}/assign`

Assign a technician to a ticket.

**Auth Required:** Yes (requires `manage tickets` permission)  
**Precondition:** Ticket status must be `submitted` or `approved`  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `assigned_technician_id` | UUID | ✅ Must exist in profiles |

**Business Rules:**
- SAP tickets → SAP technicians only
- IT Support tickets → Cannot assign SAP or Facility technicians
- General tickets → Cannot assign SAP technicians

**Response `200`:** Updated ticket with `assignedTechnician` and `requester`.

---

### POST `/maintenance-tickets/{id}/start`

Mark ticket as in-progress.

**Auth Required:** Yes (assigned technician or manager)  
**Precondition:** Ticket status must be `assigned`  
**Response `200`:** Updated ticket with `started_at`.

---

### POST `/maintenance-tickets/{id}/update-progress`

Update work progress on an in-progress ticket.

**Auth Required:** Yes (assigned technician or manager)  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `diagnosis` | string | ❌ |
| `actions_taken` | string | ❌ |
| `spare_parts` | array | ❌ |
| `estimated_duration` | integer | ❌ Minutes |

**Response `200`:** Updated ticket.

---

### POST `/maintenance-tickets/{id}/complete`

Mark ticket as complete (pending review).

**Auth Required:** Yes (assigned technician or manager)  
**Precondition:** Ticket status must be `in_progress` or `reopened`  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `actions_taken` | string | ✅ |
| `spare_parts` | array | ❌ |
| `images` | array | ❌ |
| `actual_duration` | integer | ❌ Minutes |

**Response `200`:** Updated ticket with status `completed_pending_review`.

---

### POST `/maintenance-tickets/{id}/review-completion`

Review a completed ticket.

**Auth Required:** Yes (admin, super_admin, or original requester)  
**Precondition:** Ticket status must be `completed_pending_review`  
**Request Body:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `approved` | boolean | ✅ | `true` → completed, `false` → reopened |
| `notes` | string | ❌ | Required if rejecting |

**Response `200`:** Updated ticket with `reviewedBy` and `assignedTechnician`.

---

### POST `/maintenance-tickets/{id}/feedback`

Submit star rating and feedback for a completed ticket.

**Auth Required:** Yes (original requester only)  
**Precondition:** Ticket status must be `completed`  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `feedback_rating` | integer | ✅ 1–5 |
| `feedback_comment` | string | ❌ |

**Response `200`:** Updated ticket with all relations.

---

### POST `/maintenance-tickets/{id}/transfer`

Transfer a ticket to a different support department.

**Auth Required:** Yes (requires `manage tickets` permission)  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `support_category` | string | ✅ `it_support`, `sap`, `general` |
| `reason` | string | ❌ Max 500 chars |

**Response `200`:** Updated ticket re-routed to new department manager.

---

## 6. Maintenance Schedule Endpoints

### GET `/maintenance-schedules`

List all preventive maintenance schedules.

**Auth Required:** Yes  
**Response `200`:** Array of schedule objects with `asset` and `creator`.

---

### POST `/maintenance-schedules`

Create a new schedule.

**Auth Required:** Yes  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `title` | string | ✅ |
| `description` | string | ❌ |
| `asset_id` | UUID | ✅ |
| `type` | string | ✅ |
| `frequency` | string | ✅ `daily`, `weekly`, `monthly`, `quarterly`, `yearly` |
| `next_run_date` | date | ✅ |
| `is_active` | boolean | ❌ |

**Response `201`:** Created schedule.

---

### GET `/maintenance-schedules/{id}`

Get a specific schedule.

**Response `200`:** Schedule object.

---

### PUT/PATCH `/maintenance-schedules/{id}`

Update a schedule.

**Response `200`:** Updated schedule.

---

### DELETE `/maintenance-schedules/{id}`

Delete a schedule.

**Response `204`:** No content.

---

## 7. Notification Endpoints

### GET `/notifications`

List the authenticated user's notifications.

**Auth Required:** Yes  
**Response `200`:** Array of notification objects, newest first.

---

### PATCH `/notifications/{notification}/mark-read`

Mark a specific notification as read.

**Auth Required:** Yes  
**Response `200`:** Updated notification.

---

### POST `/notifications/mark-all-read`

Mark all of the authenticated user's notifications as read.

**Auth Required:** Yes  
**Response `200`:**
```json
{ "message": "All notifications marked as read" }
```

---

### DELETE `/notifications/{notification}`

Delete a specific notification.

**Auth Required:** Yes  
**Response `204`:** No content.

---

## 8. Profile Endpoints

### GET `/profiles`

List all user profiles.

**Auth Required:** Yes  
**Response `200`:** Array of profile objects with user relation.

---

### GET `/profiles/{profile}`

Get a specific user profile.

**Auth Required:** Yes  
**Response `200`:** Profile object.

---

### PUT/PATCH `/profiles/{profile}`

Update a user profile.

**Auth Required:** Yes (own profile or admin)  
**Request Body:**

| Field | Type | Description |
|-------|------|-------------|
| `name` | string | Display name |
| `phone` | string | Phone number |
| `avatar_url` | string | Profile image URL |
| `department` | string | Department name |
| `support_category` | string | `it_support`, `sap`, `general` |
| `telegram_username` | string | Telegram handle |
| `location_id` | UUID | Location reference |

**Response `200`:** Updated profile.

---

### DELETE `/profiles/{profile}`

Delete a user profile.

**Auth Required:** Yes (admin/super_admin)  
**Response `204`:** No content.

---

### PATCH `/profiles/{profile}/role`

Update a user's assigned role.

**Auth Required:** Yes (admin/super_admin)  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `role` | string | ✅ `super_admin`, `admin`, `technician`, `requester` |

**Response `200`:** Updated profile.

---

## 9. Report Endpoints

### GET `/reports/tickets`

Get filtered ticket report data.

**Auth Required:** Yes  
**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `start_date` | date | Filter from scheduled_date |
| `end_date` | date | Filter to scheduled_date |
| `status` | string | `all` or specific status |
| `type` | string | `all` or specific type |
| `priority` | string | `all` or specific priority |
| `asset_id` | UUID | Filter by asset |
| `assigned_technician_id` | UUID | Filter by technician |

**Response `200`:** Array of ticket objects with relations.

---

### GET `/reports/assets`

Get filtered asset report data.

**Auth Required:** Yes  
**Query Parameters:** `status`, `type`, `location`  
**Response `200`:** Array of asset objects with `assignedUser` and `maintenanceTickets`.

---

### GET `/reports/performance`

Get performance analytics.

**Auth Required:** Yes  
**Query Parameters:** `start_date`, `end_date`  
**Response `200`:**
```json
{
  "summary": {
    "total_tickets": 150,
    "completed_tickets": 120,
    "in_progress_tickets": 15,
    "overdue_tickets": 5,
    "completion_rate": 80.0,
    "avg_completion_days": 2.5
  },
  "tickets_by_status": [
    { "status": "completed", "count": 120 }
  ],
  "tickets_by_priority": [
    { "priority": "high", "count": 45 }
  ],
  "tickets_by_type": [
    { "type": "repair", "count": 60 }
  ],
  "technician_stats": [
    {
      "assigned_technician_id": "uuid",
      "total_assigned": 40,
      "completed_count": 35,
      "avg_rating": 4.2,
      "avg_completion_days": 1.8,
      "assignedTechnician": { "name": "..." }
    }
  ]
}
```

---

### GET `/reports/export/tickets`

Export tickets to CSV file download.

**Auth Required:** Yes  
**Query Parameters:** Same as `/reports/tickets`  
**Response:** Streamed CSV file download.

**CSV Columns:** ID, Title, Type, Status, Priority, Asset, Requester, Assigned To, Scheduled Date, Completed Date, Created At

---

### GET `/reports/export/assets`

Export assets to CSV file download.

**Auth Required:** Yes  
**Query Parameters:** `status`, `type`  
**Response:** Streamed CSV file download.

**CSV Columns:** ID, Name, Type, Status, Serial Number, Location, Assigned To, Purchase Date, Warranty Expiry, Created At

---

## 10. FAQ & Chatbot Endpoints

### GET `/faqs`

List FAQ articles.

**Auth Required:** Yes  
**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by category (or `all`) |
| `search` | string | Search in question/answer/category |
| `is_published` | boolean | Admin only — filter by published state |

**Response `200`:** Array of FAQ objects. Non-admins see published only.

---

### POST `/faqs`

Create a new FAQ.

**Auth Required:** Yes (admin/super_admin)  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `question` | string | ✅ Max 500 |
| `answer` | string | ✅ |
| `category` | string | ✅ Max 100 |
| `is_published` | boolean | ❌ |
| `sort_order` | integer | ❌ |

**Response `201`:** Created FAQ.

---

### GET `/faqs/{id}`

Get a specific FAQ.

**Auth Required:** Yes  
**Response `200`:** FAQ object. Non-admins get 404 for unpublished FAQs.

---

### PUT/PATCH `/faqs/{id}`

Update a FAQ.

**Auth Required:** Yes (admin/super_admin)  
**Response `200`:** Updated FAQ.

---

### DELETE `/faqs/{id}`

Delete a FAQ.

**Auth Required:** Yes (admin/super_admin)  
**Response `204`:** No content.

---

### POST `/chat/assist`

Chatbot endpoint — keyword-match FAQs.

**Auth Required:** Yes  
**Request Body:**

| Field | Type | Required |
|-------|------|----------|
| `message` | string | ✅ Max 500 chars |

**Response `200`:**
```json
{
  "type": "faq",
  "text": "Here's what I found:\n\n1. **Question Title**\nAnswer text...",
  "matches": [ { ...faq object... } ]
}
```

**Response types:** `greeting`, `thanks`, `faq`, `fallback`

---

## 11. Location Endpoints

### GET `/locations`

List all locations.

**Auth Required:** Yes  
**Response `200`:** Array of location objects.

---

### POST `/locations`

Create a location.

**Auth Required:** Yes  
**Request Body:** `{ "name": "string" }`  
**Response `201`:** Created location.

---

### GET `/locations/{id}`

Get a location.

**Response `200`:** Location object.

---

### PUT/PATCH `/locations/{id}`

Update a location.

**Response `200`:** Updated location.

---

### DELETE `/locations/{id}`

Delete a location.

**Response `204`:** No content.

---

### POST `/locations/import-csv`

Import locations from CSV.

**Content-Type:** `multipart/form-data`  
**Field:** `file` (CSV)  
**Response `200`:** Import summary.

---

### GET `/locations/{location}/profiles`

List user profiles in a location.

**Auth Required:** Yes  
**Response `200`:** Array of profiles.

---

## 12. Department Endpoints

Same CRUD + CSV import pattern as Locations.

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/departments` | GET | List all departments |
| `/departments` | POST | Create department (`{ "name": "string" }`) |
| `/departments/{id}` | GET | Get department |
| `/departments/{id}` | PUT/PATCH | Update department |
| `/departments/{id}` | DELETE | Delete department |
| `/departments/import-csv` | POST | Bulk import from CSV |

---

## 13. Telegram Endpoints

### POST `/telegram/webhook`

Receive Telegram bot webhook events.

**Auth Required:** No (public endpoint)  
**Request Body:** Telegram Update object (sent by Telegram servers)  
**Response `200`:** Always returns OK to acknowledge the webhook.

**Handled Commands:**
- `/start {token}` — Link Telegram account using a generated token
- `/start` — Display help message
- `/status` — Show linked account info

---

### POST `/telegram/generate-link`

Generate a Telegram deep-link for account linking.

**Auth Required:** Yes  
**Response `200`:**
```json
{
  "token": "32-char-random-string",
  "deep_link": "https://t.me/eec_it_bot?start=TOKEN",
  "expires_at": "2026-10-24T15:00:00+03:00"
}
```

---

### DELETE `/telegram/unlink`

Unlink Telegram account from profile.

**Auth Required:** Yes  
**Response `200`:**
```json
{ "message": "Telegram account unlinked successfully" }
```

---

### GET `/telegram/status`

Check Telegram link status.

**Auth Required:** Yes  
**Response `200`:**
```json
{
  "linked": true,
  "telegram_username": "@johndoe",
  "telegram_chat_id": 123456789
}
```

---

## 14. Activity Log Endpoints

### GET `/activity-logs`

List system activity logs.

**Auth Required:** Yes (admin/super_admin only)  
**Response `200`:** Array of activity log objects.

**Example Log Object:**
```json
{
  "id": "uuid",
  "action": "approved",
  "model_type": "Ticket",
  "model_id": "ticket-uuid",
  "description": "Approved ticket: Fix printer in Room 202",
  "user_id": 3,
  "created_at": "2026-10-24T10:30:00Z"
}
```

---

## 15. Error Reference

### Common Error Responses

**401 Unauthenticated:**
```json
{ "message": "Unauthenticated." }
```

**403 Forbidden:**
```json
{ "message": "Unauthorized" }
```

**422 Validation Error:**
```json
{
  "message": "The given data was invalid.",
  "errors": {
    "email": ["The email field is required."],
    "password": ["The password must be at least 8 characters."]
  }
}
```

**400 Business Rule Violation:**
```json
{ "message": "You already have 3 active requests in progress." }
```

**422 Domain Isolation Violation:**
```json
{ "message": "This technician does not belong to the SAP support team." }
```

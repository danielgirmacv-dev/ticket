# System Architecture Documentation

**Document Title:** System Architecture Documentation  
**System Name:** EEC IT Asset & Ticket Management System  
**Version:** 1.0  
**Date:** October 2026  
**Status:** Based on Implemented Codebase

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [Backend Architecture (Laravel)](#3-backend-architecture-laravel)
4. [Frontend Architecture (React SPA)](#4-frontend-architecture-react-spa)
5. [Integration Architecture](#5-integration-architecture)
6. [Infrastructure Architecture](#6-infrastructure-architecture)
7. [Data Flow Architecture](#7-data-flow-architecture)
8. [Security Architecture](#8-security-architecture)

---

## 1. Architecture Overview

The EEC IT Asset & Ticket Management System follows a **two-tier decoupled architecture**:

| Tier | Technology | Role |
|------|-----------|------|
| Presentation Tier | React 18 SPA (TypeScript, Vite) | User interface, client-side routing, state management |
| Application/Data Tier | Laravel 12 REST API (PHP 8.2+) | Business logic, authentication, database, external integrations |

**Key Architectural Decisions:**

1. **Stateless REST API** — No server-side sessions; authentication via Bearer tokens only.
2. **SPA Frontend** — The React app is a compiled static bundle served by Apache. No Node.js server is needed at runtime.
3. **Database-backed async** — Queues, sessions, and cache all use the database, making the system compatible with shared hosting without Redis.
4. **Separated deployment** — Frontend and backend run on separate subdomains, enabling independent scaling and deployment.

---

## 2. Technology Stack

### 2.1 Backend Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | PHP | 8.2+ |
| Framework | Laravel | 12.x |
| Authentication | Laravel Sanctum | 4.x |
| Authorization | Spatie Laravel Permission | 6.x |
| Database (dev) | SQLite | 3.x |
| Database (prod) | MySQL | 8.0+ |
| Queue | Laravel Database Queue | Built-in |
| Cache | Laravel Database Cache | Built-in |
| File Storage | Laravel Local Disk | Built-in |
| Task Scheduling | Laravel Scheduler (cron) | Built-in |
| Email | Microsoft Graph API | v1.0 |
| SMS | Configurable HTTP Gateway | — |
| Telegram | Telegram Bot API | — |
| HTTP Client | Guzzle / Laravel Http | Built-in |

### 2.2 Frontend Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Language | TypeScript | 5.x |
| Framework | React | 18.x |
| Build Tool | Vite | 5.x |
| Routing | React Router DOM | 6.x |
| State (Server) | TanStack Query (React Query) | 5.x |
| Forms | React Hook Form + Zod | 7.x / 3.x |
| UI Components | Shadcn/UI + Radix UI | Latest |
| Styling | TailwindCSS | 3.x |
| Charts | Recharts | 2.x |
| HTTP Client | Axios | 1.x |
| Icons | Lucide React | Latest |
| Notifications | Sonner | 1.x |
| Date Utilities | date-fns | 3.x |

### 2.3 DevOps / Infrastructure

| Component | Technology |
|-----------|-----------|
| Web Server | Apache (mod_rewrite) |
| Hosting | cPanel shared hosting |
| Process Manager | (None — queue worker managed via cPanel cron or Terminal) |
| CI/CD | GitHub + cPanel Git Version Control (optional) |
| SSL | cPanel AutoSSL / Let's Encrypt |

---

## 3. Backend Architecture (Laravel)

### 3.1 Laravel Application Structure

```
asset-task-sync-backend/
├── app/
│   ├── Console/
│   │   └── Commands/           Artisan console commands
│   ├── Http/
│   │   ├── Controllers/Api/    12 API controllers
│   │   └── Middleware/         auth:sanctum (built-in)
│   ├── Jobs/                   6 queued notification jobs
│   ├── Mail/                   NewUserRegistrationMail Mailable
│   ├── Models/                 10 Eloquent ORM models
│   ├── Policies/               AssetPolicy, MaintenanceTicketPolicy
│   ├── Providers/              AppServiceProvider (policy registration)
│   └── Services/               6 service classes (business logic)
├── bootstrap/                  Framework bootstrap + cache
├── config/                     All configuration files
│   ├── app.php
│   ├── auth.php
│   ├── cors.php
│   ├── database.php
│   ├── queue.php
│   ├── services.php            SMS + Azure Graph credentials
│   └── permission.php          Spatie RBAC config
├── database/
│   ├── migrations/             25 migration files
│   └── seeders/                3 seeders (DB, Roles, FAQs)
├── public/                     Apache document root (index.php)
├── routes/
│   ├── api.php                 99 lines, all API routes
│   ├── console.php             Scheduled commands
│   └── web.php                 Single catch-all (Sanctum CSRF)
└── storage/
    ├── app/public/             Uploaded ticket attachments
    └── logs/                   laravel.log
```

![Figure: Laravel Backend Application Structure & Architecture Layers](assets/technical/diagrams/rendered/16-laravel-app-structure.png)

*Figure: Laravel Backend Application Structure & Architecture Layers*


### 3.2 Request Lifecycle

```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant AP as Apache
    participant PI as public/index.php
    participant LV as Laravel Kernel
    participant MW as Middleware Stack
    participant CT as Controller
    participant SV as Service Layer
    participant DB as Database

    C->>AP: HTTP Request
    AP->>PI: Delegate (all requests)
    PI->>LV: Bootstrap application
    LV->>MW: auth:sanctum (validate Bearer token)
    MW->>CT: Route to controller method
    CT->>SV: Business logic
    SV->>DB: Eloquent ORM queries
    DB-->>SV: Results
    SV-->>CT: Processed data
    CT-->>C: JSON Response
```

### 3.3 Model Relationships

```mermaid
erDiagram
    User {
        bigint id PK
        string name
        string email
        string password
        enum status
    }
    Profile {
        uuid id PK
        bigint user_id FK
        string name
        string email
        string phone
        string avatar_url
        string department
        string support_category
        string telegram_username
        int telegram_chat_id
        uuid location_id FK
    }
    Asset {
        uuid id PK
        string name
        enum type
        string serial_number
        date purchase_date
        date warranty_expiry
        string location
        enum status
        uuid assigned_to FK
        text notes
    }
    MaintenanceTicket {
        uuid id PK
        string title
        text description
        enum type
        enum support_category
        enum status
        enum priority
        uuid asset_id FK
        uuid requester_id FK
        uuid assigned_technician_id FK
        uuid assigned_manager_id FK
        datetime scheduled_date
        datetime completed_date
        int estimated_duration
        int actual_duration
        bool is_recurring
        enum recurring_interval
        date recurring_ends_at
        text notes
        text rejection_reason
        text diagnosis
        text actions_taken
        json spare_parts
        json images
        int feedback_rating
        text feedback_comment
        uuid approved_by FK
        uuid reviewed_by FK
    }
    MaintenanceSchedule {
        uuid id PK
        string title
        text description
        uuid asset_id FK
        enum type
        enum frequency
        date next_run_date
        date last_run_date
        bool is_active
        uuid created_by FK
    }
    Notification {
        uuid id PK
        bigint user_id FK
        string title
        string message
        string type
        bool is_read
        string link
    }
    ActivityLog {
        uuid id PK
        string action
        string model_type
        string model_id
        text description
        bigint user_id FK
    }
    Location {
        uuid id PK
        string name
    }
    Department {
        uuid id PK
        string name
    }
    Faq {
        uuid id PK
        string question
        text answer
        string category
        bool is_published
        int sort_order
    }

    User ||--|| Profile : "has one"
    User ||--o{ Notification : "receives"
    User ||--o{ ActivityLog : "generates"
    Profile }o--|| Location : "belongs to"
    Profile ||--o{ Asset : "is assigned"
    Profile ||--o{ MaintenanceTicket : "requests"
    Profile ||--o{ MaintenanceTicket : "is assigned technician"
    Asset ||--o{ MaintenanceTicket : "has tickets"
    Asset ||--o{ MaintenanceSchedule : "has schedules"
    Profile ||--o{ MaintenanceSchedule : "creates"
```

---

## 4. Frontend Architecture (React SPA)

### 4.1 Component Architecture

```mermaid
graph TD
    A[App.tsx\nRoot Provider] --> B[BrowserRouter]
    A --> C[QueryClientProvider]
    A --> D[TooltipProvider]
    A --> E[Toaster / Sonner]

    B --> F[AuthProvider\nContext]
    F --> G[SessionTimeoutHandler]
    F --> H[Suspense + Routes]

    H --> I[/auth → Auth.tsx\nPublic Route]
    H --> J[ProtectedRoute\nAuth Guard]

    J --> K[Index.tsx\nDashboard]
    J --> L[Assets.tsx]
    J --> M[Requests.tsx]
    J --> N[Tickets.tsx]
    J --> O[Users.tsx]
    J --> P[Reports.tsx]
    J --> Q[...12 more pages]

    K & L & M & N --> R[MainLayout\nSidebar + Header]
    R --> S[ChatBot.tsx\nFloating Widget]
```

### 4.2 Data Fetching Pattern

All API data is managed through **TanStack Query**:

```typescript
// Pattern used across all pages:
const { data, isLoading, error } = useQuery({
  queryKey: ['resource', filters],
  queryFn: () => api.get('/resource').then(r => r.data),
  staleTime: 5 * 60 * 1000,
});

// Mutations with cache invalidation:
const mutation = useMutation({
  mutationFn: (data) => api.post('/resource', data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['resource'] });
  },
});
```

### 4.3 Authentication Context

The `useAuth` hook provides throughout the app:
- `user` — current authenticated user object (with roles and profile)
- `token` — Bearer token stored in `localStorage`
- `login(credentials)` — calls `/api/login`, stores token
- `logout()` — calls `/api/logout`, clears token
- `hasRole(role)` — checks user role
- `isAuthenticated` — boolean

---

## 5. Integration Architecture

### 5.1 SMS Integration

```mermaid
flowchart LR
    A[NotificationService.sms] --> B[SendSmsNotification Job\ndispatched to queue]
    B --> C[Queue Worker\nphp artisan queue:listen]
    C --> D[SmsService.send]
    D --> E{Driver?}
    E -- log --> F[Laravel Log File]
    E -- api --> G[normalizePhone\nEthiopian format]
    G --> H[HTTP POST\nSMS Gateway API]
    H --> I[Ethiopian Mobile\nNumber]
```

**Phone Normalization:** Accepts `0912345678`, `912345678`, `+251912345678`, `251912345678`. Outputs in `251XXXXXXXXX` format. Only validates Ethiopian Ethio Telecom (09x) and Safaricom ET (07x) numbers.

### 5.2 Telegram Integration

```mermaid
flowchart TB
    subgraph "Account Linking"
        A[User requests link] --> B[POST /api/telegram/generate-link]
        B --> C[Token cached 15 min]
        C --> D[Deep link t.me/bot?start=TOKEN]
        D --> E[User clicks → opens Telegram bot]
        E --> F[Bot receives /start TOKEN]
        F --> G[POST /api/telegram/webhook]
        G --> H[verifyAndLinkChatId\nsave chat_id to profile]
    end

    subgraph "Notifications"
        I[Queue Job] --> J[TelegramService.sendMessage]
        J --> K[POST api.telegram.org/bot{TOKEN}/sendMessage]
        K --> L[User's Telegram App]
    end
```

### 5.3 Microsoft Graph Email Integration

```mermaid
flowchart LR
    A[Queue Job\nSendTicketApprovalNotification] --> B[MicrosoftGraphService]
    B --> C{Token cached?}
    C -- Yes --> D[Use cached token]
    C -- No --> E[POST login.microsoftonline.com\n/oauth2/v2.0/token\nclient_credentials flow]
    E --> F[Cache token 55 min]
    D & F --> G[POST graph.microsoft.com\n/v1.0/users/sender/sendMail]
    G --> H[Recipient Email]
```

---

## 6. Infrastructure Architecture

### 6.1 Production Deployment Architecture

```
Internet
    │
    ├─→ app.yourdomain.com  ─→  Apache vhost
    │                            └── public_html/
    │                                 ├── index.html  (React SPA entry)
    │                                 ├── assets/     (JS/CSS bundles)
    │                                 └── .htaccess   (SPA routing fallback)
    │
    └─→ api.yourdomain.com  ─→  Apache vhost
                                  document root: /backend/public/
                                  └── index.php  (Laravel entry)
                                       └── app/
                                       └── database/ (SQLite or MySQL)
                                       └── storage/
                                            ├── logs/
                                            └── app/public/ (attachments)
```

![Figure: Production Deployment Architecture — cPanel Apache Hosting](assets/technical/diagrams/rendered/18-deployment-arch.png)

*Figure: Production Deployment Architecture — cPanel Apache Hosting*


### 6.2 Queue Worker Architecture

```
cPanel Cron Job (every minute):
* * * * * php artisan schedule:run

Optional always-on worker:
php artisan queue:listen --tries=3 --delay=3
```

> **Note:** On shared cPanel hosting, the queue worker typically runs as a cPanel cron job polling every minute, not as a persistent daemon.

### 6.3 File Storage

Uploaded ticket attachments are stored in `storage/app/public/ticket-attachments/` and served via a symbolic link from `public/storage/`.

```bash
php artisan storage:link
# Creates: public/storage → storage/app/public
```

---

## 7. Data Flow Architecture

### 7.1 Notification Data Flow

```mermaid
flowchart TD
    A[Trigger Event\ne.g. Ticket Submitted] --> B[Controller]
    B --> C[NotificationService\nSynchronous in-app notifications]
    C --> D[(notifications table\nDB write)]
    B --> E[Queue::dispatch\nAsync jobs]
    E --> F[(jobs table\nDB write)]
    
    subgraph "Queue Worker Process"
        G[Queue Worker polls jobs table] --> H[SendXxxNotification job runs]
        H --> I[SmsService → SMS Gateway]
        H --> J[TelegramService → Telegram API]
        H --> K[MicrosoftGraphService → Graph API]
    end
    
    F --> G
    D --> L[Frontend polls /api/notifications\nor notification badge]
```

### 7.2 Report Data Flow

```mermaid
flowchart LR
    A[Admin opens Reports page] --> B[GET /api/reports/performance\nwith date filters]
    B --> C[ReportController\nMultiple DB aggregation queries]
    C --> D[(maintenance_tickets table\nGROUP BY, AVG, COUNT)]
    D --> C
    C --> E[JSON response:\nsummary, by_status, by_priority,\nby_type, technician_stats]
    E --> F[Recharts renders\nBar/Line/Pie charts]
    
    A --> G[GET /api/reports/export/tickets]
    G --> H[Stream CSV response]
    H --> I[Browser download dialog]
```

---

## 8. Security Architecture

### 8.1 Authentication Architecture

```mermaid
flowchart TB
    A[User submits credentials] --> B[POST /api/login]
    B --> C{Credentials valid?}
    C -- No --> D[401 Unauthorized]
    C -- Yes --> E{User status?}
    E -- pending --> F[422 Awaiting approval]
    E -- rejected --> G[422 Registration not approved]
    E -- active --> H[Create Sanctum token]
    H --> I[Return token to client]
    I --> J[Client stores in localStorage]
    J --> K[Include in all subsequent requests\nAuthorization: Bearer TOKEN]
    K --> L[auth:sanctum middleware\nvalidates token on every request]
```

### 8.2 CORS Architecture

Laravel's CORS middleware (configured in `config/cors.php`) restricts cross-origin requests:

- **Allowed Origins:** `FRONTEND_URL` environment variable
- **Allowed Methods:** GET, POST, PUT, PATCH, DELETE, OPTIONS
- **Allowed Headers:** Content-Type, Authorization, X-Requested-With
- **Credentials:** Supported

### 8.3 Authorization Architecture (Layered)

```
Layer 1: Route Middleware
    auth:sanctum → validates Bearer token
         ↓
Layer 2: Controller Role Check
    $user->hasAnyRole(['admin', 'super_admin'])
         ↓
Layer 3: Laravel Gate / Policy
    Gate::authorize('manage', MaintenanceTicket::class)
    → delegates to MaintenanceTicketPolicy::manage()
    → checks hasPermissionTo('manage tickets')
```

![Figure: Authorization Architecture — 4-Layer Security Pipeline](assets/technical/diagrams/rendered/19-auth-layers.png)

*Figure: Authorization Architecture — 4-Layer Security Pipeline*


### 8.4 Password Security

- **Algorithm:** bcrypt with 12 rounds (`BCRYPT_ROUNDS=12` in `.env`)
- **Cast:** Laravel's `hashed` cast on `User::password` auto-hashes on assignment
- **Protection:** Password field is in `$hidden` array; never returned in API responses

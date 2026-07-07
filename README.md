# EEC IT Maintenance Scheduler

A comprehensive IT asset management and maintenance scheduling system built with Laravel and React.

> [!TIP]
> **New to the system?** Check out the [System Overview](SYSTEM_DOC.md) for a detailed explanation of architecture, roles, and workflows.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4)
![Laravel](https://img.shields.io/badge/Laravel-12.x-FF2D20)
![React](https://img.shields.io/badge/React-18.x-61DAFB)

## 📋 Features

- ✅ **Asset Management** - Track computers, printers, servers, and network devices
- ✅ **Maintenance Scheduling** - 7-stage workflow for maintenance tasks
- ✅ **User Management** - Role-based access control (Admin, Technician, Requester)
- ✅ **CSV Import** - Bulk import assets from CSV files
- ✅ **Preventive Maintenance** - Recurring maintenance schedules
- ✅ **Reports & Analytics** - Task reports, asset reports, performance metrics
- ✅ **Activity Logging** - Track all system activities
- ✅ **Notifications** - Real-time notifications for task updates
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile

## 🛠️ Tech Stack

### Backend
- **PHP 8.2+**
- **Laravel 12.x**
- **MySQL 8.0+**
- **Laravel Sanctum** (Authentication)
- **Spatie Laravel Permission** (Role management)

### Frontend
- **React 18.x**
- **TypeScript**
- **Vite** (Build tool)
- **Tailwind CSS**
- **shadcn/ui** (UI components)
- **TanStack Query** (Data fetching)
- **React Router** (Routing)

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **PHP** >= 8.2
- **Composer** >= 2.0
- **Node.js** >= 18.0
- **npm** >= 9.0
- **MySQL** >= 8.0

### Windows Users
We recommend installing **XAMPP** which includes PHP, MySQL, and Apache:
- Download: https://www.apachefriends.org/

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone <repository-url>
cd asset-task-sync-main
```

### 2. Backend Setup

Navigate to the backend folder:

```bash
cd asset-task-sync-backend
```

Install PHP dependencies:

```bash
composer install
```

Copy the environment file:

```bash
# Linux/Mac
cp .env.example .env

# Windows
copy .env.example .env
```

Generate application key:

```bash
php artisan key:generate
```

Configure your database in `.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=asset_task_sync
DB_USERNAME=root
DB_PASSWORD=your_password
```

Create the database:

```bash
# Using MySQL command line
mysql -u root -p
CREATE DATABASE asset_task_sync;
exit;
```

Run migrations and seeders:

```bash
php artisan migrate --seed
```

### 3. Frontend Setup

Navigate to the frontend folder:

```bash
cd ../asset-task-sync-main
```

Install Node.js dependencies:

```bash
npm install
```

### 4. Run the Application

You need **two terminal windows**:

**Terminal 1 - Backend:**

```bash
cd asset-task-sync-backend
php artisan serve --port=8001
```

Backend will run at: http://localhost:8001.

**Terminal 2 - Frontend:**

```bash
cd asset-task-sync-main
npm run dev
```

Frontend will run at: http://localhost:8080 (or port shown in terminal)

### 5. Access the Application

Open your browser and navigate to: http://localhost:8080

**Default Admin Credentials:**
- Email: `admin@example.com`
- Password: `password`

## 👥 Default Users

The seeder creates three default users:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password |
| Technician | technician@example.com | password |
| Requester | requester@example.com | password |

## 📁 Project Structure

```
asset-task-sync-main/
├── asset-task-sync-backend/     # Laravel Backend
│   ├── app/
│   │   ├── Http/Controllers/    # API Controllers
│   │   ├── Models/              # Eloquent Models
│   │   ├── Policies/            # Authorization Policies
│   │   └── Services/            # Business Logic
│   ├── database/
│   │   ├── migrations/          # Database Migrations
│   │   └── seeders/             # Database Seeders
│   └── routes/
│       └── api.php              # API Routes
│
└── asset-task-sync-main/        # React Frontend
    ├── public/
    │   └── assets-template.csv  # CSV Import Template
    ├── src/
    │   ├── components/          # React Components
    │   ├── hooks/               # Custom Hooks
    │   ├── pages/               # Page Components
    │   ├── integrations/        # API Client
    │   └── index.css            # Global Styles
    └── vite.config.ts           # Vite Configuration
```

## 📊 Database Schema

### Main Tables
- `users` - User accounts
- `profiles` - User profile information
- `roles` - User roles (admin, technician, requester)
- `assets` - IT assets (computers, printers, etc.)
- `maintenance_tickets` - Maintenance requests and tasks
- `maintenance_schedules` - Recurring maintenance schedules
- `notifications` - User notifications
- `activity_logs` - System activity logs

## 🔐 User Roles & Permissions

### Admin
- Full system access
- Manage users and roles
- Approve/reject maintenance requests
- Assign tasks to technicians
- View all reports and analytics

### Technician
- View assigned tasks
- Update task progress
- Complete tasks
- Submit completion reports

### Requester
- Submit maintenance requests
- View own requests
- Provide feedback on completed tasks

## 📤 CSV Import

Import multiple assets at once using CSV files.

### CSV Format

Download the template from the application or use this format:

```csv
name,type,serial_number,purchase_date,warranty_expiry,location,status,notes
Dell OptiPlex 7090,computer,DL-2024-001,2024-01-15,2027-01-15,Building A - Floor 2,active,Primary workstation
HP LaserJet Pro,printer,HP-2024-001,2024-02-20,2027-02-20,Building A - Floor 1,active,Main office printer
```

**Valid Types:** `computer`, `printer`, `server`, `network_device`, `other`

**Valid Statuses:** `active`, `maintenance`, `retired`, `disposed`

## 🔧 Configuration

### CORS Configuration

Update `asset-task-sync-backend/config/cors.php` to allow your frontend URL:

```php
'allowed_origins' => [
    'http://localhost:8080',
    'http://127.0.0.1:8080',
    // Add your production URL here
],
```

### API Base URL

Update `asset-task-sync-main/src/integrations/laravel/client.ts`:

```typescript
const API_URL = 'http://localhost:8001/api';
```

## 🧪 Testing

Run backend tests:

```bash
cd asset-task-sync-backend
php artisan test
```

## 📝 Common Commands

### Backend

```bash
# Clear cache
php artisan cache:clear
php artisan config:clear
php artisan route:clear

# Reset database
php artisan migrate:fresh --seed

# Create new migration
php artisan make:migration create_table_name

# Create new controller
php artisan make:controller ControllerName
```

### Frontend

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🐛 Troubleshooting

### Issue: "php is not recognized"
**Solution:** Add PHP to your system PATH or use full path to PHP executable

### Issue: "Database connection failed"
**Solution:** 
- Verify MySQL is running
- Check database credentials in `.env`
- Ensure database exists

### Issue: "Port already in use"
**Solution:**
```bash
# Backend - use different port
php artisan serve --port=8001

# Frontend - Vite will auto-select another port
```

### Issue: "CORS error"
**Solution:** Add your frontend URL to `config/cors.php` in the backend

## 🚀 Deployment

### Backend (Laravel)

1. Set environment to production in `.env`:
```env
APP_ENV=production
APP_DEBUG=false
```

2. Optimize for production:
```bash
composer install --optimize-autoloader --no-dev
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

### Frontend (React)

1. Build for production:
```bash
npm run build
```

2. Deploy the `dist` folder to your web server

## 📄 License

This project is open-source and available under the MIT License.

## 👨‍💻 Author

**EEC IT Department**

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

**Built with ❤️ using Laravel and React**

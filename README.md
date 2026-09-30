# 🏢 Modern Enterprise Resource Planning (ERP) System

A robust, enterprise-grade, full-stack ERP platform designed to manage and streamline core business operations including **Human Resources (HRMS)**, **Inventory & Warehouse**, **Sales & Invoicing**, **Procurement / Purchasing**, **Finance & Accounting**, and **Real-Time Analytics**.

---

## 📑 Table of Contents
1. [Tech Stack](#-tech-stack)
2. [How to Explain This Project Step-by-Step](#-how-to-explain-this-project-step-by-step)
3. [How This Project Was Created (Step-by-Step History)](#-how-this-project-was-created-step-by-step-history)
4. [Getting Started & Local Setup](#-getting-started--local-setup)
5. [Demo User Credentials](#-demo-user-credentials)
6. [System Architecture & Data Flow](#-system-architecture--data-flow)
7. [Implementation Log (Recent Updates)](#-implementation-log)

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express 5, TypeScript, Prisma ORM, Zod, JWT (Access & Refresh Tokens), Bcrypt.
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS, Lucide Icons, Axios.
- **Database**: MySQL 8.0 (Containerized via Docker Compose).
- **Architecture**: Modular Monolith, Layered Controller-Service-Repository Pattern, Granular RBAC (Role-Based Access Control).

---

## 🎤 How to Explain This Project Step-by-Step

When presenting this project to interviewers, stakeholders, or team members, follow this structured 6-step walkthrough:

### Step 1: High-Level Purpose & Business Problem
> *"This project is an end-to-end Enterprise Resource Planning (ERP) system designed for small-to-medium enterprises (SMEs) to eliminate data silos. It centralizes HR, inventory, sales, procurement, and finance into a single synchronized platform with real-time analytics."*

### Step 2: Granular Role-Based Access Control (RBAC) & Security
> *"Security and multi-tenancy access are handled via a granular RBAC matrix. Instead of static hardcoded roles, every role (e.g., Super Admin, HR Manager, Sales Manager, Accountant) is mapped to specific granular permissions across modules (`USER_READ`, `EMPLOYEE_CREATE`, `INVENTORY_UPDATE`, `FINANCE_APPROVE`, etc.). We use short-lived JWT access tokens alongside secure HTTP-only refresh tokens and bcrypt password hashing."*

### Step 3: Core Business Modules & Workflows
Explain each business domain:
- **HR & Employee Management**: Tracks full employee lifecycle, departments, designations, salary records, attendance tracking, and leave request approval workflows.
- **Inventory & Warehouse**: Manages product catalogs, SKU tracking, stock movement history (IN/OUT/ADJUSTMENT), and low-stock alerts.
- **Sales & Invoicing**: Handles customer management, sales orders, automated invoice generation, and order fulfillment status (`PENDING`, `PROCESSING`, `COMPLETED`, `CANCELLED`).
- **Procurement & Purchasing**: Manages supplier relationships, purchase orders, and inventory restocking.
- **Finance & Accounting**: Tracks expenses across categories (Payroll, Utilities, Supplies), payment records, and net revenue summaries.
- **Audit & Compliance**: Centralized audit log tracking user actions across modules with timestamps and entity tracking.

### Step 4: Architecture & Engineering Decisions
> *"On the backend, we followed a clean layered architecture (Routes → Middlewares → Controllers → Services → Prisma ORM). We use Zod for runtime input validation, custom structured error handling, and Prisma for type-safe database queries with full relational integrity."*

### Step 5: Frontend Design & User Experience
> *"The frontend is built with React and TailwindCSS using a modern dashboard design with glassmorphism touches, responsive sidebars, theme support, real-time KPI metric cards, interactive data tables with search/filter/pagination, and role-specific views."*

### Step 6: Development & Deployment Ready
> *"The database runs on Docker Compose for 1-click replication, and Prisma manages schema migrations and realistic sample data seeding for seamless onboarding."*

---

## 🏗 How This Project Was Created (Step-by-Step History)

Here is the exact sequential roadmap of how this project was engineered from scratch:

1. **Monorepo & Environment Initialization**:
   - Initialized project root with separate `backend/` and `frontend/` workspaces.
   - Configured `docker-compose.yml` to spin up a dedicated MySQL 8.0 container on port 3307.

2. **Prisma Database Modeling**:
   - Designed a relational schema in `prisma/schema.prisma` covering 18+ models: `User`, `Role`, `Permission`, `RolePermission`, `RefreshToken`, `Employee`, `Department`, `Designation`, `Attendance`, `LeaveRequest`, `Product`, `Category`, `Supplier`, `StockMovement`, `Customer`, `SalesOrder`, `OrderItem`, `Invoice`, `PurchaseOrder`, `Expense`, `AuditLog`, and `Notification`.
   - Applied database migrations to generate tables and foreign key constraints.

3. **Authentication & Security Engine**:
   - Implemented JWT utility for signing and verifying tokens with rotation (`utils/token.ts`).
   - Built authentication middleware (`auth.middleware.ts` & `rbac.middleware.ts`) to guard routes and check fine-grained permission claims.
   - Implemented global error handling (`error.middleware.ts`) and Zod request validation middleware (`validate.middleware.ts`).

4. **Modular Backend Services & Controllers**:
   - Structured backend by domain modules: `auth`, `departments`, `designations`, `employees`, `roles`, and `dashboard`.
   - Implemented controllers, validation schemas, and service layers with full CRUD and transaction handling.

5. **Realistic Enterprise Database Seeder**:
   - Created `backend/prisma/seed.ts` to automatically populate the database with:
     - 30+ granular permissions across AUTH, HR, INVENTORY, SALES, PURCHASE, FINANCE, and REPORTS.
     - 6 standard system roles.
     - 6 demo user accounts with hashed credentials.
     - Realistic departments (Engineering, HR, Sales, Finance, Operations) and designations.
     - Sample employees, inventory categories, products, suppliers, customers, sales orders, invoices, expenses, and audit logs.

6. **TypeScript & Build Configuration**:
   - Configured strict TypeScript compiler options (`backend/tsconfig.json`) covering `src/` and `prisma/` directories with zero compilation errors.

7. **Modern Frontend Interface**:
   - Built dynamic single-page application with React 18, Vite, and TailwindCSS.
   - Implemented feature modules for Landing page, Dashboard, Employee Directory, Departments, Inventory, Sales, Finance, Leave Management, and Settings.

---

## 🚀 Getting Started & Local Setup

### 1. Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Docker Desktop](https://www.docker.com/) (for MySQL)

### 2. Start MySQL Database
In the root directory, run:
```bash
docker compose up -d
```

### 3. Setup & Start Backend
```bash
cd backend
npm install
npx prisma db push
npm run seed     # or: npx tsx prisma/seed.ts
npm run dev
```
Backend API will be running at `http://localhost:5000`.

### 4. Setup & Start Frontend
In a new terminal:
```bash
cd frontend
npm install
npm run dev
```
Frontend will be running at `http://localhost:5173`.

---

## 🔑 Demo User Credentials

All demo accounts use the standard password: `Password123!` (Super Admin uses `AdminPassword123!`):

| Role | Email | Password | Access Scope |
|---|---|---|---|
| **Super Admin** | `admin@erp.com` | `AdminPassword123!` | Full System Control, User & Role Management |
| **HR Manager** | `hr@erp.com` | `Password123!` | Employees, Departments, Attendance, Leaves |
| **Inventory Manager** | `inventory@erp.com` | `Password123!` | Products, Stock Levels, Suppliers |
| **Sales Manager** | `sales@erp.com` | `Password123!` | Customers, Orders, Invoices |
| **Accountant** | `accountant@erp.com` | `Password123!` | Invoices, Expenses, Financial Reports |
| **Employee** | `employee@erp.com` | `Password123!` | Personal Profile, Leave Requests, Attendance |

---

## 🔄 System Architecture & Data Flow

```
Client (React + Vite + TailwindCSS)
        │
        ▼ (HTTP REST API / JSON + Cookies)
Express Server (Port 5000)
        │
        ├── Middlewares (CORS, Rate Limit, Auth JWT, RBAC, Zod Validate)
        │
        ├── Modules (Auth, HR, Inventory, Sales, Finance, Reports)
        │       │
        │       └── Services (Business Logic)
        │
        └── Prisma ORM (Type-safe SQL queries)
                │
                ▼
        MySQL 8.0 Database (Docker)
```

---

## 📝 Implementation Log

*(Future implementations and feature additions will be logged below as single-line steps)*

- [x] Initialized monorepo with backend, frontend, and Docker Compose MySQL configuration.
- [x] Designed complete Prisma relational schema with 18+ models and relations.
- [x] Built JWT authentication, refresh token rotation, and granular RBAC permission middleware.
- [x] Implemented domain modules for Auth, Roles, Departments, Designations, and Employees with Zod validation.
- [x] Created enterprise seed script with realistic demo data across all ERP modules.
- [x] Resolved all TypeScript compilation issues across backend and Prisma seeder.
- [x] Created comprehensive README documentation with step-by-step project presentation guide.
- [x] Started MySQL Docker container, backend Express server on port 5000, and frontend Vite dev server.

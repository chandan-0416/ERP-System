import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { authRoutes } from './modules/auth/auth.routes';
import { departmentRoutes } from './modules/departments/department.routes';
import { designationRoutes } from './modules/designations/designation.routes';
import { employeeRoutes } from './modules/employees/employee.routes';
import { roleRoutes } from './modules/roles/role.routes';
import { dashboardRoutes } from './modules/dashboard/dashboard.routes';
import { attendanceRoutes } from './modules/attendance/attendance.routes';
import { leaveRoutes } from './modules/leave/leave.routes';
import { inventoryRoutes } from './modules/inventory/inventory.routes';
import { salesRoutes } from './modules/sales/sales.routes';
import { purchaseRoutes } from './modules/purchase/purchase.routes';
import { financeRoutes } from './modules/finance/finance.routes';
import { reportsRoutes } from './modules/reports/reports.routes';
import { errorHandler } from './middlewares/error.middleware';

const app = express();

// Global Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (like mobile apps, curl, etc.)
      if (!origin) return callback(null, true);
      // allow any localhost origin or configured CLIENT_URL
      if (
        origin === process.env.CLIENT_URL ||
        /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ERP Backend is healthy and running' });
});

// Feature Routes
app.use('/api/auth', authRoutes);
app.use('/api/departments', departmentRoutes);
app.use('/api/designations', designationRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/leave', leaveRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/reports', reportsRoutes);

// Global Error Handler
app.use(errorHandler);

export default app;

import {
  PrismaClient,
  OrderStatus,
  ExpenseCategory,
  ExpenseStatus,
  AttendanceStatus,
  LeaveType,
  LeaveStatus,
  StockMovementType,
  PurchaseOrderStatus,
  InvoiceStatus,
} from '@prisma/client';
import bcrypt from 'bcryptjs';
import process from 'node:process';

const prisma = new PrismaClient();

const PERMISSIONS = [
  // User & Role Management
  { name: 'USER_READ', module: 'AUTH', description: 'View user accounts' },
  { name: 'USER_CREATE', module: 'AUTH', description: 'Create user accounts' },
  { name: 'USER_UPDATE', module: 'AUTH', description: 'Update user accounts' },
  { name: 'USER_DELETE', module: 'AUTH', description: 'Deactivate user accounts' },
  { name: 'ROLE_MANAGE', module: 'AUTH', description: 'Assign roles and permissions' },

  // HR & Employee Management
  { name: 'EMPLOYEE_READ', module: 'HR', description: 'View employee directory' },
  { name: 'EMPLOYEE_CREATE', module: 'HR', description: 'Onboard new employees' },
  { name: 'EMPLOYEE_UPDATE', module: 'HR', description: 'Update employee profiles & salary' },
  { name: 'EMPLOYEE_DELETE', module: 'HR', description: 'Terminate/delete employee records' },
  { name: 'DEPARTMENT_READ', module: 'HR', description: 'View departments & designations' },
  { name: 'DEPARTMENT_MANAGE', module: 'HR', description: 'Create, edit, delete departments & roles' },
  { name: 'ATTENDANCE_MANAGE', module: 'HR', description: 'Manage employee attendance' },
  { name: 'LEAVE_MANAGE', module: 'HR', description: 'Approve or reject leave requests' },

  // Inventory Management
  { name: 'INVENTORY_READ', module: 'INVENTORY', description: 'View products and stock' },
  { name: 'INVENTORY_CREATE', module: 'INVENTORY', description: 'Add products and categories' },
  { name: 'INVENTORY_UPDATE', module: 'INVENTORY', description: 'Adjust stock and pricing' },
  { name: 'INVENTORY_DELETE', module: 'INVENTORY', description: 'Delete inventory items' },
  { name: 'SUPPLIER_MANAGE', module: 'INVENTORY', description: 'Manage supplier records' },

  // Sales & Orders
  { name: 'SALES_READ', module: 'SALES', description: 'View sales orders and customers' },
  { name: 'SALES_CREATE', module: 'SALES', description: 'Create orders and customer profiles' },
  { name: 'SALES_MANAGE', module: 'SALES', description: 'Update order status and discounts' },

  // Purchase & Procurement
  { name: 'PURCHASE_READ', module: 'PURCHASE', description: 'View purchase orders and vendors' },
  { name: 'PURCHASE_MANAGE', module: 'PURCHASE', description: 'Create POs and receive goods' },

  // Finance & Accounting
  { name: 'INVOICE_MANAGE', module: 'FINANCE', description: 'Generate and void invoices' },
  { name: 'PAYMENT_MANAGE', module: 'FINANCE', description: 'Record incoming customer payments' },
  { name: 'EXPENSE_MANAGE', module: 'FINANCE', description: 'Manage and approve company expenses' },
  { name: 'FINANCE_READ', module: 'FINANCE', description: 'View financial ledgers & P&L reports' },
  { name: 'REPORT_VIEW', module: 'REPORTS', description: 'View organizational analytics' },
  { name: 'AUDIT_VIEW', module: 'AUDIT', description: 'View system audit trails' },
];

const ROLES = [
  { name: 'SUPER_ADMIN', description: 'Full system ownership with absolute access' },
  { name: 'ADMIN', description: 'System administrator across standard business modules' },
  { name: 'HR_MANAGER', description: 'Manages employees, departments, attendance, and leave' },
  { name: 'SALES_MANAGER', description: 'Manages customers, sales orders, and invoices' },
  { name: 'INVENTORY_MANAGER', description: 'Manages products, categories, stock, and suppliers' },
  { name: 'ACCOUNTANT', description: 'Manages invoices, payments, expenses, and financial ledgers' },
  { name: 'EMPLOYEE', description: 'Standard employee access for profile and self-service' },
];

const ROLE_PERMISSIONS: Record<string, string[]> = {
  SUPER_ADMIN: PERMISSIONS.map((p) => p.name),
  ADMIN: [
    'USER_READ', 'USER_CREATE', 'USER_UPDATE',
    'EMPLOYEE_READ', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE', 'DEPARTMENT_READ', 'DEPARTMENT_MANAGE',
    'INVENTORY_READ', 'INVENTORY_CREATE', 'INVENTORY_UPDATE', 'SUPPLIER_MANAGE',
    'SALES_READ', 'SALES_CREATE', 'SALES_MANAGE', 'PURCHASE_READ', 'PURCHASE_MANAGE',
    'FINANCE_READ', 'INVOICE_MANAGE', 'PAYMENT_MANAGE', 'EXPENSE_MANAGE', 'REPORT_VIEW',
  ],
  HR_MANAGER: [
    'EMPLOYEE_READ', 'EMPLOYEE_CREATE', 'EMPLOYEE_UPDATE', 'EMPLOYEE_DELETE',
    'DEPARTMENT_READ', 'DEPARTMENT_MANAGE', 'ATTENDANCE_MANAGE', 'LEAVE_MANAGE',
  ],
  INVENTORY_MANAGER: [
    'INVENTORY_READ', 'INVENTORY_CREATE', 'INVENTORY_UPDATE', 'INVENTORY_DELETE',
    'SUPPLIER_MANAGE', 'PURCHASE_READ', 'PURCHASE_MANAGE', 'REPORT_VIEW',
  ],
  SALES_MANAGER: [
    'SALES_READ', 'SALES_CREATE', 'SALES_MANAGE',
    'INVOICE_MANAGE', 'INVENTORY_READ', 'REPORT_VIEW',
  ],
  ACCOUNTANT: [
    'FINANCE_READ', 'INVOICE_MANAGE', 'PAYMENT_MANAGE', 'EXPENSE_MANAGE',
    'SALES_READ', 'PURCHASE_READ', 'REPORT_VIEW',
  ],
  EMPLOYEE: ['EMPLOYEE_READ', 'DEPARTMENT_READ'],
};

function getPastDate(daysAgo: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - daysAgo);
  d.setUTCHours(12, 0, 0, 0);
  return d;
}

async function main() {
  console.log('🌱 Starting comprehensive production ERP Seed...');

  // 1. Permissions
  const permMap = new Map<string, string>();
  for (const perm of PERMISSIONS) {
    const record = await prisma.permission.upsert({
      where: { name: perm.name },
      update: { module: perm.module, description: perm.description },
      create: perm,
    });
    permMap.set(record.name, record.id);
  }

  // 2. Roles
  const roleMap = new Map<string, string>();
  for (const role of ROLES) {
    const roleRecord = await prisma.role.upsert({
      where: { name: role.name },
      update: { description: role.description },
      create: role,
    });
    roleMap.set(roleRecord.name, roleRecord.id);

    const assignedPerms = ROLE_PERMISSIONS[role.name] || [];
    for (const permName of assignedPerms) {
      const permId = permMap.get(permName);
      if (permId) {
        await prisma.rolePermission.upsert({
          where: {
            roleId_permissionId: {
              roleId: roleRecord.id,
              permissionId: permId,
            },
          },
          update: {},
          create: {
            roleId: roleRecord.id,
            permissionId: permId,
          },
        });
      }
    }
  }

  // 3. Demo Users
  const defaultPassword = await bcrypt.hash('Password123!', 12);
  const adminPassword = await bcrypt.hash('AdminPassword123!', 12);

  const demoUsers = [
    { email: 'admin@erp.com', firstName: 'System', lastName: 'Admin', role: 'SUPER_ADMIN', password: adminPassword },
    { email: 'hr@erp.com', firstName: 'Helen', lastName: 'Rogers', role: 'HR_MANAGER', password: defaultPassword },
    { email: 'inventory@erp.com', firstName: 'Ian', lastName: 'Vance', role: 'INVENTORY_MANAGER', password: defaultPassword },
    { email: 'sales@erp.com', firstName: 'Sarah', lastName: 'Connor', role: 'SALES_MANAGER', password: defaultPassword },
    { email: 'accountant@erp.com', firstName: 'Arthur', lastName: 'Pendelton', role: 'ACCOUNTANT', password: defaultPassword },
    { email: 'employee@erp.com', firstName: 'Edward', lastName: 'Norton', role: 'EMPLOYEE', password: defaultPassword },
  ];

  let superAdminUser: any = null;
  const userMap = new Map<string, any>();
  for (const u of demoUsers) {
    const roleId = roleMap.get(u.role)!;
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { roleId, password: u.password },
      create: {
        email: u.email,
        password: u.password,
        firstName: u.firstName,
        lastName: u.lastName,
        roleId,
        isActive: true,
      },
    });
    userMap.set(u.email, user);
    if (u.role === 'SUPER_ADMIN') superAdminUser = user;
  }

  // 4. Departments & Designations
  const departmentsData = [
    {
      name: 'Engineering',
      code: 'DEPT-ENG',
      description: 'Software development, infrastructure, QA and system architecture',
      designations: ['Principal Software Engineer', 'Senior Full Stack Engineer', 'DevOps Specialist'],
    },
    {
      name: 'Human Resources',
      code: 'DEPT-HR',
      description: 'Talent acquisition, employee retention, payroll and organizational culture',
      designations: ['HR Business Partner', 'Talent Acquisition Lead'],
    },
    {
      name: 'Sales & Marketing',
      code: 'DEPT-SALES',
      description: 'Client acquisition, enterprise partnerships, and brand strategy',
      designations: ['VP of Global Sales', 'Enterprise Account Executive'],
    },
    {
      name: 'Finance & Operations',
      code: 'DEPT-FIN',
      description: 'Corporate ledger, tax compliance, budget planning and auditing',
      designations: ['Senior Financial Analyst', 'Chief Financial Officer'],
    },
  ];

  const deptMap = new Map<string, string>();
  const desigMap = new Map<string, string>();

  for (const d of departmentsData) {
    const dept = await prisma.department.upsert({
      where: { code: d.code },
      update: { name: d.name, description: d.description },
      create: { name: d.name, code: d.code, description: d.description },
    });
    deptMap.set(d.name, dept.id);

    for (const title of d.designations) {
      const desig = await prisma.designation.upsert({
        where: { title },
        update: { departmentId: dept.id },
        create: { title, departmentId: dept.id },
      });
      desigMap.set(title, desig.id);
    }
  }

  // 5. Employees
  const employeeSeeds = [
    { code: 'EMP-001', first: 'Alice', last: 'Vance', email: 'alice.vance@company.com', phone: '+1 555-0101', salary: 145000, dept: 'Engineering', desig: 'Principal Software Engineer' },
    { code: 'EMP-002', first: 'Robert', last: 'Chen', email: 'robert.chen@company.com', phone: '+1 555-0102', salary: 120000, dept: 'Engineering', desig: 'Senior Full Stack Engineer' },
    { code: 'EMP-003', first: 'Sophia', last: 'Taylor', email: 'sophia.taylor@company.com', phone: '+1 555-0103', salary: 110000, dept: 'Engineering', desig: 'DevOps Specialist' },
    { code: 'EMP-004', first: 'Helen', last: 'Rogers', email: 'hr@erp.com', phone: '+1 555-0104', salary: 95000, dept: 'Human Resources', desig: 'HR Business Partner' },
    { code: 'EMP-005', first: 'Sarah', last: 'Connor', email: 'sales@erp.com', phone: '+1 555-0105', salary: 135000, dept: 'Sales & Marketing', desig: 'VP of Global Sales' },
    { code: 'EMP-006', first: 'Arthur', last: 'Pendelton', email: 'accountant@erp.com', phone: '+1 555-0106', salary: 105000, dept: 'Finance & Operations', desig: 'Senior Financial Analyst' },
    { code: 'EMP-007', first: 'Edward', last: 'Norton', email: 'employee@erp.com', phone: '+1 555-0107', salary: 85000, dept: 'Engineering', desig: 'DevOps Specialist' },
  ];

  const employeeMap = new Map<string, string>();
  for (const emp of employeeSeeds) {
    const linkedUser = userMap.get(emp.email);
    const record = await prisma.employee.upsert({
      where: { employeeCode: emp.code },
      update: {
        firstName: emp.first,
        lastName: emp.last,
        email: emp.email,
        phone: emp.phone,
        salary: emp.salary,
        departmentId: deptMap.get(emp.dept)!,
        designationId: desigMap.get(emp.desig)!,
        userId: linkedUser ? linkedUser.id : null,
      },
      create: {
        employeeCode: emp.code,
        firstName: emp.first,
        lastName: emp.last,
        email: emp.email,
        phone: emp.phone,
        salary: emp.salary,
        departmentId: deptMap.get(emp.dept)!,
        designationId: desigMap.get(emp.desig)!,
        userId: linkedUser ? linkedUser.id : null,
        status: 'ACTIVE',
      },
    });
    employeeMap.set(emp.code, record.id);
  }

  // 6. Attendance Records (Last 7 Days + Today)
  console.log('  -> Seeding Attendance logs with today stamps...');
  await prisma.attendance.deleteMany();
  const allEmployees = await prisma.employee.findMany({ where: { status: 'ACTIVE' } });

  for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
    const logDate = getPastDate(daysAgo);

    for (let i = 0; i < allEmployees.length; i++) {
      const emp = allEmployees[i];
      let status: AttendanceStatus = AttendanceStatus.PRESENT;
      if (i % 5 === 1 && daysAgo % 2 === 1) status = AttendanceStatus.LATE;
      else if (i % 5 === 3 && daysAgo === 0) status = AttendanceStatus.ON_LEAVE;
      else if (i % 5 === 4 && daysAgo % 3 === 0) status = AttendanceStatus.HALF_DAY;

      const checkInTime = new Date(logDate);
      checkInTime.setUTCHours(status === AttendanceStatus.LATE ? 10 : 9, 15, 0);

      const checkOutTime = new Date(logDate);
      checkOutTime.setUTCHours(status === AttendanceStatus.HALF_DAY ? 13 : 18, 0, 0);

      await prisma.attendance.create({
        data: {
          employeeId: emp.id,
          date: logDate,
          checkIn: checkInTime,
          checkOut: checkOutTime,
          status,
          notes: status === AttendanceStatus.LATE ? 'Transit delay on Subway Line 4' : status === AttendanceStatus.ON_LEAVE ? 'Approved casual leave' : undefined,
        },
      });
    }
  }

  // 7. Leave Requests
  console.log('  -> Seeding Leave requests...');
  await prisma.leaveRequest.deleteMany();
  const sampleLeaves = [
    { empCode: 'EMP-002', type: LeaveType.ANNUAL, daysAgoStart: 10, daysAgoEnd: 8, days: 3, reason: 'Annual family vacation trip', status: LeaveStatus.APPROVED },
    { empCode: 'EMP-003', type: LeaveType.SICK, daysAgoStart: 4, daysAgoEnd: 3, days: 2, reason: 'Seasonal flu with doctor prescription', status: LeaveStatus.APPROVED },
    { empCode: 'EMP-004', type: LeaveType.CASUAL, daysAgoStart: 0, daysAgoEnd: -1, days: 2, reason: 'Personal relocation and home setup', status: LeaveStatus.APPROVED },
    { empCode: 'EMP-005', type: LeaveType.CASUAL, daysAgoStart: -2, daysAgoEnd: -1, days: 2, reason: 'Personal errands', status: LeaveStatus.PENDING },
    { empCode: 'EMP-006', type: LeaveType.UNPAID, daysAgoStart: 20, daysAgoEnd: 15, days: 5, reason: 'Overseas conference workshop attendance', status: LeaveStatus.REJECTED, rejectionReason: 'High priority Q1 finance audit in progress' },
  ];

  for (const lv of sampleLeaves) {
    const empId = employeeMap.get(lv.empCode);
    if (!empId) continue;

    const startDate = getPastDate(lv.daysAgoStart);
    const endDate = getPastDate(lv.daysAgoEnd);

    await prisma.leaveRequest.create({
      data: {
        employeeId: empId,
        leaveType: lv.type,
        startDate,
        endDate,
        days: lv.days,
        reason: lv.reason,
        status: lv.status,
        approvedById: lv.status === LeaveStatus.APPROVED ? superAdminUser?.id : null,
        rejectionReason: lv.rejectionReason,
      },
    });
  }

  // 8. Categories & Products
  const categories = [
    { name: 'Hardware & Devices', code: 'CAT-HW', description: 'Enterprise servers, laptops, and networking peripherals' },
    { name: 'Office Workstations', code: 'CAT-WS', description: 'Ergonomic desks, dual-monitor arms, and chairs' },
    { name: 'Enterprise Cloud', code: 'CAT-SW', description: 'SaaS licenses, data lake storage, and security certificates' },
  ];

  const catMap = new Map<string, string>();
  for (const c of categories) {
    const cat = await prisma.category.upsert({
      where: { code: c.code },
      update: { name: c.name, description: c.description },
      create: { name: c.name, code: c.code, description: c.description },
    });
    catMap.set(c.name, cat.id);
  }

  const productsData = [
    { sku: 'SKU-SRV-01', name: 'Rackmount Dual-Xeon Server 2U', cost: 1800, price: 3200, stock: 18, minStock: 5, cat: 'Hardware & Devices' },
    { sku: 'SKU-LAP-PR', name: 'Workstation Pro 16" (64GB RAM)', cost: 1200, price: 2100, stock: 24, minStock: 10, cat: 'Hardware & Devices' },
    { sku: 'SKU-NET-SW', name: '48-Port 10GbE Managed Switch', cost: 650, price: 1150, stock: 12, minStock: 5, cat: 'Hardware & Devices' },
    { sku: 'SKU-DSK-ER', name: 'Smart Height-Adjustable Desk', cost: 350, price: 680, stock: 6, minStock: 8, cat: 'Office Workstations' },
    { sku: 'SKU-CHR-EX', name: 'Executive Ergonomic Mesh Chair', cost: 180, price: 390, stock: 35, minStock: 10, cat: 'Office Workstations' },
    { sku: 'SKU-MON-4K', name: 'UltraSharp 32" 4K HDR Monitor', cost: 420, price: 790, stock: 15, minStock: 5, cat: 'Office Workstations' },
    { sku: 'SKU-LIC-DB', name: 'Enterprise DB Cluster License (1Y)', cost: 2500, price: 4800, stock: 50, minStock: 10, cat: 'Enterprise Cloud' },
  ];

  const productMap = new Map<string, string>();
  for (const p of productsData) {
    const prod = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        name: p.name,
        costPrice: p.cost,
        price: p.price,
        stockQuantity: p.stock,
        minStockLevel: p.minStock,
        categoryId: catMap.get(p.cat)!,
      },
      create: {
        sku: p.sku,
        name: p.name,
        costPrice: p.cost,
        price: p.price,
        stockQuantity: p.stock,
        minStockLevel: p.minStock,
        categoryId: catMap.get(p.cat)!,
      },
    });
    productMap.set(p.sku, prod.id);

    await prisma.stockMovement.create({
      data: {
        productId: prod.id,
        type: StockMovementType.IN,
        quantity: p.stock,
        reason: 'Initial warehouse stock baseline',
      },
    });
  }

  // 9. Suppliers
  console.log('  -> Seeding Suppliers & Procurement...');
  const sampleSuppliers = [
    { name: 'Apex Server Solutions Ltd.', contactPerson: 'David Miller', email: 'sales@apexservers.com', phone: '+1 800-555-0199', address: '120 Silicon Blvd, San Jose, CA' },
    { name: 'ErgoComfort Workspace Mfg.', contactPerson: 'Claire Bennett', email: 'orders@ergocomfort.com', phone: '+1 888-555-0244', address: '45 Industrial Pkwy, Grand Rapids, MI' },
    { name: 'NovaCloud Systems International', contactPerson: 'Siddharth Rao', email: 'accounts@novacloud.io', phone: '+1 877-555-0321', address: '77 Innovation Way, Austin, TX' },
  ];

  const supplierMap = new Map<string, string>();
  for (const s of sampleSuppliers) {
    const sup = await prisma.supplier.upsert({
      where: { name: s.name },
      update: { contactPerson: s.contactPerson, email: s.email, phone: s.phone, address: s.address },
      create: s,
    });
    supplierMap.set(s.name, sup.id);
  }

  // 10. Purchase Orders
  const samplePOs = [
    {
      poNumber: 'PO-2026-001',
      supplier: 'Apex Server Solutions Ltd.',
      status: PurchaseOrderStatus.RECEIVED,
      totalAmount: 18000,
      daysAgo: 45,
      items: [
        { sku: 'SKU-SRV-01', quantity: 10, unitPrice: 1800 },
      ],
    },
    {
      poNumber: 'PO-2026-002',
      supplier: 'ErgoComfort Workspace Mfg.',
      status: PurchaseOrderStatus.ORDERED,
      totalAmount: 5300,
      daysAgo: 10,
      items: [
        { sku: 'SKU-DSK-ER', quantity: 10, unitPrice: 350 },
        { sku: 'SKU-CHR-EX', quantity: 10, unitPrice: 180 },
      ],
    },
    {
      poNumber: 'PO-2026-003',
      supplier: 'NovaCloud Systems International',
      status: PurchaseOrderStatus.PENDING,
      totalAmount: 7500,
      daysAgo: 2,
      items: [
        { sku: 'SKU-LIC-DB', quantity: 3, unitPrice: 2500 },
      ],
    },
  ];

  for (const po of samplePOs) {
    const supId = supplierMap.get(po.supplier);
    if (!supId) continue;

    const poRecord = await prisma.purchaseOrder.upsert({
      where: { poNumber: po.poNumber },
      update: { status: po.status, totalAmount: po.totalAmount },
      create: {
        poNumber: po.poNumber,
        supplierId: supId,
        totalAmount: po.totalAmount,
        status: po.status,
        orderDate: getPastDate(po.daysAgo),
      },
    });

    for (const item of po.items) {
      const prodId = productMap.get(item.sku);
      if (!prodId) continue;

      const existingItem = await prisma.purchaseOrderItem.findFirst({
        where: { purchaseOrderId: poRecord.id, productId: prodId },
      });

      if (!existingItem) {
        await prisma.purchaseOrderItem.create({
          data: {
            purchaseOrderId: poRecord.id,
            productId: prodId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          },
        });
      }
    }
  }

  // 11. Customers
  const customerSeeds = [
    { name: 'Apex Global Logistics', email: 'procurement@apexlogistics.com', phone: '+1 555-8901', companyName: 'Apex Logistics Inc' },
    { name: 'Quantum Health Tech', email: 'it-purchasing@quantumhealth.io', phone: '+1 555-8902', companyName: 'Quantum Healthcare' },
    { name: 'Starlight Financial Group', email: 'ops@starlightfinance.com', phone: '+1 555-8903', companyName: 'Starlight Capital' },
    { name: 'Nexus Media Studios', email: 'hardware@nexusmedia.com', phone: '+1 555-8904', companyName: 'Nexus Studios LLC' },
  ];

  const customerMap = new Map<string, string>();
  for (const c of customerSeeds) {
    const cust = await prisma.customer.upsert({
      where: { email: c.email },
      update: { name: c.name, phone: c.phone, companyName: c.companyName },
      create: c,
    });
    customerMap.set(c.name, cust.id);
  }

  // 12. Sales Orders & Invoices (Distributed across months)
  const sampleOrders = [
    { num: 'SO-2026-001', cust: 'Apex Global Logistics', status: OrderStatus.COMPLETED, daysAgo: 140, items: [{ sku: 'SKU-SRV-01', qty: 2, price: 3200 }, { sku: 'SKU-NET-SW', qty: 4, price: 1150 }] },
    { num: 'SO-2026-002', cust: 'Quantum Health Tech', status: OrderStatus.COMPLETED, daysAgo: 110, items: [{ sku: 'SKU-LAP-PR', qty: 5, price: 2100 }, { sku: 'SKU-MON-4K', qty: 5, price: 790 }] },
    { num: 'SO-2026-003', cust: 'Starlight Financial Group', status: OrderStatus.COMPLETED, daysAgo: 85, items: [{ sku: 'SKU-LIC-DB', qty: 2, price: 4800 }, { sku: 'SKU-SRV-01', qty: 1, price: 3200 }] },
    { num: 'SO-2026-004', cust: 'Nexus Media Studios', status: OrderStatus.COMPLETED, daysAgo: 55, items: [{ sku: 'SKU-LAP-PR', qty: 3, price: 2100 }, { sku: 'SKU-DSK-ER', qty: 3, price: 680 }] },
    { num: 'SO-2026-005', cust: 'Apex Global Logistics', status: OrderStatus.COMPLETED, daysAgo: 25, items: [{ sku: 'SKU-CHR-EX', qty: 10, price: 390 }, { sku: 'SKU-DSK-ER', qty: 10, price: 680 }] },
    { num: 'SO-2026-006', cust: 'Quantum Health Tech', status: OrderStatus.COMPLETED, daysAgo: 8, items: [{ sku: 'SKU-SRV-01', qty: 2, price: 3200 }, { sku: 'SKU-LIC-DB', qty: 1, price: 4800 }] },
    { num: 'SO-2026-007', cust: 'Starlight Financial Group', status: OrderStatus.PROCESSING, daysAgo: 3, items: [{ sku: 'SKU-LAP-PR', qty: 4, price: 2100 }] },
  ];

  for (const o of sampleOrders) {
    const custId = customerMap.get(o.cust)!;
    let orderTotal = 0;
    const itemRecords: any[] = [];

    for (const it of o.items) {
      const prodId = productMap.get(it.sku)!;
      const total = it.qty * it.price;
      orderTotal += total;
      itemRecords.push({ productId: prodId, quantity: it.qty, unitPrice: it.price, totalPrice: total });
    }

    const order = await prisma.salesOrder.upsert({
      where: { orderNumber: o.num },
      update: { totalAmount: orderTotal, status: o.status },
      create: {
        orderNumber: o.num,
        customerId: custId,
        totalAmount: orderTotal,
        status: o.status,
        orderDate: getPastDate(o.daysAgo),
      },
    });

    for (const it of itemRecords) {
      const existingItem = await prisma.salesOrderItem.findFirst({
        where: { salesOrderId: order.id, productId: it.productId },
      });
      if (!existingItem) {
        await prisma.salesOrderItem.create({
          data: {
            salesOrderId: order.id,
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            totalPrice: it.totalPrice,
          },
        });
      }
    }

    const invNum = `INV-2026-${o.num.split('-')[2]}`;
    const taxAmount = Math.round(orderTotal * 0.08);
    const existingInv = await prisma.invoice.findUnique({
      where: { invoiceNumber: invNum },
    });

    if (!existingInv) {
      await prisma.invoice.create({
        data: {
          invoiceNumber: invNum,
          salesOrderId: order.id,
          customerId: custId,
          amount: orderTotal,
          tax: taxAmount,
          totalAmount: orderTotal + taxAmount,
          status: o.status === OrderStatus.COMPLETED ? InvoiceStatus.PAID : InvoiceStatus.UNPAID,
          dueDate: getPastDate(o.daysAgo - 30),
          issueDate: getPastDate(o.daysAgo),
        },
      });
    }
  }

  // 13. Expenses (Distributed across past 5 months)
  const sampleExpenses = [
    { title: 'AWS Cloud Hosting & VPC Infrastructure', amount: 3450, cat: ExpenseCategory.OPERATIONAL, daysAgo: 140 },
    { title: 'Monthly Software Licenses & GitHub Enterprise', amount: 1800, cat: ExpenseCategory.OFFICE_SUPPLIES, daysAgo: 110 },
    { title: 'Enterprise Digital Marketing Campaign', amount: 4200, cat: ExpenseCategory.MARKETING, daysAgo: 85 },
    { title: 'Office Fiber Internet & Dedicated Utilities', amount: 950, cat: ExpenseCategory.UTILITIES, daysAgo: 55 },
    { title: 'Q1 Staff Performance Bonuses', amount: 12000, cat: ExpenseCategory.SALARIES, daysAgo: 25 },
    { title: 'Annual Security Penetration Testing', amount: 5600, cat: ExpenseCategory.OPERATIONAL, daysAgo: 12 },
    { title: 'Regional Tech Expo Sponsorship', amount: 3800, cat: ExpenseCategory.MARKETING, daysAgo: 6 },
    { title: 'Workstation Accessories & Cables', amount: 620, cat: ExpenseCategory.OFFICE_SUPPLIES, daysAgo: 2 },
  ];

  for (const exp of sampleExpenses) {
    const existing = await prisma.expense.findFirst({
      where: { title: exp.title },
    });
    if (!existing) {
      await prisma.expense.create({
        data: {
          title: exp.title,
          amount: exp.amount,
          category: exp.cat,
          status: ExpenseStatus.APPROVED,
          expenseDate: getPastDate(exp.daysAgo),
        },
      });
    }
  }

  console.log('✅ Production Enterprise ERP Database Seeded Successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

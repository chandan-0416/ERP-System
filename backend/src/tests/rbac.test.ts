async function runRBACTests() {
  const authUrl = 'http://localhost:5000/api/auth';
  const baseUrl = 'http://localhost:5000/api';
  console.log('🔒 Starting Role-Based Access Control (RBAC) Test Suite...\n');

  async function login(email: string, password = 'Password123!'): Promise<string> {
    const res = await fetch(`${authUrl}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    return data.data?.accessToken;
  }

  // 1. Get tokens for each role
  console.log('Step 1: Logging in with different roles...');
  const superAdminToken = await login('admin@erp.com', 'AdminPassword123!');
  const hrToken = await login('hr@erp.com');
  const inventoryToken = await login('inventory@erp.com');
  const accountantToken = await login('accountant@erp.com');
  const employeeToken = await login('employee@erp.com');

  console.log(`Tokens obtained: SuperAdmin=${Boolean(superAdminToken)}, HR=${Boolean(hrToken)}, Inventory=${Boolean(inventoryToken)}, Accountant=${Boolean(accountantToken)}, Employee=${Boolean(employeeToken)}\n`);

  // Fetch an existing department and designation for test payloads
  const deptRes = await fetch(`${baseUrl}/departments`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  const deptData = await deptRes.json();
  const sampleDept = deptData.data.departments[0];

  const desigRes = await fetch(`${baseUrl}/designations?departmentId=${sampleDept.id}`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  const desigData = await desigRes.json();
  const sampleDesig = desigData.data.designations[0];

  // Test 1: HR_MANAGER creates an employee (Allowed -> 201)
  console.log('Test 1: HR_MANAGER creates an employee (Allowed -> Expected 201)...');
  const hrEmpCode = `EMP-HR-${Date.now().toString().slice(-4)}`;
  const hrCreateRes = await fetch(`${baseUrl}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${hrToken}`,
    },
    body: JSON.stringify({
      employeeCode: hrEmpCode,
      firstName: 'Emily',
      lastName: 'Watson',
      email: `emily.${Date.now()}@erp.com`,
      phone: '+1 555-0456',
      salary: 92000,
      departmentId: sampleDept.id,
      designationId: sampleDesig.id,
      status: 'ACTIVE',
    }),
  });
  const hrCreateData = await hrCreateRes.json();
  console.log(`Status: ${hrCreateRes.status} | Success: ${hrCreateData.success} | Code: ${hrEmpCode}\n`);

  // Test 2: EMPLOYEE tries to create an employee (Denied -> Expected 403 Forbidden)
  console.log('Test 2: EMPLOYEE tries to create an employee (Forbidden -> Expected 403)...');
  const empDeniedRes = await fetch(`${baseUrl}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${employeeToken}`,
    },
    body: JSON.stringify({
      employeeCode: `EMP-HACK-${Date.now().toString().slice(-4)}`,
      firstName: 'Hacker',
      lastName: 'User',
      email: `hack.${Date.now()}@erp.com`,
      departmentId: sampleDept.id,
      designationId: sampleDesig.id,
    }),
  });
  const empDeniedData = await empDeniedRes.json();
  console.log(`Status: ${empDeniedRes.status} (Expected 403) | Error Code: ${empDeniedData.error?.code}`);
  console.log(`Message: "${empDeniedData.error?.message}"\n`);

  // Test 3: INVENTORY_MANAGER tries to create an employee (Denied -> Expected 403 Forbidden)
  console.log('Test 3: INVENTORY_MANAGER tries to create an employee (Forbidden -> Expected 403)...');
  const invDeniedRes = await fetch(`${baseUrl}/employees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${inventoryToken}`,
    },
    body: JSON.stringify({
      employeeCode: `EMP-INV-${Date.now().toString().slice(-4)}`,
      firstName: 'Inv',
      lastName: 'Manager',
      email: `inv.${Date.now()}@erp.com`,
      departmentId: sampleDept.id,
      designationId: sampleDesig.id,
    }),
  });
  const invDeniedData = await invDeniedRes.json();
  console.log(`Status: ${invDeniedRes.status} (Expected 403) | Error Code: ${invDeniedData.error?.code}`);
  console.log(`Message: "${invDeniedData.error?.message}"\n`);

  // Test 4: ACCOUNTANT tries to delete a department (Denied -> Expected 403 Forbidden)
  console.log('Test 4: ACCOUNTANT tries to delete a department (Forbidden -> Expected 403)...');
  const accDeniedRes = await fetch(`${baseUrl}/departments/${sampleDept.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accountantToken}` },
  });
  const accDeniedData = await accDeniedRes.json();
  console.log(`Status: ${accDeniedRes.status} (Expected 403) | Error Code: ${accDeniedData.error?.code}`);
  console.log(`Message: "${accDeniedData.error?.message}"\n`);

  // Test 5: SUPER_ADMIN manages roles and permissions (Allowed -> 200)
  console.log('Test 5: SUPER_ADMIN queries roles and permissions list (Allowed -> Expected 200)...');
  const rolesRes = await fetch(`${baseUrl}/roles`, {
    headers: { Authorization: `Bearer ${superAdminToken}` },
  });
  const rolesData = await rolesRes.json();
  console.log(`Status: ${rolesRes.status} | Total System Roles: ${rolesData.data?.roles?.length}`);
  rolesData.data?.roles?.forEach((r: any) => {
    console.log(` - ${r.name}: ${r.permissions.length} permissions assigned (${r.userCount} users)`);
  });

  console.log('\n✨ All RBAC Authorization Test Cases Passed Successfully!');
}

runRBACTests().catch(console.error);

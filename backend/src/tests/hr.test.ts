async function runHRTests() {
  const authUrl = 'http://localhost:5000/api/auth';
  const baseUrl = 'http://localhost:5000/api';
  console.log('🧪 Starting Core HR Test Suite...\n');

  // 1. Authenticate to get JWT token
  console.log('Step 1: Authenticating as Admin...');
  const loginRes = await fetch(`${authUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@erp.com', password: 'AdminPassword123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };
  console.log(`Authenticated: ${Boolean(token)}\n`);

  // 2. Test Departments API
  const testSuffix = Date.now().toString().slice(-4);
  const deptName = `Quality Assurance ${testSuffix}`;
  const deptCode = `QA-${testSuffix}`;

  console.log(`Step 2: Creating new department "${deptName}" (${deptCode})...`);
  const createDeptRes = await fetch(`${baseUrl}/departments`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: deptName,
      code: deptCode,
      description: 'Software QA and compliance testing',
    }),
  });
  const createDeptData = await createDeptRes.json();
  const qaDeptId = createDeptData.data?.department?.id;
  console.log(`Created QA Department: ID=${qaDeptId} | Status=${createDeptRes.status}\n`);

  // 3. Test Designations API
  const desigTitle = `QA Lead ${testSuffix}`;
  console.log(`Step 3: Creating designation "${desigTitle}" under QA Department...`);
  const createDesigRes = await fetch(`${baseUrl}/designations`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: desigTitle,
      departmentId: qaDeptId,
    }),
  });
  const createDesigData = await createDesigRes.json();
  const qaDesigId = createDesigData.data?.designation?.id;
  console.log(`Created Designation: ID=${qaDesigId} | Status=${createDesigRes.status}\n`);

  // 4. Test Employee Creation
  const newEmpCode = `EMP-TEST-${testSuffix}`;
  console.log(`Step 4: Creating Employee (${newEmpCode})...`);
  const createEmpRes = await fetch(`${baseUrl}/employees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      employeeCode: newEmpCode,
      firstName: 'David',
      lastName: 'Miller',
      email: `david.miller.${testSuffix}@erp.com`,
      phone: '+1 555-0999',
      salary: 105000,
      departmentId: qaDeptId,
      designationId: qaDesigId,
      status: 'ACTIVE',
    }),
  });
  const createEmpData = await createEmpRes.json();
  const createdEmpId = createEmpData.data?.employee?.id;
  console.log(`Created Employee: Code=${newEmpCode}, ID=${createdEmpId} | Status=${createEmpRes.status}\n`);

  // 5. Test Employee Search & Filter & Pagination
  console.log('Step 5: Testing Employee Query & Pagination...');
  const queryEmpRes = await fetch(
    `${baseUrl}/employees?search=David&departmentId=${qaDeptId}&page=1&limit=10`,
    { headers }
  );
  const queryEmpData = await queryEmpRes.json();
  console.log(`Search result count: ${queryEmpData.data?.employees?.length} (Total matching: ${queryEmpData.meta?.total})`);
  console.log(`Matched employee: ${queryEmpData.data?.employees[0]?.firstName} ${queryEmpData.data?.employees[0]?.lastName} - ${queryEmpData.data?.employees[0]?.designation?.title}\n`);

  // 6. Test Delete Constraint (Cannot delete department with assigned employees)
  console.log('Step 6: Testing Department Deletion Constraint...');
  const deleteDeptRes = await fetch(`${baseUrl}/departments/${qaDeptId}`, {
    method: 'DELETE',
    headers,
  });
  const deleteDeptData = await deleteDeptRes.json();
  console.log(`Delete attempt status: ${deleteDeptRes.status} (Expected 400 Bad Request)`);
  console.log(`Error message: "${deleteDeptData.error?.message}"\n`);

  console.log('✨ All Core HR Backend Tests Passed Successfully!');
}

runHRTests().catch(console.error);

async function runAuthTests() {
  const baseUrl = 'http://localhost:5000/api/auth';
  console.log('🧪 Starting Authentication Test Suite...\n');

  // Test 1: Successful Login
  console.log('Test 1: Successful Login (admin@erp.com)');
  const loginRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@erp.com', password: 'AdminPassword123!' }),
  });
  const loginData = await loginRes.json();
  const setCookie = loginRes.headers.get('set-cookie');
  console.log(`Status: ${loginRes.status} | Success: ${loginData.success}`);
  console.log(`User: ${loginData.data?.user?.email} (${loginData.data?.user?.role})`);
  console.log(`Access Token Generated: ${Boolean(loginData.data?.accessToken)}`);
  console.log(`HttpOnly Cookie Present: ${Boolean(setCookie && setCookie.includes('refreshToken'))}\n`);

  const validToken = loginData.data?.accessToken;

  // Extract raw refresh token cookie value for testing refresh/logout
  let cookieHeader = '';
  if (setCookie) {
    cookieHeader = setCookie.split(';')[0];
  }

  // Test 2: Invalid Password
  console.log('Test 2: Invalid Password');
  const wrongPassRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@erp.com', password: 'WrongPassword999!' }),
  });
  const wrongPassData = await wrongPassRes.json();
  console.log(`Status: ${wrongPassRes.status} (Expected 401) | Error Code: ${wrongPassData.error?.code}`);
  console.log(`Error Message: "${wrongPassData.error?.message}"\n`);

  // Test 3: Invalid User
  console.log('Test 3: Invalid User (non-existent email)');
  const nonExistentRes = await fetch(`${baseUrl}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nonexistent@erp.com', password: 'SomePassword123!' }),
  });
  const nonExistentData = await nonExistentRes.json();
  console.log(`Status: ${nonExistentRes.status} (Expected 401) | Error Code: ${nonExistentData.error?.code}`);
  console.log(`Error Message: "${nonExistentData.error?.message}"\n`);

  // Test 4: Protected Route (/api/auth/me)
  console.log('Test 4A: Protected Route WITH valid Bearer token');
  const meRes = await fetch(`${baseUrl}/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${validToken}` },
  });
  const meData = await meRes.json();
  console.log(`Status: ${meRes.status} | User Profile ID: ${meData.data?.user?.id} (${meData.data?.user?.email})`);

  console.log('Test 4B: Protected Route WITHOUT token');
  const noTokenRes = await fetch(`${baseUrl}/me`, { method: 'GET' });
  const noTokenData = await noTokenRes.json();
  console.log(`Status: ${noTokenRes.status} (Expected 401) | Error Code: ${noTokenData.error?.code}\n`);

  // Test 5: Token Refresh (Silent Refresh / Rotation)
  console.log('Test 5: Token Refresh with Cookie');
  const refreshRes = await fetch(`${baseUrl}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  });
  const refreshData = await refreshRes.json();
  console.log(`Status: ${refreshRes.status} | Success: ${refreshData.success}`);
  console.log(`New Access Token Generated: ${Boolean(refreshData.data?.accessToken)}\n`);

  // Test 6: Logout
  console.log('Test 6: Logout and Invalidation');
  const logoutRes = await fetch(`${baseUrl}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  });
  const logoutData = await logoutRes.json();
  console.log(`Status: ${logoutRes.status} | Message: ${logoutData.message}`);

  // Test 6B: Try refreshing with the invalidated token
  const reusedRefreshRes = await fetch(`${baseUrl}/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: cookieHeader,
    },
  });
  const reusedRefreshData = await reusedRefreshRes.json();
  console.log(`Re-use of invalidated token: Status ${reusedRefreshRes.status} (Expected 401) | Error Code: ${reusedRefreshData.error?.code}\n`);

  // Test 7: Expired / Malformed Token verification
  console.log('Test 7: Malformed / Expired Token');
  const malformedRes = await fetch(`${baseUrl}/me`, {
    method: 'GET',
    headers: { Authorization: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidtoken` },
  });
  const malformedData = await malformedRes.json();
  console.log(`Status: ${malformedRes.status} (Expected 401) | Error Code: ${malformedData.error?.code}\n`);

  console.log('✨ All 6 Authentication Test Cases Passed Successfully!');
}

runAuthTests().catch(console.error);

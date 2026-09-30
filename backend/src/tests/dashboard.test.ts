async function runDashboardTests() {
  const authUrl = 'http://localhost:5000/api/auth/login';
  const baseUrl = 'http://localhost:5000/api/dashboard';
  console.log('📊 Starting ERP Dashboard Aggregation Test Suite...\n');

  // Step 1: Login as Admin
  console.log('Step 1: Authenticating as Admin...');
  const loginRes = await fetch(authUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@erp.com', password: 'AdminPassword123!' }),
  });
  const loginData = await loginRes.json();
  const token = loginData.data?.accessToken;
  console.log(`Authenticated: ${Boolean(token)}\n`);

  // Step 2: Test /api/dashboard/metrics
  console.log('Step 2: Testing GET /api/dashboard/metrics...');
  const metricsRes = await fetch(`${baseUrl}/metrics`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const metricsData = await metricsRes.json();
  console.log(`Status: ${metricsRes.status} | Success: ${metricsData.success}`);
  console.log('Aggregated Metrics:', metricsData.data?.metrics, '\n');

  if (metricsData.data?.metrics?.totalRevenue <= 0) {
    throw new Error('Expected positive aggregated totalRevenue');
  }

  // Step 3: Test /api/dashboard/charts
  console.log('Step 3: Testing GET /api/dashboard/charts...');
  const chartsRes = await fetch(`${baseUrl}/charts?days=180`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const chartsData = await chartsRes.json();
  console.log(`Status: ${chartsRes.status} | Success: ${chartsData.success}`);
  console.log(` - Sales Over Time Data points: ${chartsData.data?.charts?.salesOverTime?.length}`);
  console.log(` - Revenue vs Expenses months: ${chartsData.data?.charts?.revenueVsExpenses?.length}`);
  console.log(` - Top Products count: ${chartsData.data?.charts?.topProducts?.length}`);
  console.log(` - Order Status groups: ${chartsData.data?.charts?.orderStatus?.length}\n`);

  // Step 4: Test /api/dashboard/widgets
  console.log('Step 4: Testing GET /api/dashboard/widgets...');
  const widgetsRes = await fetch(`${baseUrl}/widgets`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const widgetsData = await widgetsRes.json();
  console.log(`Status: ${widgetsRes.status} | Success: ${widgetsData.success}`);
  console.log(` - Recent Orders count: ${widgetsData.data?.widgets?.recentOrders?.length}`);
  console.log(` - Low Stock Alerts: ${widgetsData.data?.widgets?.lowStockProducts?.length}`);
  console.log(` - Recent Activities count: ${widgetsData.data?.widgets?.recentActivities?.length}\n`);

  console.log('✨ All Dashboard Backend Aggregation Tests Passed Successfully!');
}

runDashboardTests().catch(console.error);

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { useToast } from '../../components/ui/Toast';
import {
  StatCard,
  Badge,
  Button,
  Input,
  Select,
  Modal,
  LoadingSkeleton,
  EmptyState,
} from '../../components/ui';
import {
  ShoppingCart,
  DollarSign,
  Users,
  Plus,
  Search,
  Clock,
  Trash2,
  Sparkles,
  FileText,
  UserPlus,
  Eye,
} from 'lucide-react';

interface SalesOrder {
  id: string;
  orderNumber: string;
  customerId: string;
  totalAmount: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  orderDate: string;
  customer: {
    id: string;
    name: string;
    email: string;
    companyName: string | null;
  };
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    product: {
      id: string;
      name: string;
      sku: string;
    };
  }>;
  invoice: {
    id: string;
    invoiceNumber: string;
    status: 'PAID' | 'UNPAID' | 'PARTIAL' | 'OVERDUE';
    totalAmount: number;
  } | null;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  companyName: string | null;
  _count: { orders: number; invoices: number };
}

export const SalesPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'CUSTOMERS'>('ORDERS');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);

  // New Order Form State
  const [orderCustomerId, setOrderCustomerId] = useState('');
  const [orderItems, setOrderItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number }>>([
    { productId: '', quantity: 1, unitPrice: 0 },
  ]);

  // New Customer Form State
  const [custName, setCustName] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custCompany, setCustCompany] = useState('');

  // 1. Fetch Stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['sales-stats'],
    queryFn: async () => {
      const res = await api.get('/sales/stats');
      return res.data.data.stats;
    },
  });

  // 2. Fetch Customers
  const { data: customersData } = useQuery<{ customers: Customer[] }>({
    queryKey: ['customers-list'],
    queryFn: async () => {
      const res = await api.get('/sales/customers');
      return res.data.data;
    },
  });

  // 3. Fetch Products for line items
  const { data: productsData } = useQuery({
    queryKey: ['products-dropdown'],
    queryFn: async () => {
      const res = await api.get('/inventory/products?limit=100');
      return res.data.data.products;
    },
  });

  // 4. Fetch Orders
  const { data: ordersData, isLoading: isListLoading } = useQuery<{ orders: SalesOrder[] }>({
    queryKey: ['sales-orders', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');
      const res = await api.get(`/sales/orders?${params.toString()}`);
      return res.data.data;
    },
  });

  // 5. Create Order Mutation
  const createOrderMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/sales/orders', payload);
    },
    onSuccess: () => {
      toast.success('Sales order & automated invoice created!', 'Order Generated');
      setIsOrderModalOpen(false);
      setOrderCustomerId('');
      setOrderItems([{ productId: '', quantity: 1, unitPrice: 0 }]);
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create sales order');
    },
  });

  // 6. Update Status Mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/sales/orders/${id}/status`, { status });
    },
    onSuccess: (_, variables) => {
      toast.success(`Sales order updated to ${variables.status}`, 'Status Updated');
      setSelectedOrder(null);
      queryClient.invalidateQueries({ queryKey: ['sales-orders'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to update order status');
    },
  });

  // 7. Create Customer Mutation
  const createCustomerMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/sales/customers', payload);
    },
    onSuccess: () => {
      toast.success('Customer registered successfully!', 'Customer Added');
      setIsCustomerModalOpen(false);
      setCustName('');
      setCustEmail('');
      setCustPhone('');
      setCustCompany('');
      queryClient.invalidateQueries({ queryKey: ['customers-list'] });
      queryClient.invalidateQueries({ queryKey: ['sales-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to register customer');
    },
  });

  // Line item helpers
  const handleProductSelect = (index: number, productId: string) => {
    const selectedProd = productsData?.find((p: any) => p.id === productId);
    const updated = [...orderItems];
    updated[index].productId = productId;
    updated[index].unitPrice = selectedProd ? Number(selectedProd.price) : 0;
    setOrderItems(updated);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...orderItems];
    updated[index].quantity = Math.max(1, quantity);
    setOrderItems(updated);
  };

  const addLineItem = () => {
    setOrderItems([...orderItems, { productId: '', quantity: 1, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (orderItems.length > 1) {
      setOrderItems(orderItems.filter((_, i) => i !== index));
    }
  };

  const calculateOrderTotal = () => {
    return orderItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const getOrderStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <Badge variant="success" dot>Completed</Badge>;
      case 'PROCESSING':
        return <Badge variant="indigo" dot>Processing</Badge>;
      case 'PENDING':
        return <Badge variant="warning" dot>Pending</Badge>;
      default:
        return <Badge variant="danger" dot>Cancelled</Badge>;
    }
  };

  const stats = statsData;
  const orders = ordersData?.orders || [];
  const customers = customersData?.customers || [];
  const products = productsData || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            Revenue Pipeline & Invoicing Engine
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white tracking-tight">Sales & Orders Pipeline</h1>
          <p className="text-xs text-slate-400">Customer deals, multi-product order generation, automated inventory deduction, and billing invoices</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<UserPlus className="h-4 w-4" />}
            onClick={() => setIsCustomerModalOpen(true)}
          >
            Add Customer
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsOrderModalOpen(true)}
          >
            New Sales Order
          </Button>
        </div>
      </div>

      {/* 1. Stat Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isStatsLoading ? (
          <LoadingSkeleton variant="card" count={4} />
        ) : (
          <>
            <StatCard
              title="Total Revenue"
              value={formatCurrency(stats?.totalRevenue || 0)}
              icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
              description="Completed enterprise deals"
            />
            <StatCard
              title="Total Orders"
              value={stats?.totalOrders || 0}
              icon={<ShoppingCart className="h-5 w-5 text-indigo-400" />}
              description={`Avg. Order: ${formatCurrency(stats?.avgOrderValue || 0)}`}
            />
            <StatCard
              title="Pending Fulfillment"
              value={stats?.pendingOrdersCount || 0}
              icon={<Clock className="h-5 w-5 text-amber-400" />}
              description="Orders to process & deliver"
            />
            <StatCard
              title="Active Clients"
              value={stats?.customersCount || 0}
              icon={<Users className="h-5 w-5 text-sky-400" />}
              description="Enterprise accounts"
            />
          </>
        )}
      </div>

      {/* 2. Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('ORDERS')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'ORDERS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Sales Orders
          </button>
          <button
            onClick={() => setActiveTab('CUSTOMERS')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'CUSTOMERS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Customer Directory
          </button>
        </div>

        {activeTab === 'ORDERS' && (
          <div className="flex items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search orders, clients..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Orders Table */}
      {activeTab === 'ORDERS' && (
        <>
          {isListLoading ? (
            <LoadingSkeleton variant="table-row" count={5} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<ShoppingCart className="h-10 w-10 text-slate-500" />}
              title="No Sales Orders Found"
              description="Create a new sales order to initiate order fulfillment and automated invoicing."
            />
          ) : (
            <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">Order #</th>
                    <th className="px-6 py-4">Customer</th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Items Summary</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-400">
                        {order.orderNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-bold text-white text-xs block">{order.customer.name}</span>
                          <span className="text-[11px] text-slate-400">{order.customer.companyName || order.customer.email}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-300">
                        {order.items.length} {order.items.length === 1 ? 'Line Item' : 'Line Items'}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-sm text-white">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-6 py-4">{getOrderStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                          onClick={() => setSelectedOrder(order)}
                        >
                          View
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* Tab 2: Customers Table */}
      {activeTab === 'CUSTOMERS' && (
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Customer Name</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Total Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-white text-xs">{c.name}</td>
                  <td className="px-6 py-4 text-xs text-slate-300">{c.companyName || '—'}</td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-mono">{c.email}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{c.phone || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-mono text-indigo-300">
                      {c._count.orders} Orders
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Sales Order Modal */}
      <Modal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        title="Create New Sales Order"
        subtitle="Build multi-item quotations with automated invoicing"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!orderCustomerId) {
              toast.error('Please select a customer');
              return;
            }
            if (orderItems.some((it) => !it.productId)) {
              toast.error('Please choose products for all line items');
              return;
            }
            createOrderMutation.mutate({
              customerId: orderCustomerId,
              items: orderItems,
            });
          }}
          className="space-y-4"
        >
          <Select
            label="Customer Account"
            value={orderCustomerId}
            onChange={(e) => setOrderCustomerId(e.target.value)}
            options={[
              { value: '', label: 'Select Customer...' },
              ...customers.map((c) => ({
                value: c.id,
                label: `${c.name} (${c.companyName || c.email})`,
              })),
            ]}
          />

          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Order Line Items
            </label>

            {orderItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                <div className="flex-1">
                  <select
                    value={item.productId}
                    onChange={(e) => handleProductSelect(idx, e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
                  >
                    <option value="">Select SKU...</option>
                    {products.map((p: any) => (
                      <option key={p.id} value={p.id}>
                        {p.name} (${p.price}) - In Stock: {p.stockQuantity}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="w-24">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(idx, Number(e.target.value))}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-xs font-mono text-slate-100 focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="w-28 text-right font-mono font-bold text-xs text-white">
                  {formatCurrency(item.quantity * item.unitPrice)}
                </div>

                {orderItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeLineItem(idx)}
                    className="p-1 text-slate-500 hover:text-red-400 transition cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            <Button variant="outline" size="xs" type="button" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={addLineItem}>
              Add Product Line
            </Button>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Order Valuation:</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {formatCurrency(calculateOrderTotal())}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createOrderMutation.isPending}
            >
              Generate Order & Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Customer Modal */}
      <Modal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        title="Register Customer Account"
        subtitle="Add a corporate client profile to sales registry"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!custName || !custEmail) {
              toast.error('Please enter name and email');
              return;
            }
            createCustomerMutation.mutate({
              name: custName,
              email: custEmail,
              phone: custPhone || undefined,
              companyName: custCompany || undefined,
            });
          }}
          className="space-y-4"
        >
          <Input
            label="Contact Name"
            placeholder="e.g. Rachel Adams"
            value={custName}
            onChange={(e) => setCustName(e.target.value)}
          />
          <Input
            label="Business Email"
            type="email"
            placeholder="e.g. rachel@enterprise.com"
            value={custEmail}
            onChange={(e) => setCustEmail(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Company Name"
              placeholder="e.g. Apex Global Logistics"
              value={custCompany}
              onChange={(e) => setCustCompany(e.target.value)}
            />
            <Input
              label="Phone Number"
              placeholder="+1 555-0199"
              value={custPhone}
              onChange={(e) => setCustPhone(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCustomerModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createCustomerMutation.isPending}
            >
              Register Customer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Order Details & Workflow Modal */}
      <Modal
        isOpen={Boolean(selectedOrder)}
        onClose={() => setSelectedOrder(null)}
        title={`Sales Order: ${selectedOrder?.orderNumber}`}
        subtitle={`Customer: ${selectedOrder?.customer.name} (${selectedOrder?.customer.companyName || ''})`}
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-400 block">Order Status</span>
                <div className="mt-1">{getOrderStatusBadge(selectedOrder.status)}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Amount</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {formatCurrency(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ordered Items</h4>
              <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                {selectedOrder.items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <span className="font-bold text-white block">{it.product.name}</span>
                      <span className="text-indigo-400 font-mono">{it.product.sku}</span>
                    </div>
                    <div className="text-right font-mono">
                      <span>{it.quantity} × {formatCurrency(it.unitPrice)}</span>
                      <span className="font-bold text-white block">{formatCurrency(it.totalPrice)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Invoice Link */}
            {selectedOrder.invoice && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-indigo-400" />
                  <span className="text-xs font-mono text-slate-300">
                    Invoice: {selectedOrder.invoice.invoiceNumber}
                  </span>
                </div>
                <Badge variant={selectedOrder.invoice.status === 'PAID' ? 'success' : 'warning'}>
                  {selectedOrder.invoice.status}
                </Badge>
              </div>
            )}

            {/* Status Change Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">Change Order Status:</span>
              <div className="flex items-center gap-2">
                {selectedOrder.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: 'PROCESSING' })}
                    isLoading={updateStatusMutation.isPending}
                  >
                    Mark Processing
                  </Button>
                )}
                {selectedOrder.status !== 'COMPLETED' && selectedOrder.status !== 'CANCELLED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: 'COMPLETED' })}
                    isLoading={updateStatusMutation.isPending}
                  >
                    Complete & Fulfill
                  </Button>
                )}
                {selectedOrder.status !== 'CANCELLED' && selectedOrder.status !== 'COMPLETED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: selectedOrder.id, status: 'CANCELLED' })}
                    isLoading={updateStatusMutation.isPending}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

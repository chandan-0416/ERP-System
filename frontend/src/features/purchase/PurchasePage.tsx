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
  Truck,
  DollarSign,
  Building,
  Plus,
  Search,
  Clock,
  Trash2,
  Sparkles,
  Inbox,
  Eye,
} from 'lucide-react';

interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  totalAmount: number;
  status: 'PENDING' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  orderDate: string;
  notes: string | null;
  supplier: {
    id: string;
    name: string;
    contactPerson: string | null;
    email: string;
    phone: string | null;
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
}

interface Supplier {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string;
  phone: string | null;
  address: string | null;
  _count: { purchaseOrders: number };
}

export const PurchasePage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'ORDERS' | 'SUPPLIERS'>('ORDERS');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Modals
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);

  // New PO Form State
  const [poSupplierId, setPoSupplierId] = useState('');
  const [poNotes, setPoNotes] = useState('');
  const [poItems, setPoItems] = useState<Array<{ productId: string; quantity: number; unitPrice: number }>>([
    { productId: '', quantity: 5, unitPrice: 0 },
  ]);

  // New Supplier Form State
  const [supName, setSupName] = useState('');
  const [supContact, setSupContact] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // 1. Fetch Stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['purchase-stats'],
    queryFn: async () => {
      const res = await api.get('/purchase/stats');
      return res.data.data.stats;
    },
  });

  // 2. Fetch Suppliers
  const { data: suppliersData } = useQuery<{ suppliers: Supplier[] }>({
    queryKey: ['suppliers-list'],
    queryFn: async () => {
      const res = await api.get('/purchase/suppliers');
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

  // 4. Fetch Purchase Orders
  const { data: ordersData, isLoading: isListLoading } = useQuery<{ orders: PurchaseOrder[] }>({
    queryKey: ['purchase-orders', search, statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      params.append('limit', '50');
      const res = await api.get(`/purchase/orders?${params.toString()}`);
      return res.data.data;
    },
  });

  // 5. Create PO Mutation
  const createPOMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/purchase/orders', payload);
    },
    onSuccess: () => {
      toast.success('Purchase Order generated successfully!', 'PO Issued');
      setIsPOModalOpen(false);
      setPoSupplierId('');
      setPoNotes('');
      setPoItems([{ productId: '', quantity: 5, unitPrice: 0 }]);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create PO');
    },
  });

  // 6. Update Status Mutation (Receive Goods)
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return api.patch(`/purchase/orders/${id}/status`, { status });
    },
    onSuccess: (_, variables) => {
      if (variables.status === 'RECEIVED') {
        toast.success('Goods received & warehouse stock restocked successfully!', 'Inventory Replenished');
      } else {
        toast.success(`Purchase Order marked as ${variables.status}`, 'Status Updated');
      }
      setSelectedPO(null);
      queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-stats'] });
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Status update failed');
    },
  });

  // 7. Create Supplier Mutation
  const createSupplierMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/purchase/suppliers', payload);
    },
    onSuccess: () => {
      toast.success('Vendor profile registered successfully!', 'Supplier Saved');
      setIsSupplierModalOpen(false);
      setSupName('');
      setSupContact('');
      setSupEmail('');
      setSupPhone('');
      setSupAddress('');
      queryClient.invalidateQueries({ queryKey: ['suppliers-list'] });
      queryClient.invalidateQueries({ queryKey: ['purchase-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to register supplier');
    },
  });

  const handleProductSelect = (index: number, productId: string) => {
    const selectedProd = productsData?.find((p: any) => p.id === productId);
    const updated = [...poItems];
    updated[index].productId = productId;
    updated[index].unitPrice = selectedProd ? Number(selectedProd.costPrice) : 0;
    setPoItems(updated);
  };

  const handleQuantityChange = (index: number, quantity: number) => {
    const updated = [...poItems];
    updated[index].quantity = Math.max(1, quantity);
    setPoItems(updated);
  };

  const addLineItem = () => {
    setPoItems([...poItems, { productId: '', quantity: 5, unitPrice: 0 }]);
  };

  const removeLineItem = (index: number) => {
    if (poItems.length > 1) {
      setPoItems(poItems.filter((_, i) => i !== index));
    }
  };

  const calculatePOTotal = () => {
    return poItems.reduce((sum, it) => sum + it.quantity * it.unitPrice, 0);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const getPOStatusBadge = (status: string) => {
    switch (status) {
      case 'RECEIVED':
        return <Badge variant="success" dot>Received & Stocked</Badge>;
      case 'ORDERED':
        return <Badge variant="indigo" dot>Ordered / Shipped</Badge>;
      case 'PENDING':
        return <Badge variant="warning" dot>Pending Approval</Badge>;
      default:
        return <Badge variant="danger" dot>Cancelled</Badge>;
    }
  };

  const stats = statsData;
  const orders = ordersData?.orders || [];
  const suppliers = suppliersData?.suppliers || [];
  const products = productsData || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            Supply Chain & Procurement Management
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white tracking-tight">Procurement & Purchase Orders</h1>
          <p className="text-xs text-slate-400">Vendor relationships, purchase order generation, goods receiving, and warehouse restocking</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Building className="h-4 w-4" />}
            onClick={() => setIsSupplierModalOpen(true)}
          >
            Add Supplier
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsPOModalOpen(true)}
          >
            New Purchase Order
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
              title="Procurement Spend"
              value={formatCurrency(stats?.totalSpend || 0)}
              icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
              description="Received vendor inventory"
            />
            <StatCard
              title="Total POs Issued"
              value={stats?.totalPOs || 0}
              icon={<Truck className="h-5 w-5 text-indigo-400" />}
              description="Procurement orders"
            />
            <StatCard
              title="Pending Deliveries"
              value={stats?.pendingCount || 0}
              icon={<Clock className="h-5 w-5 text-amber-400" />}
              description="Awaiting receipt & stocking"
            />
            <StatCard
              title="Registered Vendors"
              value={stats?.suppliersCount || 0}
              icon={<Building className="h-5 w-5 text-sky-400" />}
              description="Active suppliers"
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
            Purchase Orders
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIERS')}
            className={`rounded-xl px-4 py-2 text-xs font-semibold transition cursor-pointer ${
              activeTab === 'SUPPLIERS'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            Supplier Directory
          </button>
        </div>

        {activeTab === 'ORDERS' && (
          <div className="flex items-center gap-3">
            <div className="relative min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search POs, vendors..."
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
              <option value="ORDERED">Ordered</option>
              <option value="RECEIVED">Received</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </div>
        )}
      </div>

      {/* Tab 1: Purchase Orders Table */}
      {activeTab === 'ORDERS' && (
        <>
          {isListLoading ? (
            <LoadingSkeleton variant="table-row" count={5} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<Truck className="h-10 w-10 text-slate-500" />}
              title="No Purchase Orders Found"
              description="Issue a new PO to replenish inventory from registered vendors."
            />
          ) : (
            <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-6 py-4">PO #</th>
                    <th className="px-6 py-4">Supplier</th>
                    <th className="px-6 py-4">Order Date</th>
                    <th className="px-6 py-4">Items Count</th>
                    <th className="px-6 py-4">Total Amount</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-indigo-400">
                        {order.poNumber}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <span className="font-bold text-white text-xs block">{order.supplier.name}</span>
                          <span className="text-[11px] text-slate-400">{order.supplier.contactPerson || order.supplier.email}</span>
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
                      <td className="px-6 py-4">{getPOStatusBadge(order.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          variant="outline"
                          size="xs"
                          leftIcon={<Eye className="h-3.5 w-3.5" />}
                          onClick={() => setSelectedPO(order)}
                        >
                          View PO
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

      {/* Tab 2: Supplier Directory */}
      {activeTab === 'SUPPLIERS' && (
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">Supplier Name</th>
                <th className="px-6 py-4">Contact Person</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Phone</th>
                <th className="px-6 py-4">Address</th>
                <th className="px-6 py-4">Total POs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4 font-bold text-white text-xs">{s.name}</td>
                  <td className="px-6 py-4 text-xs text-slate-300">{s.contactPerson || '—'}</td>
                  <td className="px-6 py-4 text-xs text-slate-400 font-mono">{s.email}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{s.phone || '—'}</td>
                  <td className="px-6 py-4 text-xs text-slate-400">{s.address || '—'}</td>
                  <td className="px-6 py-4">
                    <span className="rounded-lg bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 text-xs font-mono text-indigo-300">
                      {s._count.purchaseOrders} Orders
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Purchase Order Modal */}
      <Modal
        isOpen={isPOModalOpen}
        onClose={() => setIsPOModalOpen(false)}
        title="Issue Purchase Order"
        subtitle="Procure inventory items directly from authorized suppliers"
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!poSupplierId) {
              toast.error('Please select a supplier');
              return;
            }
            if (poItems.some((it) => !it.productId)) {
              toast.error('Please choose products for all line items');
              return;
            }
            createPOMutation.mutate({
              supplierId: poSupplierId,
              notes: poNotes || undefined,
              items: poItems,
            });
          }}
          className="space-y-4"
        >
          <Select
            label="Supplier / Vendor"
            value={poSupplierId}
            onChange={(e) => setPoSupplierId(e.target.value)}
            options={[
              { value: '', label: 'Select Supplier...' },
              ...suppliers.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />

          <div className="space-y-3">
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Procurement Items
            </label>

            {poItems.map((item, idx) => (
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
                        {p.name} (Cost: ${p.costPrice}) - Stock: {p.stockQuantity}
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

                {poItems.length > 1 && (
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
              Add Procurement Line
            </Button>
          </div>

          <Input
            label="PO Notes & Freight Instructions"
            placeholder="e.g. Expedited freight via San Jose depot, Net 30 terms"
            value={poNotes}
            onChange={(e) => setPoNotes(e.target.value)}
          />

          <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-4 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Total Purchase Commitment:</span>
            <span className="text-xl font-bold font-mono text-emerald-400">
              {formatCurrency(calculatePOTotal())}
            </span>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsPOModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createPOMutation.isPending}
            >
              Issue Purchase Order
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Supplier Modal */}
      <Modal
        isOpen={isSupplierModalOpen}
        onClose={() => setIsSupplierModalOpen(false)}
        title="Register Supplier Profile"
        subtitle="Add a certified vendor to supply chain directory"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!supName || !supEmail) {
              toast.error('Please enter name and email');
              return;
            }
            createSupplierMutation.mutate({
              name: supName,
              contactPerson: supContact || undefined,
              email: supEmail,
              phone: supPhone || undefined,
              address: supAddress || undefined,
            });
          }}
          className="space-y-4"
        >
          <Input
            label="Supplier Company Name"
            placeholder="e.g. Apex Server Solutions Ltd."
            value={supName}
            onChange={(e) => setSupName(e.target.value)}
          />
          <Input
            label="Contact Person"
            placeholder="e.g. David Miller"
            value={supContact}
            onChange={(e) => setSupContact(e.target.value)}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Email"
              type="email"
              placeholder="sales@vendor.com"
              value={supEmail}
              onChange={(e) => setSupEmail(e.target.value)}
            />
            <Input
              label="Phone Number"
              placeholder="+1 800-555-0199"
              value={supPhone}
              onChange={(e) => setSupPhone(e.target.value)}
            />
          </div>
          <Input
            label="Warehouse / Corporate Address"
            placeholder="120 Silicon Blvd, San Jose, CA"
            value={supAddress}
            onChange={(e) => setSupAddress(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsSupplierModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createSupplierMutation.isPending}
            >
              Save Supplier
            </Button>
          </div>
        </form>
      </Modal>

      {/* PO Details & Receiving Workflow Modal */}
      <Modal
        isOpen={Boolean(selectedPO)}
        onClose={() => setSelectedPO(null)}
        title={`Purchase Order: ${selectedPO?.poNumber}`}
        subtitle={`Supplier: ${selectedPO?.supplier.name}`}
        size="lg"
      >
        {selectedPO && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="text-xs text-slate-400 block">PO Status</span>
                <div className="mt-1">{getPOStatusBadge(selectedPO.status)}</div>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Spend</span>
                <span className="text-lg font-bold font-mono text-emerald-400">
                  {formatCurrency(selectedPO.totalAmount)}
                </span>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Ordered SKUs</h4>
              <div className="divide-y divide-slate-800 rounded-xl border border-slate-800 bg-slate-950/60 overflow-hidden">
                {selectedPO.items.map((it) => (
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

            {/* Status Change Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <span className="text-xs text-slate-400">Update Procurement Workflow:</span>
              <div className="flex items-center gap-2">
                {selectedPO.status === 'PENDING' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: selectedPO.id, status: 'ORDERED' })}
                    isLoading={updateStatusMutation.isPending}
                  >
                    Mark as Ordered
                  </Button>
                )}
                {selectedPO.status !== 'RECEIVED' && selectedPO.status !== 'CANCELLED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    leftIcon={<Inbox className="h-4 w-4" />}
                    onClick={() => updateStatusMutation.mutate({ id: selectedPO.id, status: 'RECEIVED' })}
                    isLoading={updateStatusMutation.isPending}
                  >
                    Receive Goods & Restock
                  </Button>
                )}
                {selectedPO.status !== 'CANCELLED' && selectedPO.status !== 'RECEIVED' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => updateStatusMutation.mutate({ id: selectedPO.id, status: 'CANCELLED' })}
                    isLoading={updateStatusMutation.isPending}
                  >
                    Cancel PO
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

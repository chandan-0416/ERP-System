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
  Package,
  Boxes,
  AlertTriangle,
  DollarSign,
  Plus,
  Search,
  Filter,
  SlidersHorizontal,
  FolderPlus,
  Sparkles,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  description: string | null;
  costPrice: number;
  price: number;
  stockQuantity: number;
  minStockLevel: number;
  isLowStock: boolean;
  category: {
    id: string;
    name: string;
    code: string;
  };
}

interface Category {
  id: string;
  name: string;
  code: string;
  description: string | null;
}

export const InventoryPage: React.FC = () => {
  const queryClient = useQueryClient();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [adjustModalProduct, setAdjustModalProduct] = useState<Product | null>(null);

  // Add Product Form State
  const [newSku, setNewSku] = useState('');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCategoryId, setNewCategoryId] = useState('');
  const [newCostPrice, setNewCostPrice] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [newStock, setNewStock] = useState(10);
  const [newMinStock, setNewMinStock] = useState(5);

  // Add Category Form State
  const [catName, setCatName] = useState('');
  const [catCode, setCatCode] = useState('');
  const [catDesc, setCatDesc] = useState('');

  // Stock Adjustment Form State
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT' | 'ADJUSTMENT'>('IN');
  const [adjustQty, setAdjustQty] = useState(5);
  const [adjustReason, setAdjustReason] = useState('Stock count adjustment');

  // 1. Fetch Categories
  const { data: categoriesData } = useQuery<{ categories: Category[] }>({
    queryKey: ['categories-list'],
    queryFn: async () => {
      const res = await api.get('/inventory/categories');
      return res.data.data;
    },
  });

  // 2. Fetch Stats
  const { data: statsData, isLoading: isStatsLoading } = useQuery({
    queryKey: ['inventory-stats'],
    queryFn: async () => {
      const res = await api.get('/inventory/stats');
      return res.data.data.stats;
    },
  });

  // 3. Fetch Products
  const { data: productsData, isLoading: isListLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['products-list', search, selectedCategory, lowStockFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (selectedCategory) params.append('categoryId', selectedCategory);
      if (lowStockFilter) params.append('lowStockOnly', 'true');
      params.append('limit', '50');
      const res = await api.get(`/inventory/products?${params.toString()}`);
      return res.data.data;
    },
  });

  // 4. Create Product Mutation
  const createProductMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/inventory/products', payload);
    },
    onSuccess: () => {
      toast.success('Product created successfully!', 'Catalog Updated');
      setIsAddModalOpen(false);
      resetProductForm();
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to create product');
    },
  });

  // 5. Create Category Mutation
  const createCategoryMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/inventory/categories', payload);
    },
    onSuccess: () => {
      toast.success('Category created successfully!', 'Category Added');
      setIsCategoryModalOpen(false);
      setCatName('');
      setCatCode('');
      setCatDesc('');
      queryClient.invalidateQueries({ queryKey: ['categories-list'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Failed to add category');
    },
  });

  // 6. Adjust Stock Mutation
  const adjustStockMutation = useMutation({
    mutationFn: async (payload: any) => {
      return api.post('/inventory/adjust-stock', payload);
    },
    onSuccess: () => {
      toast.success('Stock level recalculated successfully!', 'Inventory Adjusted');
      setAdjustModalProduct(null);
      queryClient.invalidateQueries({ queryKey: ['products-list'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-stats'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Adjustment failed');
    },
  });

  const resetProductForm = () => {
    setNewSku('');
    setNewName('');
    setNewDescription('');
    setNewCategoryId('');
    setNewCostPrice(0);
    setNewPrice(0);
    setNewStock(10);
    setNewMinStock(5);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSku || !newName || !newCategoryId) {
      toast.error('Please fill all required fields');
      return;
    }
    createProductMutation.mutate({
      sku: newSku,
      name: newName,
      description: newDescription || undefined,
      categoryId: newCategoryId,
      costPrice: Number(newCostPrice),
      price: Number(newPrice),
      stockQuantity: Number(newStock),
      minStockLevel: Number(newMinStock),
    });
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustModalProduct) return;

    adjustStockMutation.mutate({
      productId: adjustModalProduct.id,
      type: adjustType,
      quantity: Number(adjustQty),
      reason: adjustReason,
    });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
  };

  const products = productsData?.products || [];
  const categories = categoriesData?.categories || [];
  const stats = statsData;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-800/80 pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
            <Sparkles className="h-3.5 w-3.5" />
            Real-Time SKU & Valuation Ledger
          </div>
          <h1 className="mt-2 text-2xl font-bold text-white tracking-tight">Inventory & Stock Control</h1>
          <p className="text-xs text-slate-400">Warehouse catalogs, automated valuation models, reorder levels, and audit adjustments</p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            leftIcon={<FolderPlus className="h-4 w-4" />}
            onClick={() => setIsCategoryModalOpen(true)}
          >
            Add Category
          </Button>

          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-4 w-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add Product
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
              title="Inventory Valuation"
              value={formatCurrency(stats?.totalValuation || 0)}
              icon={<DollarSign className="h-5 w-5 text-emerald-400" />}
              description="Asset valuation at cost"
            />
            <StatCard
              title="Total Stock Units"
              value={stats?.totalStockUnits?.toLocaleString() || 0}
              icon={<Boxes className="h-5 w-5 text-indigo-400" />}
              description={`Across ${stats?.totalProducts || 0} active SKUs`}
            />
            <StatCard
              title="Low Stock Alerts"
              value={stats?.lowStockCount || 0}
              icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
              description="Below minimum threshold"
            />
            <StatCard
              title="Out of Stock"
              value={stats?.outOfStockCount || 0}
              icon={<Package className="h-5 w-5 text-red-400" />}
              description="Zero remaining inventory"
            />
          </>
        )}
      </div>

      {/* 2. Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4 backdrop-blur-md">
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Search Box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-500" />
            <input
              type="text"
              placeholder="Search by SKU, Product Name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-slate-800 bg-slate-950/70 py-1.5 pl-9 pr-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-indigo-500"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Low Stock Toggle */}
          <button
            onClick={() => setLowStockFilter(!lowStockFilter)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-semibold transition cursor-pointer ${
              lowStockFilter
                ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                : 'border-slate-800 bg-slate-950/50 text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>Low Stock Only</span>
          </button>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="font-bold text-white">{products.length}</span> catalog items
        </div>
      </div>

      {/* 3. Product Table */}
      {isListLoading ? (
        <LoadingSkeleton variant="table-row" count={5} />
      ) : products.length === 0 ? (
        <EmptyState
          icon={<Package className="h-10 w-10 text-slate-500" />}
          title="No Products Found"
          description="Try modifying your search keywords or create a new inventory SKU."
        />
      ) : (
        <div className="w-full overflow-x-auto rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-800 bg-slate-950/60 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <tr>
                <th className="px-6 py-4">SKU / Product</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Cost Price</th>
                <th className="px-6 py-4">Selling Price</th>
                <th className="px-6 py-4">Stock Level</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                  <td className="px-6 py-4">
                    <div>
                      <span className="font-bold text-white text-xs block">{p.name}</span>
                      <span className="text-[11px] text-indigo-400 font-mono">{p.sku}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs font-medium text-slate-300">
                      {p.category.name}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-300">{formatCurrency(p.costPrice)}</td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-white">{formatCurrency(p.price)}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-white">{p.stockQuantity}</span>
                      <span className="text-[10px] text-slate-400">/ min {p.minStockLevel}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {p.stockQuantity === 0 ? (
                      <Badge variant="danger" dot>Out of Stock</Badge>
                    ) : p.stockQuantity <= p.minStockLevel ? (
                      <Badge variant="warning" dot>Low Stock</Badge>
                    ) : (
                      <Badge variant="success" dot>In Stock</Badge>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Button
                      variant="outline"
                      size="xs"
                      leftIcon={<SlidersHorizontal className="h-3.5 w-3.5" />}
                      onClick={() => setAdjustModalProduct(p)}
                    >
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Product Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Inventory SKU"
        subtitle="Create a new stock item with pricing and warehouse thresholds"
      >
        <form onSubmit={handleAddProductSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="SKU Code"
              placeholder="e.g. SKU-SRV-99"
              value={newSku}
              onChange={(e) => setNewSku(e.target.value)}
            />
            <Select
              label="Category"
              value={newCategoryId}
              onChange={(e) => setNewCategoryId(e.target.value)}
              options={[
                { value: '', label: 'Select Category...' },
                ...categories.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          </div>

          <Input
            label="Product Name"
            placeholder="e.g. Dual-GPU Deep Learning Server"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
          />

          <Input
            label="Description"
            placeholder="Optional specifications and item details"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Unit Cost Price ($)"
              type="number"
              min="0"
              value={newCostPrice}
              onChange={(e) => setNewCostPrice(Number(e.target.value))}
            />
            <Input
              label="Selling Price ($)"
              type="number"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(Number(e.target.value))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Stock Units"
              type="number"
              min="0"
              value={newStock}
              onChange={(e) => setNewStock(Number(e.target.value))}
            />
            <Input
              label="Min Stock Threshold"
              type="number"
              min="0"
              value={newMinStock}
              onChange={(e) => setNewMinStock(Number(e.target.value))}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createProductMutation.isPending}
            >
              Create Product
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Category Modal */}
      <Modal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        title="Add Product Category"
        subtitle="Organize inventory SKUs into distinct operational categories"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!catName || !catCode) {
              toast.error('Please enter name and code');
              return;
            }
            createCategoryMutation.mutate({ name: catName, code: catCode, description: catDesc });
          }}
          className="space-y-4"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Category Name"
              placeholder="e.g. Networking Gear"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
            />
            <Input
              label="Category Code"
              placeholder="e.g. CAT-NET"
              value={catCode}
              onChange={(e) => setCatCode(e.target.value)}
            />
          </div>

          <Input
            label="Description"
            placeholder="Brief scope summary"
            value={catDesc}
            onChange={(e) => setCatDesc(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCategoryModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={createCategoryMutation.isPending}
            >
              Save Category
            </Button>
          </div>
        </form>
      </Modal>

      {/* Adjust Stock Modal */}
      <Modal
        isOpen={Boolean(adjustModalProduct)}
        onClose={() => setAdjustModalProduct(null)}
        title={`Adjust Stock: ${adjustModalProduct?.name}`}
        subtitle={`Current Level: ${adjustModalProduct?.stockQuantity} Units (SKU: ${adjustModalProduct?.sku})`}
      >
        <form onSubmit={handleAdjustSubmit} className="space-y-4">
          <Select
            label="Adjustment Operation"
            value={adjustType}
            onChange={(e) => setAdjustType(e.target.value as any)}
            options={[
              { value: 'IN', label: 'Restock / Increase Stock (+)' },
              { value: 'OUT', label: 'Deduct / Write-off (-)' },
              { value: 'ADJUSTMENT', label: 'Set Exact Total Quantity (=)' },
            ]}
          />

          <Input
            label={adjustType === 'ADJUSTMENT' ? 'New Total Quantity' : 'Units Count'}
            type="number"
            min="1"
            value={adjustQty}
            onChange={(e) => setAdjustQty(Number(e.target.value))}
          />

          <Input
            label="Audit Justification / Reason"
            placeholder="e.g. Physical inventory count correction, damaged freight"
            value={adjustReason}
            onChange={(e) => setAdjustReason(e.target.value)}
          />

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <Button variant="ghost" size="sm" type="button" onClick={() => setAdjustModalProduct(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              isLoading={adjustStockMutation.isPending}
            >
              Confirm Adjustment
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Button,
  Input,
  Select,
  Badge,
  Modal,
  Drawer,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Pagination,
  useToast,
  Dropdown,
  DatePicker,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
  ConfirmationDialog,
  StatCard,
} from '../../components/ui';
import {
  Sparkles,
  Users,
  DollarSign,
  TrendingUp,
  Mail,
  Lock,
  Plus,
  Trash2,
  Settings,
  MoreVertical,
  Inbox,
} from 'lucide-react';

export const DesignSystemPage: React.FC = () => {
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="space-y-12 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-400">
          <Sparkles className="h-3.5 w-3.5" />
          Enterprise UI Kit & Design System
        </div>
        <h1 className="mt-3 text-3xl font-bold text-white tracking-tight">
          Reusable Component Architecture
        </h1>
        <p className="mt-1.5 text-sm text-slate-400">
          Live interactive showcase of all 17 enterprise-grade SaaS primitives.
        </p>
      </div>

      {/* 1. Stat Cards */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
          1. Stat Cards (KPIs)
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Revenue"
            value="$248,500"
            icon={<DollarSign className="h-5 w-5" />}
            trend={{ value: '+14.2%', direction: 'up', label: 'vs last month' }}
          />
          <StatCard
            title="Active Employees"
            value="142"
            icon={<Users className="h-5 w-5" />}
            trend={{ value: '+3 new', direction: 'up', label: 'this quarter' }}
          />
          <StatCard
            title="Pending Orders"
            value="18"
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: '-2.1%', direction: 'down', label: 'vs last week' }}
          />
          <StatCard
            title="Inventory Value"
            value="$1,204,900"
            icon={<Sparkles className="h-5 w-5" />}
            trend={{ value: 'Stable', direction: 'neutral' }}
          />
        </div>
      </section>

      {/* 2. Buttons */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
          2. Buttons (Variants & Sizes)
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
            Primary Action
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger" leftIcon={<Trash2 className="h-4 w-4" />}>
            Destructive
          </Button>
          <Button variant="success">Success</Button>
          <Button variant="primary" isLoading>
            Loading State
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button size="xs">Extra Small</Button>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
        </div>
      </section>

      {/* 3. Form Inputs & DatePicker */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
          3. Form Controls & DatePicker
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Input
            label="Email Address"
            placeholder="user@enterprise.com"
            leftIcon={<Mail className="h-4 w-4" />}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          <Input
            label="Password"
            type="password"
            placeholder="••••••••••••"
            leftIcon={<Lock className="h-4 w-4" />}
            error={inputValue.length > 0 && inputValue.length < 8 ? 'Minimum 8 characters' : undefined}
          />
          <Select label="Role Selection">
            <option>Select Role...</option>
            <option>SUPER_ADMIN</option>
            <option>HR_MANAGER</option>
            <option>INVENTORY_MANAGER</option>
          </Select>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 pt-2">
          <DatePicker label="Joining Date" />
        </div>
      </section>

      {/* 4. Badges */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
          4. Badges (Pills)
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="success" dot>
            Active / Operational
          </Badge>
          <Badge variant="warning" dot>
            Pending Review
          </Badge>
          <Badge variant="danger" dot>
            Terminated / Void
          </Badge>
          <Badge variant="indigo">SUPER_ADMIN</Badge>
          <Badge variant="purple">Design Lead</Badge>
          <Badge variant="info">Information</Badge>
          <Badge variant="neutral">Draft</Badge>
        </div>
      </section>

      {/* 5. Toasts & Feedback */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
          5. Toast Notification Triggers
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="success"
            size="sm"
            onClick={() =>
              toast.success('Record saved successfully.', 'Success')
            }
          >
            Trigger Success Toast
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={() =>
              toast.error('Failed to communicate with API.', 'Server Error')
            }
          >
            Trigger Error Toast
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              toast.info('System background job completed.', 'Info Notice')
            }
          >
            Trigger Info Toast
          </Button>
        </div>
      </section>

      {/* 6. Modals, Drawers & Confirmation Dialogs */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
          6. Overlays (Modal, Drawer, Confirmation)
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            Open Demo Modal
          </Button>
          <Button variant="secondary" onClick={() => setIsDrawerOpen(true)}>
            Open Slide-over Drawer
          </Button>
          <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
            Open Confirmation Dialog
          </Button>
        </div>

        {/* Modal Instance */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Enterprise Modal Dialog"
          subtitle="Keyboard accessible (ESC to close, backdrop dismiss)"
          footer={
            <>
              <Button variant="ghost" size="sm" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setIsModalOpen(false)}>
                Confirm Action
              </Button>
            </>
          }
        >
          <p className="text-xs text-slate-300 leading-relaxed">
            This modal component handles auto-focus, accessible ARIA attributes, backdrop blur,
            and responsive sizing.
          </p>
        </Modal>

        {/* Drawer Instance */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Side Filter Drawer"
          subtitle="Slide-over contextual configuration panel"
        >
          <div className="space-y-4 text-xs text-slate-300">
            <p>Slide-over drawer component with customizable size and transition effects.</p>
            <Input label="Filter By Key" placeholder="Search keywords..." />
            <Select label="Filter Module">
              <option>All Modules</option>
              <option>Sales</option>
              <option>Inventory</option>
            </Select>
          </div>
        </Drawer>

        {/* Confirmation Dialog Instance */}
        <ConfirmationDialog
          isOpen={isConfirmOpen}
          onClose={() => setIsConfirmOpen(false)}
          onConfirm={() => {
            setIsConfirmOpen(false);
            toast.success('Resource deleted.', 'Confirmed');
          }}
          title="Delete Department Record?"
          message="Are you sure you want to delete this department? This action cannot be undone."
          confirmText="Delete Record"
        />
      </section>

      {/* 7. Tables & Pagination */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
          7. Data Table & Pagination
        </h2>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Component Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="font-semibold text-white">Modal & Drawer</TableCell>
              <TableCell>Overlay Primitive</TableCell>
              <TableCell>
                <Badge variant="success">Accessible</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Dropdown
                  trigger={<MoreVertical className="h-4 w-4 text-slate-400 ml-auto" />}
                  items={[
                    { label: 'Edit', icon: <Settings className="h-3.5 w-3.5" /> },
                    { label: 'Delete', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true },
                  ]}
                />
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell className="font-semibold text-white">Toast System</TableCell>
              <TableCell>Context Provider</TableCell>
              <TableCell>
                <Badge variant="indigo">Global</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Dropdown
                  trigger={<MoreVertical className="h-4 w-4 text-slate-400 ml-auto" />}
                  items={[
                    { label: 'Edit', icon: <Settings className="h-3.5 w-3.5" /> },
                    { label: 'Delete', icon: <Trash2 className="h-3.5 w-3.5" />, danger: true },
                  ]}
                />
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
        <Pagination
          currentPage={currentPage}
          totalPages={5}
          totalItems={48}
          onPageChange={(p) => setCurrentPage(p)}
        />
      </section>

      {/* 8. Skeletons, Empty & Error States */}
      <section className="space-y-4">
        <h2 className="text-lg font-bold text-white border-b border-slate-800 pb-2">
          8. States & Feedback (Loading Skeleton, Empty, Error)
        </h2>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Skeleton */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Loading Skeletons</h4>
            <LoadingSkeleton variant="card" count={1} />
            <LoadingSkeleton variant="text" count={3} />
          </div>

          {/* Empty State */}
          <EmptyState
            icon={<Inbox className="h-6 w-6" />}
            title="No Items Found"
            description="There are currently no items available in this category."
            action={<Button size="xs">Create Item</Button>}
          />

          {/* Error State */}
          <ErrorState
            title="Connection Timeout"
            message="The request took too long to complete."
            onRetry={() => toast.info('Retrying connection...')}
          />
        </div>
      </section>
    </div>
  );
};

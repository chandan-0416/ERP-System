import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { AlertCircle, AlertTriangle, HelpCircle } from 'lucide-react';

export interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertCircle className="h-6 w-6 text-red-400" />;
      case 'warning':
        return <AlertTriangle className="h-6 w-6 text-amber-400" />;
      default:
        return <HelpCircle className="h-6 w-6 text-indigo-400" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === 'danger' ? 'danger' : variant === 'warning' ? 'secondary' : 'primary'}
            size="sm"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl p-2 ${
            variant === 'danger'
              ? 'bg-red-500/10 border border-red-500/20'
              : variant === 'warning'
              ? 'bg-amber-500/10 border border-amber-500/20'
              : 'bg-indigo-500/10 border border-indigo-500/20'
          }`}
        >
          {getIcon()}
        </div>
        <div>
          <h4 className="text-base font-bold text-white tracking-tight">{title}</h4>
          <p className="mt-1 text-xs text-slate-400 leading-relaxed">{message}</p>
        </div>
      </div>
    </Modal>
  );
};

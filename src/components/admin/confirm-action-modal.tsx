'use client';

import * as React from 'react';
import { AlertTriangle, Info, ShieldAlert, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export interface ConfirmActionModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  showReasonField?: boolean;
  reasonRequired?: boolean;
  isLoading?: boolean;
}

const variantConfig = {
  danger: {
    icon: ShieldAlert,
    iconBg: 'bg-red-100',
    iconColor: 'text-red-600',
    confirmBtn: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  },
  warning: {
    icon: AlertTriangle,
    iconBg: 'bg-amber-100',
    iconColor: 'text-amber-600',
    confirmBtn:
      'bg-amber-600 text-white hover:bg-amber-700 focus:ring-amber-500',
  },
  info: {
    icon: Info,
    iconBg: 'bg-blue-100',
    iconColor: 'text-blue-600',
    confirmBtn:
      'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  },
};

export function ConfirmActionModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Onayla',
  variant = 'danger',
  showReasonField = false,
  reasonRequired = false,
  isLoading = false,
}: ConfirmActionModalProps) {
  const [reason, setReason] = React.useState('');
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  // Close on ESC key
  React.useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose, isLoading]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  // Reset reason when modal closes
  React.useEffect(() => {
    if (!open) {
      setReason('');
    }
  }, [open]);

  const handleConfirm = () => {
    if (showReasonField && reasonRequired && !reason.trim()) return;
    onConfirm(showReasonField ? reason.trim() || undefined : undefined);
  };

  const isConfirmDisabled =
    isLoading || (showReasonField && reasonRequired && !reason.trim());

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 animate-in fade-in duration-200"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 w-full max-w-md mx-4 bg-white rounded-xl shadow-xl animate-in zoom-in-95 fade-in duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors disabled:opacity-50"
          aria-label="Kapat"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-6">
          {/* Icon + Title */}
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'flex-shrink-0 rounded-full p-3',
                config.iconBg
              )}
            >
              <IconComponent className={cn('h-6 w-6', config.iconColor)} />
            </div>
            <div className="flex-1 min-w-0 pt-1">
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {description}
              </p>
            </div>
          </div>

          {/* Reason field */}
          {showReasonField && (
            <div className="mt-4">
              <label
                htmlFor="confirm-reason"
                className="block text-sm font-medium text-gray-700 mb-1.5"
              >
                Neden{reasonRequired && <span className="text-red-500 ml-0.5">*</span>}
              </label>
              <textarea
                id="confirm-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Islem nedenini yaziniz..."
                rows={3}
                disabled={isLoading}
                className={cn(
                  'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700',
                  'placeholder:text-gray-400 resize-none',
                  'focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500',
                  'disabled:opacity-50 disabled:bg-gray-50'
                )}
              />
            </div>
          )}

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              disabled={isLoading}
            >
              Iptal
            </Button>
            <button
              onClick={handleConfirm}
              disabled={isConfirmDisabled}
              className={cn(
                'inline-flex items-center justify-center rounded-lg px-4 h-9 text-sm font-semibold',
                'transition-all duration-200',
                'focus:outline-none focus:ring-2 focus:ring-offset-2',
                'disabled:pointer-events-none disabled:opacity-50',
                config.confirmBtn
              )}
            >
              {isLoading && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

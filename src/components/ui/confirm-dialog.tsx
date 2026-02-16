'use client';

import { Modal } from './modal';
import { Button } from './button';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';

type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success';

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  isLoading?: boolean;
};

const variantConfig = {
  danger: {
    icon: XCircle,
    iconColor: 'text-red-500',
    buttonColor: 'bg-red-600 hover:bg-red-700 text-white',
  },
  warning: {
    icon: AlertTriangle,
    iconColor: 'text-yellow-500',
    buttonColor: 'bg-yellow-600 hover:bg-yellow-700 text-white',
  },
  info: {
    icon: Info,
    iconColor: 'text-blue-500',
    buttonColor: 'bg-blue-600 hover:bg-blue-700 text-white',
  },
  success: {
    icon: CheckCircle,
    iconColor: 'text-green-500',
    buttonColor: 'bg-green-600 hover:bg-green-700 text-white',
  },
};

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Onayla',
  cancelText = 'İptal',
  variant = 'danger',
  isLoading = false,
}: ConfirmDialogProps) {
  const config = variantConfig[variant];
  const Icon = config.icon;

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div className="flex flex-col items-center text-center">
        {/* Icon */}
        <div className={`w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4`}>
          <Icon className={`w-8 h-8 ${config.iconColor}`} />
        </div>

        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {title}
        </h3>

        {/* Description */}
        {description && (
          <p className="text-sm text-gray-600 mb-6">
            {description}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isLoading}
            className="flex-1"
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className={`flex-1 ${config.buttonColor}`}
          >
            {isLoading ? 'İşleniyor...' : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
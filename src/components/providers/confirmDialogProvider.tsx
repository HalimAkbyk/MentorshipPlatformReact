'use client';

import { ConfirmDialog } from '../ui/confirm-dialog';
import { useConfirmStore } from '@/lib/hooks/useConfirm';

export function ConfirmDialogProvider() {
  const { 
    open, 
    title, 
    description, 
    confirmText, 
    cancelText, 
    variant, 
    onConfirm, 
    isLoading,
    closeConfirm,
    setLoading,
  } = useConfirmStore();

  const handleConfirm = async () => {
    if (!onConfirm) return;
    
    try {
      setLoading(true);
      await onConfirm();
      closeConfirm();
    } catch (error) {
      // Error handling yapılabilir ama genelde onConfirm içinde halledilir
      console.error('Confirm action failed:', error);
      setLoading(false);
    }
  };

  return (
    <ConfirmDialog
      open={open}
      onClose={closeConfirm}
      onConfirm={handleConfirm}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      variant={variant}
      isLoading={isLoading}
    />
  );
}
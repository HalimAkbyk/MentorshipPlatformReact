'use client';

import { create } from 'zustand';

type ConfirmDialogVariant = 'danger' | 'warning' | 'info' | 'success';

type ConfirmDialogState = {
  open: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmDialogVariant;
  onConfirm: (() => void | Promise<void>) | null;
  isLoading: boolean;
};

type ConfirmDialogStore = ConfirmDialogState & {
  showConfirm: (config: {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmDialogVariant;
    onConfirm: () => void | Promise<void>;
  }) => void;
  closeConfirm: () => void;
  setLoading: (loading: boolean) => void;
};

export const useConfirmStore = create<ConfirmDialogStore>((set) => ({
  open: false,
  title: '',
  description: undefined,
  confirmText: 'Onayla',
  cancelText: 'İptal',
  variant: 'danger',
  onConfirm: null,
  isLoading: false,
  
  showConfirm: (config) => set({
    open: true,
    title: config.title,
    description: config.description,
    confirmText: config.confirmText || 'Onayla',
    cancelText: config.cancelText || 'İptal',
    variant: config.variant || 'danger',
    onConfirm: config.onConfirm,
    isLoading: false,
  }),
  
  closeConfirm: () => set({
    open: false,
    title: '',
    description: undefined,
    onConfirm: null,
    isLoading: false,
  }),
  
  setLoading: (loading) => set({ isLoading: loading }),
}));

/**
 * Global confirmation dialog hook
 * 
 * @example
 * const confirm = useConfirm();
 * 
 * await confirm({
 *   title: 'Delete Item?',
 *   description: 'This action cannot be undone.',
 *   variant: 'danger',
 *   onConfirm: async () => {
 *     await deleteItem(id);
 *   }
 * });
 */
export const useConfirm = () => {
  const { showConfirm } = useConfirmStore();
  
  return (config: {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: ConfirmDialogVariant;
    onConfirm: () => void | Promise<void>;
  }) => {
    showConfirm(config);
  };
};
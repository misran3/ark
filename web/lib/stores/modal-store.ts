import { create } from 'zustand';

export interface Transaction {
  id: string;
  merchant: string;
  category: string;
  amount: number;
  date: string;
  icon: string;
  bucket?: 'needs' | 'wants' | 'savings' | 'income';
  cardUsed?: string;
  cardLastFour?: string;
  location?: string;
  isRecurring?: boolean;
  linkedThreatId?: string;
}

interface ModalState {
  isTransactionModalOpen: boolean;
  selectedTransaction: Transaction | null;
  openTransactionModal: (transaction: Transaction) => void;
  closeTransactionModal: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  isTransactionModalOpen: false,
  selectedTransaction: null,
  openTransactionModal: (transaction: Transaction) =>
    set({
      isTransactionModalOpen: true,
      selectedTransaction: transaction,
    }),
  closeTransactionModal: () =>
    set({
      isTransactionModalOpen: false,
      selectedTransaction: null,
    }),
}));

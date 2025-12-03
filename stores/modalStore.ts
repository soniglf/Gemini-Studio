
import { create } from 'zustand';

export type ModalType = 'PROJECT_SETTINGS' | 'PROMPT_REVIEW' | 'COMMAND_PALETTE';

interface ModalState {
    activeModal: ModalType | null;
    openModal: (modal: ModalType) => void;
    closeModal: () => void;
    toggleModal: (modal: ModalType) => void;
}

export const useModalStore = create<ModalState>((set, get) => ({
    activeModal: null,
    
    openModal: (modal) => set({ activeModal: modal }),
    
    closeModal: () => set({ activeModal: null }),
    
    toggleModal: (modal) => set((state) => ({ 
        activeModal: state.activeModal === modal ? null : modal 
    })),
}));

import { X } from 'lucide-react';
import { useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export default function Modal({ isOpen, onClose, title, children }: ModalProps) {
    useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-[#414042]/80 backdrop-blur-sm animate-in fade-in duration-300"
                onClick={onClose}
            />

            {/* Modal Content */}
            <div className="relative bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 fade-in duration-300 border border-[#d9d9d9]">
                {/* Header */}
                <div className="px-8 py-6 border-b border-[#d9d9d9] flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-sm font-black text-[#414042] uppercase tracking-[0.2em]">
                        {title}
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-white rounded-xl transition-all border border-transparent hover:border-[#d9d9d9] group"
                    >
                        <X className="w-5 h-5 text-[#414042]/40 group-hover:text-[#414042]" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </div>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-[#d9d9d9] flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-[#414042] text-white text-sm font-bold rounded-xl hover:bg-black transition-all shadow-lg active:scale-95"
                    >
                        Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

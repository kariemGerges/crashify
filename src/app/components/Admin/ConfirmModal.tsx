import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    variant?: 'danger' | 'warning' | 'info';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
    isOpen,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    variant = 'danger',
}) => {
    if (!isOpen) return null;

    const variantStyles = {
        danger: 'bg-red-500/20 text-red-400 border-red-500/50',
        warning: 'bg-amber-500/20 text-amber-400 border-amber-500/50',
        info: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
    };

    const buttonStyles = {
        danger: 'bg-red-500/20 text-red-400 border-red-500/50 hover:bg-red-500/30',
        warning: 'bg-amber-500/20 text-amber-400 border-amber-500/50 hover:bg-amber-500/30',
        info: 'bg-blue-500/20 text-blue-400 border-blue-500/50 hover:bg-blue-500/30',
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-gray-900 border border-amber-500/20 rounded-xl p-6 max-w-md w-full shadow-2xl">
                <div className="flex items-start gap-4 mb-4">
                    <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center border ${variantStyles[variant]}`}
                    >
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
                        <p className="text-gray-400">{message}</p>
                    </div>
                    <button
                        onClick={onCancel}
                        className="text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center gap-3 justify-end mt-6">
                    <button
                        onClick={onCancel}
                        className="px-4 py-2 bg-gray-800 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        onClick={onConfirm}
                        className={`px-4 py-2 rounded-lg transition-colors border ${buttonStyles[variant]}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};


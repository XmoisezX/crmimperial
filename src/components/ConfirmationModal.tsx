import React from 'react';
import { X, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    isConfirming?: boolean;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar Exclusão',
    isConfirming = false,
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-md">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark-text flex items-center">
                        <AlertTriangle className="w-6 h-6 mr-2 text-red-500" /> {title}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    <p className="text-light-text">{message}</p>
                    <p className="text-sm font-semibold text-red-600">Esta ação é irreversível.</p>
                </div>

                {/* Footer de Ações */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <Button variant="outline" onClick={onClose} disabled={isConfirming}>
                        Cancelar
                    </Button>
                    <Button 
                        onClick={onConfirm} 
                        disabled={isConfirming}
                        className="bg-red-600 hover:bg-red-700 text-white"
                    >
                        {isConfirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        {confirmText}
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
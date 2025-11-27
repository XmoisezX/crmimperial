import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, ChevronUp, Edit, Send, Printer, Key, Download, Trash2 } from 'lucide-react';

interface ActionsDropdownProps {
    onAction: (action: string) => void;
    disabled: boolean;
    selectedCount: number;
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({ onAction, disabled, selectedCount }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const actions = [
        { label: 'Editar', value: 'edit', icon: <Edit className="w-4 h-4 mr-2" />, className: 'bg-blue-600 text-white hover:bg-blue-700' },
        { label: 'Enviar para portais', value: 'send_portals', icon: <Send className="w-4 h-4 mr-2" /> },
        { label: 'Imprimir', value: 'print', icon: <Printer className="w-4 h-4 mr-2" /> },
        { label: 'Retirar chaves', value: 'withdraw_keys', icon: <Key className="w-4 h-4 mr-2" /> },
        { label: 'Exportar', value: 'export', icon: <Download className="w-4 h-4 mr-2" /> },
        { label: 'Excluir', value: 'delete', icon: <Trash2 className="w-4 h-4 mr-2" />, className: 'text-red-600 hover:bg-red-50' },
    ];

    const handleActionClick = (value: string) => {
        if (!disabled) {
            onAction(value);
            setIsOpen(false);
        }
    };
    
    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);


    return (
        <div className="relative inline-block text-left" ref={dropdownRef}>
            <button
                type="button"
                disabled={disabled}
                onClick={() => setIsOpen(!isOpen)}
                className={`inline-flex justify-center items-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 transition-colors focus:outline-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-50'}`}
            >
                Ações
                {isOpen ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </button>

            {isOpen && (
                <div className="origin-top-left absolute left-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20 animate-fade-in">
                    <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                        {actions.map(action => (
                            <button
                                key={action.value}
                                onClick={() => handleActionClick(action.value)}
                                className={`flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors ${action.className || ''}`}
                                role="menuitem"
                            >
                                {action.icon}
                                {action.label} {action.value === 'edit' && selectedCount > 1 && '(Múltiplo)'}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ActionsDropdown;
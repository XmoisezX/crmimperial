import React from 'react';
import { Check, Minus } from 'lucide-react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
    id: string;
    checked?: boolean;
    onCheckedChange?: (checked: boolean | 'indeterminate') => void;
    className?: string;
    indeterminate?: boolean; // Nova prop para estado híbrido
}

const Checkbox: React.FC<CheckboxProps> = ({ id, checked, onCheckedChange, className = '', indeterminate = false, ...props }) => {
    
    const baseClasses = "h-4 w-4 rounded border border-gray-300 text-blue-600 focus:ring-blue-500 transition-colors duration-150";
    
    const handleClick = () => {
        if (onCheckedChange) {
            if (indeterminate) {
                // Se estiver indeterminado, o próximo estado é 'checked' (true)
                onCheckedChange(true);
            } else {
                // Se estiver checked ou unchecked, inverte
                onCheckedChange(!checked);
            }
        }
    };

    return (
        <div className={`relative inline-flex items-center justify-center ${className}`}>
            <input
                type="checkbox"
                id={id}
                checked={checked && !indeterminate} // Só é 'checked' se for true E não for indeterminado
                onChange={() => { /* handled by onClick */ }}
                onClick={handleClick}
                className={`opacity-0 absolute cursor-pointer h-full w-full`}
                {...props}
            />
            <div className={`flex items-center justify-center ${baseClasses} ${checked || indeterminate ? 'bg-blue-600 border-blue-600' : 'bg-white'}`}>
                {indeterminate ? (
                    <Minus className="h-3 w-3 text-white" />
                ) : checked ? (
                    <Check className="h-3 w-3 text-white" />
                ) : null}
            </div>
        </div>
    );
};

export { Checkbox };
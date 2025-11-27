import React from 'react';

interface NumberInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    id: string;
    isCurrency?: boolean;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, id, isCurrency = false, value, onChange, ...props }) => {
    
    const handleCurrencyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!onChange) return;

        // Get current input value and remove all non-digit characters
        const numericString = e.target.value.replace(/[^\d]/g, '');

        // Create a synthetic event to pass to the parent's onChange handler
        // The parent expects a value that can be parsed into a number.
        // An empty string will be handled as 0 by the parent.
        const syntheticEvent = {
            ...e,
            target: {
                ...e.target,
                id: id,
                value: numericString, // Pass the clean numeric string
            },
        };
        onChange(syntheticEvent as any);
    };

    // Format the value for display if it's a currency field
    const displayValue = isCurrency
        ? (value || value === 0 ? new Intl.NumberFormat('pt-BR').format(Number(value)) : '')
        : value;

    return (
        <div>
            <label htmlFor={id} className="block text-sm font-medium text-light-text mb-1">
                {label}
            </label>
            <div className="relative mt-1">
                {isCurrency && (
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">R$</span>
                    </div>
                )}
                <input
                    type={isCurrency ? "text" : "number"}
                    id={id}
                    value={displayValue as string}
                    onChange={isCurrency ? handleCurrencyChange : onChange}
                    {...props}
                    className={`block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary-orange focus:border-primary-orange sm:text-sm transition duration-150 ease-in-out placeholder:text-gray-400 ${isCurrency ? 'pl-10' : ''}`}
                />
            </div>
        </div>
    );
};

export default NumberInput;
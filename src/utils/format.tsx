import React from 'react';

export const formatCurrency = (value: number | string | null | undefined, prefix: string = 'R$'): string => {
    if (value === null || value === undefined || value === '') return 'N/A';
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) : Number(value);
    if (isNaN(num) || !isFinite(num)) return 'N/A';
    
    const formatted = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${prefix} ${formatted}`;
};

export const formatCurrencyHalfTone = (value: number | string | null | undefined): React.ReactNode => {
    const num = typeof value === 'string' ? parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.')) : Number(value);
    if (isNaN(num) || !isFinite(num)) return <span className="text-gray-400">N/A</span>;
    
    const formatted = num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    // Retorna a formatação padrão sem meio tom
    return (
        <span className="font-medium text-dark-text whitespace-nowrap">
            {formatted}
        </span>
    );
};

export const parseCurrencyToNumber = (value: string | null): number | null => {
    if (!value) return null;
    const cleanValue = value.replace(/[^\d,]/g, '').replace(',', '.');
    const num = parseFloat(cleanValue);
    return isNaN(num) ? null : num;
};
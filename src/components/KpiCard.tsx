import React from 'react';

interface KpiCardProps {
    title: string;
    value: string;
    status?: 'positive' | 'negative' | 'neutral';
}

const KpiCard: React.FC<KpiCardProps> = ({ title, value, status = 'neutral' }) => {
    const statusClasses = {
        positive: 'text-green-600',
        negative: 'text-red-600',
        neutral: 'text-kpi-value-color',
    };

    return (
        <div className="bg-white p-5 rounded-lg shadow-md border-l-4 border-primary-orange">
            <h3 className="text-sm font-semibold text-light-text uppercase tracking-wider">{title}</h3>
            <p className={`text-2xl lg:text-3xl font-bold mt-2 ${statusClasses[status]}`}>{value}</p>
        </div>
    );
};

export default KpiCard;

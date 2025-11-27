import React from 'react';
import { Users, TrendingUp, FileText, DollarSign, Percent } from 'lucide-react';

interface BrokerPerformance {
    broker_id: string;
    broker_name: string;
    leads_attended: number;
    proposals_sent: number;
    sales_closed: number;
    individual_conversion_rate: number;
    revenue_generated: number;
}

interface BrokerPerformanceTableProps {
    data: BrokerPerformance[];
}

const BrokerPerformanceTable: React.FC<BrokerPerformanceTableProps> = ({ data }) => {
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Corretor</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Leads Atendidos</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Propostas Enviadas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendas Fechadas</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Taxa Conversão</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Receita Gerada</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {data.length === 0 ? (
                        <tr>
                            <td colSpan={6} className="text-center py-4 text-gray-500">Nenhum corretor encontrado.</td>
                        </tr>
                    ) : (
                        data.map((broker, index) => (
                            <tr key={broker.broker_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text flex items-center">
                                    <Users className="w-4 h-4 mr-2 text-gray-400" /> {broker.broker_name}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{broker.leads_attended}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{broker.proposals_sent}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{broker.sales_closed}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{formatPercent(broker.individual_conversion_rate)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-orange">{formatCurrency(broker.revenue_generated)}</td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default BrokerPerformanceTable;
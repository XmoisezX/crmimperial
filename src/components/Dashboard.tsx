import React from 'react';
import { SimulationInput, SimulationResult, MonthlyResult } from '../types';
import KpiCard from './KpiCard';
import CashFlowChart from './CashFlowChart';
import RevenueChart from './RevenueChart';
import ResultsTable from './ResultsTable';
import CollapsibleCard from './CollapsibleCard';
import ExportButtons from './ExportButtons';

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface DashboardProps {
    results: SimulationResult; 
    inputs: SimulationInput; 
    onExtend: () => void;
    onGoBack: () => void;
    duration: number;
    onActualDataChange: (month: number, field: keyof MonthlyResult, value: number | null) => void;
    actualData: Record<number, Partial<MonthlyResult>>;
}

const Dashboard: React.FC<DashboardProps> = ({ results, inputs, onExtend, onGoBack, duration, onActualDataChange, actualData }) => {
    const { summary, monthlyData, totals } = results;
    
    const totalNetRevenue = totals.netRevenueForFixedCosts - totals.totalFixedCosts;

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header com botões de exportação */}
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-dark-text">Dashboard de Resultados</h2>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={onGoBack}
                        disabled={duration <= 12}
                        className="px-4 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-md hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Voltar 12 Meses
                    </button>
                    <button
                        onClick={onExtend}
                        className="px-4 py-2 text-sm font-medium text-primary-orange border border-primary-orange rounded-md hover:bg-orange-50 transition-colors"
                    >
                        Estender +12 Meses
                    </button>
                    <ExportButtons monthlyData={monthlyData} totals={totals} />
                </div>
            </div>

            {/* KPI Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <KpiCard title="Caixa Final Acumulado" value={formatCurrency(summary.finalCash)} status={summary.isViable ? 'positive' : 'negative'} />
                <KpiCard title="Receita Bruta Total" value={formatCurrency(totals.grossRevenueTotal)} />
                <KpiCard title="Resultado Líquido Total" value={formatCurrency(totalNetRevenue)} status={totalNetRevenue >= 0 ? 'positive' : 'negative'} />
                <KpiCard title="Cenário Viável?" value={summary.isViable ? 'Sim ✅' : 'Não ❌'} status={summary.isViable ? 'positive' : 'negative'} />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-dark-text mb-4">Fluxo de Caixa Mensal e Acumulado</h3>
                    <CashFlowChart data={monthlyData} />
                </div>
                <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-lg font-semibold text-dark-text mb-4">Composição da Receita Bruta</h3>
                    <RevenueChart data={monthlyData} />
                </div>
            </div>

            {/* Detailed Table Section */}
            <CollapsibleCard title="Visão Detalhada Mês a Mês">
                 <ResultsTable 
                    monthlyData={monthlyData} 
                    totals={totals} 
                    taxRate={inputs.taxRate} 
                    startDate={inputs.startDate}
                    onActualDataChange={onActualDataChange}
                    actualData={actualData}
                 />
            </CollapsibleCard>
        </div>
    );
};

export default Dashboard;
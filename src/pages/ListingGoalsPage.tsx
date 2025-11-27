import React, { useState } from 'react';
import KpiCard from '../components/KpiCard';
import NumberInput from '../components/NumberInput';

const ListingGoalsPage: React.FC = () => {
    // Mock data based on user input
    const currentInventory = {
        sales: 79,
        rentals: 6,
    };

    const leadDatabase = {
        sales: 3000,
        rentals: 200,
    };

    // State for setting goals (using a default based on existing inputs)
    const [brokersCount, setBrokersCount] = useState(4); 
    const [salesListingGoalPerBroker, setSalesListingGoalPerBroker] = useState(5);
    const [rentalListingGoalPerBroker, setRentalListingGoalPerBroker] = useState(2);

    const totalMonthlySalesGoal = brokersCount * salesListingGoalPerBroker;
    const totalMonthlyRentalGoal = brokersCount * rentalListingGoalPerBroker;
    
    const totalSalesListingsNeeded = 12 * totalMonthlySalesGoal; // 12 months projection
    const totalRentalListingsNeeded = 12 * totalMonthlyRentalGoal; // 12 months projection

    const handleBrokerCountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        setBrokersCount(value);
    };

    const handleSalesGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        setSalesListingGoalPerBroker(value);
    };

    const handleRentalGoalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 0;
        setRentalListingGoalPerBroker(value);
    };

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in space-y-8">
            <h1 className="text-3xl font-bold text-dark-text">Gestão de Agenciamentos e Metas</h1>
            <p className="text-lg text-light-text max-w-4xl">
                O agenciamento é o motor do nosso negócio. Utilize esta ferramenta para visualizar o estoque atual, o potencial da nossa base de leads e definir metas claras de captação para a equipe de corretores.
            </p>

            {/* Inventory and Lead KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <KpiCard title="Imóveis Venda (Estoque Atual)" value={currentInventory.sales.toString()} status="neutral" />
                <KpiCard title="Imóveis Aluguel (Estoque Atual)" value={currentInventory.rentals.toString()} status="neutral" />
                <KpiCard title="Leads Proprietários (Venda)" value={leadDatabase.sales.toLocaleString('pt-BR')} status="neutral" />
                <KpiCard title="Leads Proprietários (Aluguel)" value={leadDatabase.rentals.toLocaleString('pt-BR')} status="neutral" />
            </div>

            {/* Goal Setting Section */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-6">
                <h2 className="text-2xl font-semibold text-primary-orange border-b border-orange-200 pb-3">Definição de Metas de Captação (Agenciamento)</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <NumberInput 
                        label="Nº de Corretores Ativos" 
                        id="brokersCount" 
                        value={brokersCount} 
                        onChange={handleBrokerCountChange} 
                        min={1}
                        step={1}
                        title="Número de corretores que participarão da meta de agenciamento."
                    />
                    <NumberInput 
                        label="Meta Venda / Corretor (Mês)" 
                        id="salesListingGoalPerBroker" 
                        value={salesListingGoalPerBroker} 
                        onChange={handleSalesGoalChange} 
                        min={0}
                        step={1}
                        title="Quantos novos agenciamentos de venda cada corretor deve trazer por mês."
                    />
                    <NumberInput 
                        label="Meta Aluguel / Corretor (Mês)" 
                        id="rentalListingGoalPerBroker" 
                        value={rentalListingGoalPerBroker} 
                        onChange={handleRentalGoalChange} 
                        min={0}
                        step={1}
                        title="Quantos novos agenciamentos de aluguel cada corretor deve trazer por mês."
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                    <KpiCard title="Meta Total Mensal (Venda)" value={`${totalMonthlySalesGoal} Agenciamentos`} status="neutral" />
                    <KpiCard title="Meta Total Mensal (Aluguel)" value={`${totalMonthlyRentalGoal} Agenciamentos`} status="neutral" />
                </div>
            </div>

            {/* Analysis Section */}
            <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
                <h2 className="text-2xl font-semibold text-dark-text">Análise de Sustentabilidade do Estoque</h2>
                <p className="text-light-text">
                    Para manter o estoque atual e suportar o crescimento, precisamos de um fluxo constante de novos agenciamentos.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <h3 className="text-lg font-semibold text-primary-orange mb-2">Projeção de Captação (12 Meses)</h3>
                        <p className="text-sm text-dark-text">
                            Com a meta atual, a equipe captará <strong>{totalSalesListingsNeeded}</strong> novos imóveis de venda e <strong>{totalRentalListingsNeeded}</strong> novos imóveis de aluguel no próximo ano.
                        </p>
                    </div>
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="text-lg font-semibold text-blue-800 mb-2">Estratégia de Leads</h3>
                        <p className="text-sm text-dark-text">
                            A base de <strong>{leadDatabase.sales.toLocaleString('pt-BR')}</strong> leads de venda e <strong>{leadDatabase.rentals.toLocaleString('pt-BR')}</strong> leads de aluguel é o nosso principal ativo. Cada corretor deve focar na conversão desses proprietários em agenciamentos exclusivos.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ListingGoalsPage;
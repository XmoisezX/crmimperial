import React, { useEffect, useState, useCallback } from 'react';
import { DollarSign, Loader2, RefreshCw, AlertTriangle, Users, TrendingUp, FileText, Clock, Target } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import KpiCard from '../components/KpiCard';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import LeadSourcePieChart from '../components/charts/LeadSourcePieChart';
import OpportunityStatusPieChart from '../components/charts/OpportunityStatusPieChart';
import BrokerComparisonBarChart from '../components/charts/BrokerComparisonBarChart';
import BrokerPerformanceTable from '../components/BrokerPerformanceTable';

// Interfaces para os dados que virão do Supabase RPC
interface CompanyMetrics {
    total_leads: number;
    leads_to_opportunities_conversion: number;
    leads_to_sales_conversion: number;
    lead_sources: Record<string, number>; // Ex: { "Site": 50, "Indicação": 30 }
    total_activities: number;
    on_time_activities_percent: number;
    opportunities_open: number;
    opportunities_in_progress: number;
    opportunities_closed: number;
    opportunities_total_value: number;
    opportunities_avg_value: number;
    opportunities_avg_time_in_funnel_days: number;
    proposals_issued: number;
    proposals_accepted: number;
    proposals_total_value: number;
    proposals_approval_rate: number;
    sales_total_sold_month: number;
    sales_total_sold_ytd: number;
    sales_avg_ticket: number;
    sales_total_revenue: number;
    company_monthly_growth_percent: number;
    company_overall_funnel_conversion: number;
    company_avg_closing_time_days: number;
}

interface BrokerPerformance {
    broker_id: string;
    broker_name: string;
    leads_attended: number;
    proposals_sent: number;
    sales_closed: number;
    individual_conversion_rate: number;
    revenue_generated: number;
}

const SalesDashboardPage: React.FC = () => {
    const { session } = useAuth();
    const [companyMetrics, setCompanyMetrics] = useState<CompanyMetrics | null>(null);
    const [brokerPerformance, setBrokerPerformance] = useState<BrokerPerformance[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDashboardData = useCallback(async () => {
        if (!session) {
            setError('Você precisa estar logado para ver o painel de vendas.');
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            // Definir um período de tempo para a análise (ex: últimos 12 meses)
            const endDate = new Date();
            const startDate = new Date();
            startDate.setFullYear(endDate.getFullYear() - 1); // Últimos 12 meses

            // 1. Buscar métricas da empresa
            const { data: companyData, error: companyError } = await supabase.rpc('get_company_sales_metrics', {
                p_user_id: session.user.id,
                p_start_date: startDate.toISOString().split('T')[0],
                p_end_date: endDate.toISOString().split('T')[0],
            });

            if (companyError) {
                console.error('Erro ao buscar métricas da empresa:', companyError);
                throw new Error(`Falha ao carregar métricas da empresa: ${companyError.message}`);
            }
            if (companyData && companyData.length > 0) {
                setCompanyMetrics(companyData[0] as CompanyMetrics);
            } else {
                setCompanyMetrics(null);
            }

            // 2. Buscar desempenho dos corretores
            const { data: brokerData, error: brokerError } = await supabase.rpc('get_broker_sales_performance', {
                p_user_id: session.user.id,
                p_start_date: startDate.toISOString().split('T')[0],
                p_end_date: endDate.toISOString().split('T')[0],
            });

            if (brokerError) {
                console.error('Erro ao buscar desempenho dos corretores:', brokerError);
                throw new Error(`Falha ao carregar desempenho dos corretores: ${brokerError.message}`);
            }
            setBrokerPerformance(brokerData as BrokerPerformance[]);

        } catch (e) {
            console.error('Erro geral ao buscar dados do dashboard:', e);
            setError(e instanceof Error ? e.message : 'Erro desconhecido ao carregar o painel.');
        } finally {
            setIsLoading(false);
        }
    }, [session]);

    useEffect(() => {
        fetchDashboardData();
    }, [fetchDashboardData]);

    const formatCurrency = (value: number | null) => 
        value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A';
    const formatPercent = (value: number | null) => 
        value !== null ? `${(value * 100).toFixed(2)}%` : 'N/A';

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-[500px] p-8">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                <p className="text-gray-600">Carregando painel de vendas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-8 bg-red-100 border border-red-400 text-red-700 rounded-md min-h-[500px]">
                <h2 className="text-xl font-bold flex items-center"><AlertTriangle className="w-6 h-6 mr-2" /> Erro ao Carregar Painel</h2>
                <p className="mt-2">{error}</p>
                <Button onClick={fetchDashboardData} className="mt-4 bg-red-600 hover:bg-red-700 text-white">
                    Tentar Recarregar
                </Button>
            </div>
        );
    }
    
    if (!companyMetrics && brokerPerformance.length === 0) {
        return (
            <div className="p-8 text-center text-gray-600 min-h-[500px]">
                <DollarSign className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <h2 className="text-2xl font-bold mb-2">Nenhum dado de vendas encontrado.</h2>
                <p className="text-lg">Comece registrando leads, atividades e oportunidades para ver o painel em ação!</p>
                <Button onClick={fetchDashboardData} className="mt-6 bg-blue-600 hover:bg-blue-700 text-white">
                    <RefreshCw className="w-4 h-4 mr-2" /> Recarregar Dados
                </Button>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold text-dark-text flex items-center">
                    <DollarSign className="w-6 h-6 mr-2 text-blue-600" /> Painel de Gestão de Vendas
                </h1>
                <Button 
                    variant="outline" 
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={fetchDashboardData}
                    disabled={isLoading}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
                    Atualizar Dados
                </Button>
            </div>

            {/* Seção de KPIs Gerais da Imobiliária */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-dark-text flex items-center"><TrendingUp className="w-5 h-5 mr-2 text-primary-orange" /> Indicadores Gerais da Imobiliária</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <KpiCard title="Receita Total (Últimos 12M)" value={formatCurrency(companyMetrics?.sales_total_revenue)} status={companyMetrics && companyMetrics.sales_total_revenue > 0 ? 'positive' : 'neutral'} />
                    <KpiCard title="Total de Leads Recebidos" value={companyMetrics?.total_leads?.toString() || 'N/A'} />
                    <KpiCard title="Conversão Leads > Vendas" value={formatPercent(companyMetrics?.leads_to_sales_conversion)} status={companyMetrics && companyMetrics.leads_to_sales_conversion > 0.03 ? 'positive' : 'neutral'} />
                    <KpiCard title="Tempo Médio de Fechamento" value={companyMetrics?.company_avg_closing_time_days ? `${companyMetrics.company_avg_closing_time_days.toFixed(0)} dias` : 'N/A'} />
                </div>
            </section>

            {/* Seção de Leads e Oportunidades */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-md">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-dark-text mb-4 flex items-center"><Users className="w-5 h-5 mr-2 text-blue-600" /> Origem dos Leads</h3>
                        {companyMetrics?.lead_sources && Object.keys(companyMetrics.lead_sources).length > 0 ? (
                            <div className="h-64">
                                <LeadSourcePieChart data={companyMetrics.lead_sources} />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-10">Nenhum dado de origem de leads.</p>
                        )}
                    </CardContent>
                </Card>
                <Card className="shadow-md">
                    <CardContent className="p-6">
                        <h3 className="text-xl font-semibold text-dark-text mb-4 flex items-center"><Target className="w-5 h-5 mr-2 text-green-600" /> Status das Oportunidades</h3>
                        {companyMetrics && (companyMetrics.opportunities_open > 0 || companyMetrics.opportunities_in_progress > 0 || companyMetrics.opportunities_closed > 0) ? (
                            <div className="h-64">
                                <OpportunityStatusPieChart 
                                    open={companyMetrics.opportunities_open}
                                    inProgress={companyMetrics.opportunities_in_progress}
                                    closed={companyMetrics.opportunities_closed}
                                />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-10">Nenhum dado de oportunidades.</p>
                        )}
                    </CardContent>
                </Card>
            </section>

            {/* Seção de Desempenho por Corretor */}
            <section className="space-y-6">
                <h2 className="text-2xl font-bold text-dark-text flex items-center"><Users className="w-5 h-5 mr-2 text-purple-600" /> Desempenho por Corretor</h2>
                <Card className="shadow-md">
                    <CardContent className="p-6">
                        {brokerPerformance.length > 0 ? (
                            <div className="h-80">
                                <BrokerComparisonBarChart data={brokerPerformance} />
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-10">Nenhum dado de desempenho de corretores.</p>
                        )}
                    </CardContent>
                </Card>
                <Card className="shadow-md">
                    <CardContent className="p-0">
                        {brokerPerformance.length > 0 ? (
                            <BrokerPerformanceTable data={brokerPerformance} />
                        ) : (
                            <p className="text-center text-gray-500 py-10">Nenhum dado detalhado de desempenho de corretores.</p>
                        )}
                    </CardContent>
                </Card>
            </section>
        </div>
    );
};

export default SalesDashboardPage;
import React, { useEffect, useState, useCallback } from 'react';
import { ArrowRight, Building, Key, FileText, Clock, Gift, DollarSign, TrendingUp, AlertTriangle, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Activity } from '../components/ActivityModal'; // Importa a interface de Atividade

interface WidgetCardProps {
    title: string;
    children: React.ReactNode;
    linkTo?: string;
}

const WidgetCard: React.FC<WidgetCardProps> = ({ title, children, linkTo }) => (
    <div className="bg-white p-5 rounded-lg shadow-md border border-gray-100 flex flex-col h-full">
        <div className="flex justify-between items-center border-b pb-2 mb-3">
            <h2 className="text-lg font-semibold text-dark-text flex items-center">
                {title}
            </h2>
            {linkTo && (
                <Link to={linkTo} className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    Ver todos <ArrowRight className="w-4 h-4 ml-1" />
                </Link>
            )}
        </div>
        <div className="flex-1">
            {children}
        </div>
    </div>
);

const DashboardPage: React.FC = () => {
    const { session } = useAuth();
    const [pendingActivities, setPendingActivities] = useState<Activity[]>([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(true);
    const [activitiesError, setActivitiesError] = useState<string | null>(null);

    const fetchPendingActivities = useCallback(async () => {
        if (!session) return;
        setIsLoadingActivities(true);
        setActivitiesError(null);

        const now = new Date().toISOString();

        const { data, error } = await supabase
            .from('atividades')
            .select(`
                id, tipo, descricao, data_agendamento, status,
                oportunidades:oportunidade_id(nome)
            `)
            .eq('user_id', session.user.id)
            .eq('status', 'Pendente')
            .lt('data_agendamento', now) // Atividades atrasadas ou para hoje
            .order('data_agendamento', { ascending: true });

        if (error) {
            console.error('Erro ao buscar atividades pendentes:', error);
            setActivitiesError('Não foi possível carregar as atividades.');
            setPendingActivities([]);
        } else {
            setPendingActivities(data as Activity[]);
        }
        setIsLoadingActivities(false);
    }, [session]);

    useEffect(() => {
        fetchPendingActivities();
    }, [fetchPendingActivities]);

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
            <h1 className="text-3xl font-bold text-dark-text">Início do CRM</h1>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Atividades */}
                <WidgetCard title="Atividades" linkTo="/crm/atividades">
                    {isLoadingActivities ? (
                        <div className="flex items-center justify-center py-10">
                            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                            <p className="text-gray-600">Carregando atividades...</p>
                        </div>
                    ) : activitiesError ? (
                        <div className="text-center py-10 text-red-600">
                            <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
                            <p>{activitiesError}</p>
                        </div>
                    ) : pendingActivities.length === 0 ? (
                        <div className="text-center py-10">
                            <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-light-text">Nenhuma atividade pendente ou atrasada!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {pendingActivities.slice(0, 3).map(activity => (
                                <div key={activity.id} className="flex justify-between items-center p-2 border-l-4 border-orange-500 bg-orange-50 rounded">
                                    <div>
                                        <p className="text-sm text-orange-700 font-medium">{activity.tipo} - {activity.oportunidades?.nome || 'Oportunidade'}</p>
                                        <p className="text-xs text-orange-600">{new Date(activity.data_agendamento).toLocaleString('pt-BR')}</p>
                                    </div>
                                    <ArrowRight className="w-4 h-4 text-orange-500" />
                                </div>
                            ))}
                            {pendingActivities.length > 3 && (
                                <Link to="/crm/atividades" className="block text-center text-sm text-blue-600 hover:underline mt-2">
                                    Ver mais {pendingActivities.length - 3} atividades
                                </Link>
                            )}
                        </div>
                    )}
                </WidgetCard>

                {/* Propostas */}
                <WidgetCard title="Propostas" linkTo="/crm/propostas">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 border-l-4 border-green-500 bg-green-50 rounded">
                            <span className="text-sm text-green-700">0 ativas</span>
                            <ArrowRight className="w-4 h-4 text-green-500" />
                        </div>
                        <div className="flex justify-between items-center p-2 border-l-4 border-orange-500 bg-orange-50 rounded">
                            <span className="text-sm text-orange-700">0 vencem hoje</span>
                            <ArrowRight className="w-4 h-4 text-orange-500" />
                        </div>
                    </div>
                </WidgetCard>

                {/* Aniversários */}
                <WidgetCard title="Aniversários">
                    <div className="text-center py-10">
                        <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-light-text">Nenhum aniversário nos próximos dias.</p>
                    </div>
                </WidgetCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Imóveis */}
                <WidgetCard title="Imóveis" linkTo="/crm/imoveis">
                    <div className="flex items-center space-x-6">
                        <div className="relative w-32 h-32">
                            {/* Mock Donut Chart */}
                            <div className="w-full h-full rounded-full flex items-center justify-center" style={{ background: `conic-gradient(#10b981 0% 84%, #ff6600 84% 96%, #3b82f6 96% 100%)` }}>
                                <div className="w-24 h-24 bg-white rounded-full flex flex-col items-center justify-center">
                                    <span className="text-2xl font-bold text-dark-text">83</span>
                                    <span className="text-xs text-light-text">Imóveis</span>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2 flex-1">
                            <div className="p-2 bg-blue-100 text-blue-800 rounded text-sm font-medium">1 Em aprovação</div>
                            <div className="p-2 bg-green-100 text-green-800 rounded text-sm font-medium">70 Atualizados</div>
                            <div className="p-2 bg-orange-100 text-orange-800 rounded text-sm font-medium">12 Expirando</div>
                            <div className="p-2 bg-red-100 text-red-800 rounded text-sm font-medium">0 Desatualizados</div>
                        </div>
                    </div>
                </WidgetCard>

                {/* Aluguéis */}
                <WidgetCard title="Aluguéis" linkTo="/crm/alugueis">
                    <h3 className="text-md font-semibold text-dark-text mb-2">Pendências</h3>
                    <div className="grid grid-cols-3 gap-4 text-center mb-4">
                        <div className="p-3 bg-red-50 rounded"><p className="text-xl font-bold text-red-600">0</p><p className="text-xs text-light-text">Faturas atrasadas</p></div>
                        <div className="p-3 bg-orange-50 rounded"><p className="text-xl font-bold text-orange-600">0</p><p className="text-xs text-light-text">Boletos expiram em 7 dias</p></div>
                        <div className="p-3 bg-yellow-50 rounded"><p className="text-xl font-bold text-yellow-600">0</p><p className="text-xs text-light-text">Repasses pendentes</p></div>
                    </div>
                    <h3 className="text-md font-semibold text-dark-text mb-2">Contratos</h3>
                    <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 bg-blue-50 rounded"><p className="text-xl font-bold text-blue-600">0</p><p className="text-xs text-light-text">Em aviso prévio</p></div>
                        <div className="p-3 bg-purple-50 rounded"><p className="text-xl font-bold text-purple-600">0</p><p className="text-xs text-light-text">Garantias locatícias vencendo</p></div>
                        <div className="p-3 bg-green-50 rounded"><p className="text-xl font-bold text-green-600">0</p><p className="text-xs text-light-text">Para reajustar neste mês</p></div>
                    </div>
                </WidgetCard>

                {/* Chaves */}
                <WidgetCard title="Chaves" linkTo="/crm/chaves">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 border-l-4 border-gray-300 bg-gray-50 rounded">
                            <span className="text-sm text-gray-700">0 retiradas</span>
                            <Key className="w-4 h-4 text-gray-500" />
                        </div>
                        <div className="flex justify-between items-center p-2 border-l-4 border-red-500 bg-red-50 rounded">
                            <span className="text-sm text-red-700">0 atrasadas</span>
                            <Key className="w-4 h-4 text-red-500" />
                        </div>
                    </div>
                </WidgetCard>
            </div>
            
            {/* Exclusividades */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <WidgetCard title="Exclusividades disponíveis" linkTo="/crm/imoveis">
                    <div className="space-y-3">
                        <div className="flex justify-between items-center p-2 border-l-4 border-blue-500 bg-blue-50 rounded">
                            <span className="text-sm text-blue-700">0 atualizadas</span>
                            <ArrowRight className="w-4 h-4 text-blue-500" />
                        </div>
                        <div className="flex justify-between items-center p-2 border-l-4 border-orange-500 bg-orange-50 rounded">
                            <span className="text-sm text-orange-700">0 vencendo</span>
                            <ArrowRight className="w-4 h-4 text-orange-500" />
                        </div>
                        <div className="flex justify-between items-center p-2 border-l-4 border-red-500 bg-red-50 rounded">
                            <span className="text-sm text-red-700">0 vencidas</span>
                            <ArrowRight className="w-4 h-4 text-red-500" />
                        </div>
                    </div>
                </WidgetCard>
            </div>
        </div>
    );
};

export default DashboardPage;
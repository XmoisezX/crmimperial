import React, { useState, useEffect, useCallback } from 'react';
import { Plus, TrendingUp, Loader2, RefreshCw, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import NewOpportunityModal, { Opportunity, OpportunityStage } from '../components/NewOpportunityModal';
import OpportunityCard from '../components/OpportunityCard';
import ActivityModal from '../components/ActivityModal'; // Será criado no próximo passo
import ProposalGeneratorModal from '../components/ProposalGeneratorModal'; // Será criado no próximo passo

const FUNNEL_STAGES: OpportunityStage[] = [
    'Novos Leads',
    'Em Atendimento',
    'Visita Agendada',
    'Em Negociação',
    'Proposta Enviada',
    'Venda Ganha',
    'Venda Perdida',
];

const OportunidadesPage: React.FC = () => {
    const { session } = useAuth();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modais
    const [isNewOpportunityModalOpen, setIsNewOpportunityModalOpen] = useState(false);
    const [editingOpportunity, setEditingOpportunity] = useState<Opportunity | null>(null);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [opportunityForActivity, setOpportunityForActivity] = useState<Opportunity | null>(null);
    const [isProposalModalOpen, setIsProposalModalOpen] = useState(false);
    const [opportunityForProposal, setOpportunityForProposal] = useState<Opportunity | null>(null);

    const fetchOpportunities = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
            .from('oportunidades')
            .select(`
                *,
                clientes:cliente_id(nome),
                imoveis:imovel_id(codigo, logradouro, numero, bairro)
            `)
            .eq('user_id', session.user.id)
            .order('data_criacao', { ascending: false });

        if (error) {
            console.error('Erro ao buscar oportunidades:', error);
            setError('Não foi possível carregar as oportunidades.');
            setOpportunities([]);
        } else {
            setOpportunities(data as Opportunity[]);
        }
        setIsLoading(false);
    }, [session]);

    useEffect(() => {
        fetchOpportunities();
    }, [fetchOpportunities]);

    const handleNewOpportunity = () => {
        setEditingOpportunity(null); // Garante que é uma nova oportunidade
        setIsNewOpportunityModalOpen(true);
    };

    const handleEditOpportunity = (opportunity: Opportunity) => {
        setEditingOpportunity(opportunity);
        setIsNewOpportunityModalOpen(true);
    };

    const handleAddActivity = (opportunity: Opportunity) => {
        setOpportunityForActivity(opportunity);
        setIsActivityModalOpen(true);
    };

    const handleGenerateProposal = (opportunity: Opportunity) => {
        setOpportunityForProposal(opportunity);
        setIsProposalModalOpen(true);
    };

    // --- Drag and Drop Logic (Simplified) ---
    const handleDragStart = (e: React.DragEvent, opportunityId: string) => {
        e.dataTransfer.setData("opportunityId", opportunityId);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // Permite o drop
    };

    const handleDrop = useCallback(async (e: React.DragEvent, newStage: OpportunityStage) => {
        e.preventDefault();
        const opportunityId = e.dataTransfer.getData("opportunityId");
        
        const opportunityToUpdate = opportunities.find(opp => opp.id === opportunityId);
        if (!opportunityToUpdate || opportunityToUpdate.etapa === newStage) return;

        // Atualiza o estado local imediatamente para feedback visual
        setOpportunities(prev => prev.map(opp => 
            opp.id === opportunityId ? { ...opp, etapa: newStage } : opp
        ));

        // Atualiza no banco de dados
        const { error } = await supabase
            .from('oportunidades')
            .update({ etapa: newStage, data_atualizacao: new Date().toISOString() })
            .eq('id', opportunityId)
            .eq('user_id', session?.user.id);

        if (error) {
            console.error('Erro ao atualizar etapa da oportunidade:', error);
            setError(`Falha ao mover oportunidade: ${error.message}`);
            // Opcional: reverter o estado local em caso de erro
            fetchOpportunities(); 
        }
    }, [opportunities, session, fetchOpportunities]);

    const getStageColor = (stage: OpportunityStage) => {
        switch (stage) {
            case 'Novos Leads': return 'bg-blue-100 border-blue-300';
            case 'Em Atendimento': return 'bg-yellow-100 border-yellow-300';
            case 'Visita Agendada': return 'bg-purple-100 border-purple-300';
            case 'Em Negociação': return 'bg-orange-100 border-orange-300';
            case 'Proposta Enviada': return 'bg-indigo-100 border-indigo-300';
            case 'Venda Ganha': return 'bg-green-100 border-green-300';
            case 'Venda Perdida': return 'bg-red-100 border-red-300';
            default: return 'bg-gray-100 border-gray-300';
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-dark-text flex items-center">
                    <TrendingUp className="w-6 h-6 mr-2 text-blue-600" /> Funil de Vendas
                </h1>
                <div className="flex space-x-3">
                    <Button 
                        onClick={handleNewOpportunity}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nova Oportunidade
                    </Button>
                    <Button 
                        variant="outline" 
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={fetchOpportunities}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
                        Atualizar
                    </Button>
                </div>
            </div>

            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md mb-6 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                </div>
            )}

            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                    <p className="text-gray-600">Carregando oportunidades...</p>
                </div>
            ) : (
                <div className="flex overflow-x-auto space-x-6 pb-4">
                    {FUNNEL_STAGES.map(stage => (
                        <div 
                            key={stage} 
                            className={`flex-shrink-0 w-80 p-4 rounded-lg shadow-inner border-t-4 ${getStageColor(stage)}`}
                            onDragOver={handleDragOver}
                            onDrop={(e) => handleDrop(e, stage)}
                        >
                            <h2 className="text-lg font-semibold text-dark-text mb-4">{stage}</h2>
                            <div className="min-h-[100px]"> {/* Garante altura mínima para drop */}
                                {opportunities
                                    .filter(opp => opp.etapa === stage)
                                    .map(opp => (
                                        <OpportunityCard 
                                            key={opp.id} 
                                            opportunity={opp} 
                                            onEdit={handleEditOpportunity}
                                            onAddActivity={handleAddActivity}
                                            onGenerateProposal={handleGenerateProposal}
                                            onDragStart={handleDragStart}
                                        />
                                    ))}
                                {opportunities.filter(opp => opp.etapa === stage).length === 0 && (
                                    <p className="text-sm text-gray-500 text-center py-4">Nenhuma oportunidade nesta etapa.</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
            
            <NewOpportunityModal 
                isOpen={isNewOpportunityModalOpen}
                onClose={() => setIsNewOpportunityModalOpen(false)}
                onSaveSuccess={fetchOpportunities}
                initialOpportunity={editingOpportunity}
            />

            {/* Modais de Atividade e Proposta (serão implementados nos próximos passos) */}
            {isActivityModalOpen && opportunityForActivity && (
                <ActivityModal 
                    isOpen={isActivityModalOpen}
                    onClose={() => setIsActivityModalOpen(false)}
                    opportunity={opportunityForActivity}
                    onSaveSuccess={fetchOpportunities} // Para atualizar o dashboard de atividades
                />
            )}

            {isProposalModalOpen && opportunityForProposal && (
                <ProposalGeneratorModal 
                    isOpen={isProposalModalOpen}
                    onClose={() => setIsProposalModalOpen(false)}
                    opportunity={opportunityForProposal}
                    onSaveSuccess={fetchOpportunities} // Para atualizar o status da oportunidade, se necessário
                />
            )}
        </div>
    );
};

export default OportunidadesPage;
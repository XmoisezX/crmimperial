import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Users, TrendingUp, Mail, Phone, Plus, RefreshCw, Loader2, AlertTriangle, Edit, Trash2, Clock, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import NewLeadModal from '../components/NewLeadModal';
import LeadFilters, { LeadFiltersType } from '../components/LeadFilters';
import { LeadListing, LeadStatus } from '../../types';
import NewOpportunityModal, { Opportunity } from '../components/NewOpportunityModal';
import ActivityModal from '../components/ActivityModal';
import ConfirmationModal from '../components/ConfirmationModal';

const initialFilters: LeadFiltersType = {
    search: '',
    status: '',
    origem: '',
    responsavelId: '',
    periodoCriacao: '',
};

const LeadsPage: React.FC = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [leads, setLeads] = useState<LeadListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filtros
    const [filters, setFilters] = useState<LeadFiltersType>(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState<LeadFiltersType>(initialFilters);

    // Modais
    const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
    const [editingLead, setEditingLead] = useState<LeadListing | null>(null);
    const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
    const [leadToConvert, setLeadToConvert] = useState<LeadListing | null>(null);
    const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
    const [leadForActivity, setLeadForActivity] = useState<LeadListing | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [leadToDelete, setLeadToDelete] = useState<LeadListing | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);


    const fetchLeads = useCallback(async (currentFilters: LeadFiltersType) => {
        if (!session) return;
        setIsLoading(true);
        setError(null);

        let query = supabase
            .from('leads')
            .select(`
                id, nome, telefone, email, origem, observacoes, status, created_at,
                responsavel:responsavel_id(full_name)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
            
        // Aplicação dos filtros
        if (currentFilters.status) {
            query = query.eq('status', currentFilters.status);
        }
        if (currentFilters.origem) {
            query = query.eq('origem', currentFilters.origem);
        }
        if (currentFilters.responsavelId) {
            query = query.eq('responsavel_id', currentFilters.responsavelId);
        }
        
        // Busca Rápida (Nome, Telefone, Email)
        if (currentFilters.search) {
            const searchLower = currentFilters.search.toLowerCase();
            query = query.or(`nome.ilike.%${searchLower}%,telefone.ilike.%${searchLower}%,email.ilike.%${searchLower}%`);
        }
        
        // Período de Criação (Mocked filter)
        // if (currentFilters.periodoCriacao) { ... }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar leads:', error);
            setError('Não foi possível carregar a lista de leads.');
            setLeads([]);
        } else {
            setLeads(data as LeadListing[]);
        }
        setIsLoading(false);
    }, [session]);

    useEffect(() => {
        fetchLeads(appliedFilters);
    }, [fetchLeads, appliedFilters]);
    
    // --- Handlers de Filtro ---
    const handleFilterChange = useCallback((newFilters: Partial<LeadFiltersType>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);
    
    const handleApplyFilters = useCallback(() => {
        setAppliedFilters(filters);
    }, [filters]);
    
    const handleClearFilters = useCallback(() => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
    }, []);
    
    // --- Handlers de Ação ---
    const handleNewLead = () => {
        setEditingLead(null);
        setIsNewLeadModalOpen(true);
    };

    const handleEditLead = (lead: LeadListing) => {
        setEditingLead(lead);
        setIsNewLeadModalOpen(true);
    };
    
    const handleConvertLead = (lead: LeadListing) => {
        setLeadToConvert(lead);
        setIsConvertModalOpen(true);
    };
    
    const handleAddActivity = (lead: LeadListing) => {
        setLeadForActivity(lead);
        setIsActivityModalOpen(true);
    };
    
    const handleDeleteClick = (lead: LeadListing) => {
        setLeadToDelete(lead);
        setIsDeleteModalOpen(true);
    };
    
    const confirmDelete = useCallback(async () => {
        if (!leadToDelete || !session) return;
        
        setIsDeleting(true);
        
        const { error } = await supabase
            .from('leads')
            .delete()
            .eq('id', leadToDelete.id!)
            .eq('user_id', session.user.id);
            
        setIsDeleting(false);
        setIsDeleteModalOpen(false);
        setLeadToDelete(null);
        
        if (error) {
            alert(`Erro ao excluir lead: ${error.message}`);
        } else {
            alert('Lead excluído com sucesso.');
            fetchLeads(appliedFilters);
        }
    }, [leadToDelete, session, appliedFilters, fetchLeads]);

    const getStatusBadge = (status: LeadStatus) => {
        const baseClasses = "px-2 py-0.5 text-xs font-semibold rounded-full";
        switch (status) {
            case 'Novo': return <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>Novo</Badge>;
            case 'Contatado': return <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>Contatado</Badge>;
            case 'Qualificado': return <Badge className={`${baseClasses} bg-green-100 text-green-800`}>Qualificado</Badge>;
            case 'Desqualificado': return <Badge className={`${baseClasses} bg-red-100 text-red-800`}>Desqualificado</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };
    
    // Mock de Opportunity para o modal de conversão (usando dados do lead)
    const mockOpportunityFromLead: Opportunity | null = leadToConvert ? {
        nome: `Oportunidade - ${leadToConvert.nome}`,
        cliente_id: null, // Força a seleção do cliente no modal
        imovel_id: null,
        etapa: 'Em Atendimento',
        valor_estimado: null,
        data_fechamento_estimada: null,
        observacoes: `Convertido do Lead: ${leadToConvert.nome}. Observações do Lead: ${leadToConvert.observacoes || 'N/A'}`,
    } : null;
    
    // Mock de Opportunity para o modal de atividade (usando dados do lead)
    // Nota: Atividades precisam de um ID de Oportunidade real. Usamos um mock ID e o nome do lead.
    const mockOpportunityForActivity: Opportunity | null = leadForActivity ? {
        id: 'mock_opp_id_from_lead', 
        nome: `Lead: ${leadForActivity.nome}`,
        cliente_id: null,
        imovel_id: null,
        etapa: 'Em Atendimento',
        valor_estimado: null,
        data_fechamento_estimada: null,
        observacoes: null,
        clientes: { nome: leadForActivity.nome },
    } : null;


    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-dark-text flex items-center">
                    <Zap className="w-6 h-6 mr-2 text-primary-orange" /> Gestão de Leads ({leads.length})
                </h1>
                <div className="flex space-x-3">
                    <Button 
                        onClick={handleNewLead}
                        className="bg-primary-orange hover:bg-secondary-orange text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Novo Lead
                    </Button>
                    <Button 
                        variant="outline" 
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={() => fetchLeads(appliedFilters)}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
                        Atualizar
                    </Button>
                </div>
            </div>

            <LeadFilters 
                filters={filters}
                onFilterChange={handleFilterChange}
                onApplyFilters={handleApplyFilters}
                onClearFilters={handleClearFilters}
            />

            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md mt-6 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                </div>
            )}

            <Card className="shadow-lg mt-6">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Origem</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Responsável</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadastro</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-500">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                                            Carregando leads...
                                        </td>
                                    </tr>
                                ) : leads.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-500">
                                            Nenhum lead encontrado.
                                        </td>
                                    </tr>
                                ) : (
                                    leads.map((lead) => (
                                        <tr key={lead.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{lead.nome}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text space-y-1">
                                                {lead.telefone && <div className="flex items-center"><Phone className="w-4 h-4 mr-2 text-gray-400" /> {lead.telefone}</div>}
                                                {lead.email && <div className="flex items-center"><Mail className="w-4 h-4 mr-2 text-gray-400" /> {lead.email}</div>}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{lead.origem || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">{lead.responsavel?.full_name || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {getStatusBadge(lead.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">
                                                {lead.created_at ? new Date(lead.created_at).toLocaleDateString('pt-BR') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-2">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="text-blue-600 hover:bg-blue-50"
                                                    onClick={() => handleAddActivity(lead)}
                                                    title="Nova Interação"
                                                >
                                                    <Clock className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    className="bg-green-600 hover:bg-green-700 text-white"
                                                    onClick={() => handleConvertLead(lead)}
                                                    title="Converter em Oportunidade"
                                                >
                                                    <TrendingUp className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="text-gray-600 hover:bg-gray-100"
                                                    onClick={() => handleEditLead(lead)}
                                                    title="Editar Lead"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="text-red-600 hover:bg-red-50"
                                                    onClick={() => handleDeleteClick(lead)}
                                                    title="Excluir Lead"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            
            <NewLeadModal 
                isOpen={isNewLeadModalOpen}
                onClose={() => setIsNewLeadModalOpen(false)}
                onSaveSuccess={() => fetchLeads(appliedFilters)}
                initialLead={editingLead}
            />
            
            {/* Modal de Conversão para Oportunidade */}
            {isConvertModalOpen && leadToConvert && mockOpportunityFromLead && (
                <NewOpportunityModal 
                    isOpen={isConvertModalOpen}
                    onClose={() => setIsConvertModalOpen(false)}
                    onSaveSuccess={() => {
                        alert(`Lead ${leadToConvert.nome} convertido para Oportunidade!`);
                        setIsConvertModalOpen(false);
                        navigate('/crm/oportunidades'); // Redireciona para o funil
                    }}
                    initialOpportunity={mockOpportunityFromLead}
                />
            )}
            
            {/* Modal de Atividade (Mockado, pois precisa de um ID de Oportunidade real) */}
            {isActivityModalOpen && mockOpportunityForActivity && (
                <ActivityModal 
                    isOpen={isActivityModalOpen}
                    onClose={() => setIsActivityModalOpen(false)}
                    opportunity={mockOpportunityForActivity}
                    onSaveSuccess={() => {
                        alert('Atividade salva! (Mock: Oportunidade ID)');
                        setIsActivityModalOpen(false);
                    }}
                />
            )}
            
            {/* Modal de Confirmação de Exclusão */}
            <ConfirmationModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmar Exclusão de Lead"
                message={`Você está prestes a excluir o lead "${leadToDelete?.nome}". Esta ação é irreversível.`}
                confirmText="Excluir Lead"
                isConfirming={isDeleting}
            />
        </div>
    );
};

export default LeadsPage;
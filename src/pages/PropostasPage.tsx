import React, { useState, useEffect, useCallback } from 'react';
import { FileText, Loader2, RefreshCw, AlertTriangle, DollarSign, Calendar, TrendingUp, Eye } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Proposal, ProposalStatus } from '../components/ProposalGeneratorModal';
import { Link } from 'react-router-dom';

// Interface para os dados da proposta com joins
interface ProposalListing extends Proposal {
    clientes: { nome: string } | null;
    imoveis: { codigo: string, logradouro: string, numero: string, bairro: string } | null;
    oportunidades: { nome: string } | null;
}

const PropostasPage: React.FC = () => {
    const { session } = useAuth();
    const [proposals, setProposals] = useState<ProposalListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Mock de estado de filtro (para futura implementação)
    const [filterStatus, setFilterStatus] = useState<ProposalStatus | ''>('');

    const fetchProposals = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        setError(null);

        let query = supabase
            .from('propostas')
            .select(`
                id, valor_proposto, data_validade, status, created_at,
                clientes:cliente_id(nome),
                imoveis:imovel_id(codigo, logradouro, numero, bairro),
                oportunidades:oportunidade_id(nome)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });
            
        if (filterStatus) {
            query = query.eq('status', filterStatus);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar propostas:', error);
            setError('Não foi possível carregar a lista de propostas.');
            setProposals([]);
        } else {
            setProposals(data as ProposalListing[]);
        }
        setIsLoading(false);
    }, [session, filterStatus]);

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);
    
    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const getStatusBadge = (status: ProposalStatus) => {
        switch (status) {
            case 'Rascunho': return <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-300">Rascunho</Badge>;
            case 'Enviada': return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Enviada</Badge>;
            case 'Aceita': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aceita</Badge>;
            case 'Recusada': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Recusada</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-dark-text flex items-center">
                    <FileText className="w-6 h-6 mr-2 text-blue-600" /> Gestão de Propostas ({proposals.length})
                </h1>
                <div className="flex space-x-3">
                    <select 
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value as ProposalStatus | '')}
                        className="p-2 border border-gray-300 rounded-md text-sm text-light-text"
                        disabled={isLoading}
                    >
                        <option value="">Todos os Status</option>
                        <option value="Rascunho">Rascunho</option>
                        <option value="Enviada">Enviada</option>
                        <option value="Aceita">Aceita</option>
                        <option value="Recusada">Recusada</option>
                    </select>
                    <Button 
                        variant="outline" 
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={fetchProposals}
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

            <Card className="shadow-lg">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Oportunidade</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">Imóvel</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Proposto</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Validade</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-500">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                                            Carregando propostas...
                                        </td>
                                    </tr>
                                ) : proposals.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-500">
                                            Nenhuma proposta encontrada.
                                        </td>
                                    </tr>
                                ) : (
                                    proposals.map((proposal) => (
                                        <tr key={proposal.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text flex items-center">
                                                <TrendingUp className="w-4 h-4 mr-2 text-gray-400" />
                                                {proposal.oportunidades?.nome || 'Oportunidade N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">
                                                {proposal.clientes?.nome || 'Cliente N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                                                {proposal.imoveis ? (
                                                    <Link to={`/crm/imoveis/${proposal.imovel_id}`} className="text-blue-600 hover:underline">
                                                        {proposal.imoveis.codigo} - {proposal.imoveis.logradouro}, {proposal.imoveis.numero} ({proposal.imoveis.bairro})
                                                    </Link>
                                                ) : (
                                                    <span className="text-red-500">Imóvel Excluído</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-primary-orange">
                                                {formatCurrency(proposal.valor_proposto)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">
                                                <div className="flex items-center">
                                                    <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                                                    {new Date(proposal.data_validade).toLocaleDateString('pt-BR')}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {getStatusBadge(proposal.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="text-blue-600 hover:bg-blue-50"
                                                    // Mock: Abrir modal de edição ou visualização
                                                    onClick={() => alert(`Visualizar proposta ${proposal.id}`)}
                                                >
                                                    <Eye className="w-4 h-4 mr-1" /> Ver
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
        </div>
    );
};

export default PropostasPage;
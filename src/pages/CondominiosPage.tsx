import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, List, Map, Loader2, Building2 } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import FilterSidebar, { ImovelFilters } from '../components/FilterSidebar'; // Reusing FilterSidebar structure
import CondominioCard from '../components/CondominioCard';
import ActionsDropdown from '../components/ActionsDropdown';
import ConfirmationModal from '../components/ConfirmationModal';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import TextInput from '../components/TextInput'; // Importação adicionada
import NumberInput from '../components/NumberInput'; // Importação adicionada

// Interface para o Condomínio (deve ser a mesma usada no CondominioCard)
interface Condominio {
    id: string;
    nome: string;
    logo_url: string;
    endereco: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    area_terreno_m2: number;
    condominio_obra: { estagio: string } | null;
    condominio_midias: { arquivo_url: string, destaque: boolean, ordem: number }[];
}

// Interface de Filtros específica para Condomínios (usando a estrutura de ImovelFilters como base)
interface CondominioFilters {
    search: string; // Busca por endereço, código ou nome
    incorporadora: string;
    construtora: string;
    bairro: string;
    etiquetas: string[];
    lancamento: 'Sim' | 'Não' | '';
    destaque: 'Sim' | 'Não' | '';
    disponiveis: 'Sim' | 'Não' | '';
    estagio: 'Na planta' | 'Em construção' | 'Pronto' | '';
}

const initialFilters: CondominioFilters = {
    search: '',
    incorporadora: '',
    construtora: '',
    bairro: '',
    etiquetas: [],
    lancamento: '',
    destaque: '',
    disponiveis: '',
    estagio: '',
};

const CondominiosPage: React.FC = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // --- Estado de Filtros ---
    const [filters, setFilters] = useState<CondominioFilters>(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState<CondominioFilters>(initialFilters);
    
    // --- Estado de Seleção ---
    const [selectedCondominioIds, setSelectedCondominioIds] = useState<string[]>([]);
    
    // Estado do Modal de Confirmação
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchCondominios = useCallback(async (currentFilters: CondominioFilters) => {
        if (!session) return;

        setIsLoading(true);
        setError(null);
        setSelectedCondominioIds([]);

        let query = supabase
            .from('condominios')
            .select(`
                id, nome, logo_url, endereco, numero, bairro, cidade, estado, area_terreno_m2,
                condominio_obra(estagio),
                condominio_midias(arquivo_url, destaque, ordem)
            `)
            .eq('user_id', session.user.id);
            
        // --- Aplicação dos Filtros ---
        
        // 1. Busca Geral (Nome, Endereço, Código - Mocked as 'nome' for now)
        if (currentFilters.search) {
            query = query.ilike('nome', `%${currentFilters.search}%`);
        }
        
        // 2. Bairro
        if (currentFilters.bairro) {
            query = query.eq('bairro', currentFilters.bairro);
        }
        
        // 3. Estágio (CondominioObra - Mocked filter since it's a separate table)
        // NOTE: Filtering on nested tables requires complex joins/RPCs in Supabase. 
        // We'll apply this filter on the client side for simplicity in this mock.

        const { data: condominiosData, error: condominioError } = await query
            .order('created_at', { ascending: false });

        if (condominioError) {
            console.error('Erro ao buscar condomínios:', condominioError);
            setError('Não foi possível carregar a lista de condomínios.');
            setIsLoading(false);
            return;
        }
        
        // 4. Mapear e formatar os dados
        let formattedCondominios: Condominio[] = condominiosData.map((condominio: any) => {
            
            const mediaForCard = condominio.condominio_midias
                .sort((a: any, b: any) => a.ordem - b.ordem)
                .map((m: any) => ({ arquivo_url: m.arquivo_url, destaque: m.destaque, ordem: m.ordem }));
            
            return {
                id: condominio.id,
                nome: condominio.nome,
                logo_url: condominio.logo_url,
                endereco: condominio.endereco,
                numero: condominio.numero,
                bairro: condominio.bairro,
                cidade: condominio.cidade,
                estado: condominio.estado,
                area_terreno_m2: condominio.area_terreno_m2,
                condominio_obra: condominio.condominio_obra?.[0] || null, // Obra é 1:1
                condominio_midias: mediaForCard,
            };
        });
        
        // --- Filtragem Lado do Cliente (para filtros complexos) ---
        if (currentFilters.estagio) {
            formattedCondominios = formattedCondominios.filter(c => c.condominio_obra?.estagio === currentFilters.estagio);
        }
        // Fim da Filtragem Lado do Cliente

        setCondominios(formattedCondominios);
        setIsLoading(false);
    }, [session]);
    
    const handleViewDetails = useCallback((condominioId: string) => {
        navigate(`/crm/condominios/${condominioId}`);
    }, [navigate]);

    useEffect(() => {
        fetchCondominios(appliedFilters);
    }, [fetchCondominios, appliedFilters]);
    
    // --- Handlers de Filtro ---
    const handleFilterChange = useCallback((newFilters: Partial<CondominioFilters>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);
    
    const handleApplyFilters = useCallback(() => {
        setAppliedFilters(filters);
    }, [filters]);
    
    const handleClearFilters = useCallback(() => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
    }, []);
    
    // --- Lógica de Seleção ---
    const handleSelectCondominio = useCallback((condominioId: string, isSelected: boolean) => {
        setSelectedCondominioIds(prev => {
            if (isSelected) {
                return [...prev, condominioId];
            } else {
                return prev.filter(id => id !== condominioId);
            }
        });
    }, []);
    
    const handleSelectAll = useCallback((checked: boolean) => {
        if (checked) {
            setSelectedCondominioIds(condominios.map(condominio => condominio.id));
        } else {
            setSelectedCondominioIds([]);
        }
    }, [condominios]);
    
    const isAllSelected = condominios.length > 0 && selectedCondominioIds.length === condominios.length;
    const isIndeterminate = selectedCondominioIds.length > 0 && selectedCondominioIds.length < condominios.length;
    
    // --- Lógica de Exclusão (Confirmada) ---
    const confirmDelete = async () => {
        if (selectedCondominioIds.length === 0) return;

        setIsDeleting(true);
        
        // 1. Excluir dados auxiliares (obra, midias, caracteristicas)
        // Nota: A exclusão em cascata no SQL garante que a maioria seja limpa, mas é bom garantir.
        
        // 2. Excluir os condomínios principais
        const { error: condominioDeleteError } = await supabase
            .from('condominios')
            .delete()
            .in('id', selectedCondominioIds);
            
        if (condominioDeleteError) {
            console.error('Erro ao excluir condomínios:', condominioDeleteError);
            alert(`Erro ao excluir condomínios: ${condominioDeleteError.message}`);
        } else {
            alert(`${selectedCondominioIds.length} condomínio(s) excluído(s) com sucesso.`);
        }
        
        setIsDeleting(false);
        setIsConfirmModalOpen(false);
        
        // 3. Recarregar a lista e limpar a seleção
        fetchCondominios(appliedFilters);
    };
    
    // --- Lógica de Ações em Massa (Inicia o modal de confirmação) ---
    const handleMassAction = (action: string) => {
        if (selectedCondominioIds.length === 0) return;
        
        switch (action) {
            case 'edit':
                if (selectedCondominioIds.length === 1) {
                    navigate(`/crm/condominios/${selectedCondominioIds[0]}`);
                } else {
                    alert(`Ação de Edição Múltipla (Mock) para ${selectedCondominioIds.length} condomínios.`);
                }
                break;
            case 'delete':
                setIsConfirmModalOpen(true); // Abre o modal de confirmação
                break;
            default:
                alert(`Ação: ${action} (Mock) para ${selectedCondominioIds.length} condomínios.`);
        }
    };

    // Mock de FilterSidebar para Condomínios
    const CondominioFilterSidebar: React.FC = () => {
        const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
            handleFilterChange({ search: e.target.value });
        };
        const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
            const { id, value } = e.target;
            handleFilterChange({ [id]: value as any });
        };
        
        return (
            <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto p-4 space-y-4">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-dark-text flex items-center">
                        <Building2 className="w-5 h-5 mr-2" /> Filtros
                    </h2>
                    <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                        <Plus className="w-4 h-4 mr-1" /> Salvar filtro
                    </button>
                </div>
                
                <TextInput 
                    label=""
                    id="search"
                    placeholder="Busque por nome, endereço ou código"
                    value={filters.search}
                    onChange={handleTextChange}
                />
                
                <select 
                    id="estagio" 
                    value={filters.estagio}
                    onChange={handleSelectChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                >
                    <option value="">Estágio (Sem filtro)</option>
                    <option value="Na planta">Na planta</option>
                    <option value="Em construção">Em construção</option>
                    <option value="Pronto">Pronto</option>
                </select>
                
                <select 
                    id="bairro" 
                    value={filters.bairro}
                    onChange={handleSelectChange}
                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                >
                    <option value="">Bairro (Sem filtro)</option>
                    {['Centro', 'Laranjal', 'Areal'].map(b => <option key={b} value={b}>{b}</option>)}
                </select>
                
                <div className="pt-4 border-t border-gray-200 space-y-2 sticky bottom-0 bg-white z-10">
                    <Button 
                        onClick={handleClearFilters}
                        variant="outline"
                        className="w-full text-primary-orange border-primary-orange hover:bg-orange-50"
                    >
                        Limpar
                    </Button>
                    <Button 
                        onClick={handleApplyFilters}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        Filtrar
                    </Button>
                </div>
            </div>
        );
    };


    return (
        <div className="flex h-full min-h-[calc(100vh-150px)]">
            {/* Barra Lateral de Filtros */}
            <CondominioFilterSidebar />

            {/* Conteúdo Principal da Listagem */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50">
                
                {/* Header de Ações */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex space-x-3">
                        <Link to="/crm/condominios/novo">
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                                <Plus className="w-4 h-4 mr-2" /> Novo Condomínio
                            </Button>
                        </Link>
                        <Button 
                            variant="outline" 
                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                            onClick={() => fetchCondominios(appliedFilters)}
                            disabled={isLoading}
                        >
                            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
                            {isLoading ? 'Atualizando...' : 'Atualizar Lista'}
                        </Button>
                    </div>
                    
                    <div className="flex items-center space-x-2 text-gray-500">
                        <button title="Visualização em Lista" className="p-2 border rounded-md bg-gray-200 text-dark-text"><List className="w-5 h-5" /></button>
                        <button title="Visualização em Mapa" className="p-2 border rounded-md hover:bg-gray-100"><Map className="w-5 h-5" /></button>
                    </div>
                </div>

                {/* Barra de Seleção e Ações em Massa */}
                <div className="flex items-center justify-between mb-4 border-b pb-3">
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 text-sm font-semibold text-dark-text">
                            <Checkbox 
                                id="select-all" 
                                checked={isAllSelected}
                                onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                className="w-5 h-5 text-blue-600 border-gray-400"
                                indeterminate={isIndeterminate}
                            />
                            <span>Selecionar ({selectedCondominioIds.length})</span>
                        </label>
                        
                        <ActionsDropdown 
                            onAction={handleMassAction}
                            disabled={selectedCondominioIds.length === 0}
                            selectedCount={selectedCondominioIds.length}
                        />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                        <select className="p-2 border border-gray-300 rounded-md text-sm text-light-text">
                            <option>Data de atualização</option>
                            <option>Nome</option>
                        </select>
                    </div>
                </div>

                {/* Lista de Condomínios */}
                {error && <div className="text-red-600 p-4 bg-red-50 rounded-md">{error}</div>}
                
                {isLoading && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                        <p className="text-gray-600">Carregando condomínios...</p>
                    </div>
                )}
                
                {!isLoading && condominios.length === 0 && !error && (
                    <div className="text-center py-10 text-gray-500">
                        <p className="text-lg">Nenhum condomínio encontrado. Comece cadastrando um novo!</p>
                    </div>
                )}

                <div className="space-y-4">
                    {condominios.map(condominio => (
                        <CondominioCard 
                            key={condominio.id} 
                            condominio={condominio} 
                            onViewDetails={handleViewDetails} 
                            isSelected={selectedCondominioIds.includes(condominio.id)}
                            onSelect={handleSelectCondominio}
                        />
                    ))}
                </div>
                
                <div className="text-center mt-8 text-light-text text-sm">
                    Fim da lista
                </div>
            </div>
            
            {/* Modal de Confirmação de Exclusão */}
            <ConfirmationModal
                isOpen={isConfirmModalOpen}
                onClose={() => setIsConfirmModalOpen(false)}
                onConfirm={confirmDelete}
                title="Confirmação de Exclusão"
                message={`Você está prestes a excluir ${selectedCondominioIds.length} condomínio(s) selecionado(s).`}
                confirmText={`Excluir ${selectedCondominioIds.length} Condomínio(s)`}
                isConfirming={isDeleting}
            />
        </div>
    );
};

export default CondominiosPage;
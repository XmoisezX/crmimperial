import React, { useState, useEffect, useCallback } from 'react';
import { Key, Loader2, RefreshCw, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import KeyFilters, { KeyFilters as KeyFiltersType } from '../components/KeyFilters';
import KeyWithdrawalModal from '../components/KeyWithdrawalModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { KeyListingData, KeyStatus } from '../../types';

const initialFilters: KeyFiltersType = {
    codigo: '',
    imovel: '',
    retiradaPor: '',
    status: '',
};

const ChavesPage: React.FC = () => {
    const { session } = useAuth();
    const [keys, setKeys] = useState<KeyListingData[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [filters, setFilters] = useState<KeyFiltersType>(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState<KeyFiltersType>(initialFilters);
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedKey, setSelectedKey] = useState<KeyListingData | null>(null);

    const fetchKeys = useCallback(async () => {
        if (!session) return;

        setIsLoading(true);
        setError(null);

        // Busca todas as chaves do usuário, fazendo join com os dados básicos do imóvel
        const { data, error } = await supabase
            .from('imovel_chaves')
            .select(`
                id, codigo_chave, agencia, status, retirada_por, previsao_entrega, hora_entrega, imovel_id,
                imoveis(codigo, logradouro, numero, bairro)
            `)
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar chaves:', error);
            setError('Não foi possível carregar a lista de chaves.');
            setKeys([]);
        } else {
            // Mapeia e verifica status de atraso (client-side para simplicidade)
            const now = new Date();
            const mappedKeys: KeyListingData[] = data.map((key: any) => {
                let currentStatus: KeyStatus = key.status as KeyStatus;
                
                // Verifica se a chave está retirada e se a previsão de entrega já passou
                if (currentStatus === 'Retirada' && key.previsao_entrega && key.hora_entrega) {
                    // Combina data e hora para comparação
                    const deliveryString = `${key.previsao_entrega}T${key.hora_entrega}`;
                    const deliveryDateTime = new Date(deliveryString);
                    
                    if (deliveryDateTime < now) {
                        currentStatus = 'Atrasada';
                    }
                }
                
                return {
                    ...key,
                    codigo_chave: key.codigo_chave,
                    status: currentStatus,
                    imoveis: key.imoveis,
                } as KeyListingData;
            });
            
            setKeys(mappedKeys);
        }
        setIsLoading(false);
    }, [session]);

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);
    
    // --- Lógica de Filtragem (Client-side) ---
    const filteredKeys = keys.filter(key => {
        const { codigo, imovel, retiradaPor, status } = appliedFilters;
        
        // 1. Código da Chave
        if (codigo && !key.codigo_chave?.toLowerCase().includes(codigo.toLowerCase())) {
            return false;
        }
        
        // 2. Imóvel (Código ou Endereço)
        if (imovel && key.imoveis) {
            const searchLower = imovel.toLowerCase();
            const imovelMatch = key.imoveis.codigo?.toLowerCase().includes(searchLower) ||
                                key.imoveis.logradouro?.toLowerCase().includes(searchLower) ||
                                key.imoveis.bairro?.toLowerCase().includes(searchLower);
            if (!imovelMatch) return false;
        }
        
        // 3. Retirada Por
        if (retiradaPor && !key.retirada_por?.toLowerCase().includes(retiradaPor.toLowerCase())) {
            return false;
        }
        
        // 4. Status
        if (status && key.status !== status) {
            return false;
        }
        
        return true;
    });
    
    // --- Handlers de Filtro ---
    const handleFilterChange = useCallback((newFilters: Partial<KeyFiltersType>) => {
        setFilters(prev => ({ ...prev, ...newFilters }));
    }, []);
    
    const handleApplyFilters = useCallback(() => {
        setAppliedFilters(filters);
    }, [filters]);
    
    const handleClearFilters = useCallback(() => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
    }, []);
    
    // --- Handlers de Modal ---
    const handleWithdrawalClick = (key: KeyListingData) => {
        setSelectedKey(key);
        setIsModalOpen(true);
    };
    
    const handleReturnClick = async (key: KeyListingData) => {
        if (!window.confirm(`Confirmar devolução da chave ${key.codigo_chave}?`)) return;
        
        setIsLoading(true);
        
        // Resetar todos os campos de movimentação
        const dataToUpdate = {
            status: 'Disponível' as KeyStatus,
            retirada_por: null,
            tipo_retirada: null,
            motivo: null,
            previsao_entrega: null,
            hora_entrega: null,
        };
        
        const { error: updateError } = await supabase
            .from('imovel_chaves')
            .update(dataToUpdate)
            .eq('id', key.id)
            .eq('user_id', session?.user.id);
            
        if (updateError) {
            alert(`Erro ao registrar devolução: ${updateError.message}`);
        } else {
            alert('Devolução registrada com sucesso!');
            fetchKeys();
        }
    };
    
    const getStatusBadge = (status: KeyStatus) => {
        switch (status) {
            case 'Disponível':
                return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Disponível</Badge>;
            case 'Retirada':
                return <Badge className="bg-gray-200 text-gray-800 hover:bg-gray-300">Retirada</Badge>;
            case 'Atrasada':
                return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Atrasada</Badge>;
            default:
                return <Badge variant="secondary">{status}</Badge>;
        }
    };
    
    const formatTime = (dateStr: string | null, timeStr: string | null) => {
        if (!dateStr) return 'N/A';
        
        try {
            const date = new Date(dateStr);
            const formattedDate = date.toLocaleDateString('pt-BR');
            
            if (timeStr) {
                // Assumindo que timeStr é HH:MM:SS
                const [h, m] = timeStr.split(':');
                return `${formattedDate} às ${h}:${m}`;
            }
            return formattedDate;
        } catch (e) {
            return dateStr;
        }
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-dark-text flex items-center">
                    <Key className="w-6 h-6 mr-2 text-blue-600" /> Gestão de Chaves ({keys.length})
                </h1>
                <Button 
                    variant="outline" 
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    onClick={fetchKeys}
                    disabled={isLoading}
                >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
                    Atualizar
                </Button>
            </div>

            <KeyFilters 
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
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agência</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[250px]">Imóvel</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Retirada por</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Previsão de entrega</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-500">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                                            Carregando chaves...
                                        </td>
                                    </tr>
                                ) : filteredKeys.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="text-center py-10 text-gray-500">
                                            Nenhuma chave encontrada com os filtros aplicados.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredKeys.map((key) => (
                                        <tr key={key.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{key.codigo_chave}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{key.agencia}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                                                {key.imoveis ? (
                                                    <Link to={`/crm/imoveis/${key.imovel_id}`} className="text-blue-600 hover:underline">
                                                        {key.imoveis.codigo} - {key.imoveis.logradouro}, {key.imoveis.numero} ({key.imoveis.bairro})
                                                    </Link>
                                                ) : (
                                                    <span className="text-red-500">Imóvel Excluído</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{key.retirada_por || 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {getStatusBadge(key.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">
                                                {key.status !== 'Disponível' ? formatTime(key.previsao_entrega, key.hora_entrega) : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {key.status === 'Disponível' ? (
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => handleWithdrawalClick(key)}
                                                        className="bg-primary-orange hover:bg-secondary-orange text-white"
                                                    >
                                                        Retirar <ArrowRight className="w-4 h-4 ml-1" />
                                                    </Button>
                                                ) : (
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => handleReturnClick(key)}
                                                        className="bg-green-600 hover:bg-green-700 text-white"
                                                    >
                                                        Devolver
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            
            <KeyWithdrawalModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                keyData={selectedKey}
                onSaveSuccess={fetchKeys}
            />
        </div>
    );
};

export default ChavesPage;
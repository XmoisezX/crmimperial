import React, { useState, useCallback, useEffect } from 'react';
import { X, Save, Loader2, FileText, User, Home, DollarSign, Calendar, Printer, Eye } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import NumberInput from './NumberInput';
import { Opportunity } from './NewOpportunityModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type ProposalStatus = 'Rascunho' | 'Enviada' | 'Aceita' | 'Recusada';

export interface Proposal {
    id?: string;
    oportunidade_id: string;
    cliente_id: string;
    imovel_id: string;
    valor_proposto: number;
    condicoes_pagamento: string | null;
    data_validade: string; // YYYY-MM-DD
    status: ProposalStatus;
    arquivo_url: string | null;
    // Campos adicionais para display (vindos do join)
    clientes?: { nome: string, telefone: string, email: string } | null;
    imoveis?: { codigo: string, logradouro: string, numero: string, bairro: string, dados_valores: { valor_venda: number, valor_locacao: number } } | null;
}

interface ProposalGeneratorModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunity: Opportunity;
    onSaveSuccess: () => void;
}

const initialFormData: Proposal = {
    oportunidade_id: '',
    cliente_id: '',
    imovel_id: '',
    valor_proposto: 0,
    condicoes_pagamento: null,
    data_validade: new Date().toISOString().split('T')[0],
    status: 'Rascunho',
    arquivo_url: null,
};

const ProposalGeneratorModal: React.FC<ProposalGeneratorModalProps> = ({ isOpen, onClose, opportunity, onSaveSuccess }) => {
    const { session } = useAuth();
    const [formData, setFormData] = useState<Proposal>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(true);
    const [existingProposals, setExistingProposals] = useState<Proposal[]>([]);

    const fetchOpportunityDetails = useCallback(async () => {
        if (!session || !opportunity.cliente_id || !opportunity.imovel_id) {
            setError('Dados incompletos para gerar proposta.');
            setIsLoadingDetails(false);
            return;
        }
        
        setIsLoadingDetails(true);
        setError(null);

        const { data: clientData, error: clientError } = await supabase
            .from('pessoas')
            .select('nome, telefone, email')
            .eq('id', opportunity.cliente_id)
            .single();

        const { data: imovelData, error: imovelError } = await supabase
            .from('imoveis')
            .select('codigo, logradouro, numero, bairro, dados_valores')
            .eq('id', opportunity.imovel_id)
            .single();

        if (clientError || imovelError || !clientData || !imovelData) {
            console.error('Erro ao buscar detalhes para proposta:', clientError, imovelError);
            setError('Não foi possível carregar os detalhes do cliente ou imóvel.');
            setIsLoadingDetails(false);
            return;
        }
        
        // Buscar propostas existentes para esta oportunidade
        const { data: proposalsData, error: proposalsError } = await supabase
            .from('propostas')
            .select('*')
            .eq('oportunidade_id', opportunity.id!)
            .order('created_at', { ascending: false });

        if (proposalsError) {
            console.error('Erro ao buscar propostas existentes:', proposalsError);
            setError('Não foi possível carregar propostas anteriores.');
        } else {
            setExistingProposals(proposalsData as Proposal[]);
        }

        setFormData(prev => ({
            ...prev,
            oportunidade_id: opportunity.id!,
            cliente_id: opportunity.cliente_id!,
            imovel_id: opportunity.imovel_id!,
            valor_proposto: opportunity.valor_estimado || imovelData.dados_valores.valor_venda || imovelData.dados_valores.valor_locacao || 0,
            clientes: clientData,
            imoveis: imovelData,
        }));
        setIsLoadingDetails(false);
    }, [session, opportunity]);

    useEffect(() => {
        if (isOpen) {
            fetchOpportunityDetails();
        }
    }, [isOpen, fetchOpportunityDetails]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => {
            let newValue: any = value;
            if (type === 'number' || id === 'valor_proposto') {
                newValue = value === '' ? 0 : parseFloat(value);
            }
            return { ...prev, [id]: newValue };
        });
        setError(null);
    };
    
    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setFormData(prev => ({ ...prev, status: e.target.value as ProposalStatus }));
        setError(null);
    };

    const validate = () => {
        const errors: string[] = [];
        if (formData.valor_proposto <= 0) errors.push('O valor proposto deve ser maior que zero.');
        if (!formData.data_validade) errors.push('A data de validade é obrigatória.');
        
        if (errors.length > 0) {
            setError(errors.join(' '));
            return false;
        }
        setError(null);
        return true;
    };

    const handleSaveProposal = useCallback(async () => {
        if (!session || !validate()) return;

        setIsSaving(true);
        
        const dataToSave = {
            user_id: session.user.id,
            oportunidade_id: formData.oportunidade_id,
            cliente_id: formData.cliente_id,
            imovel_id: formData.imovel_id,
            valor_proposto: formData.valor_proposto,
            condicoes_pagamento: formData.condicoes_pagamento?.trim() || null,
            data_validade: formData.data_validade,
            status: formData.status,
            arquivo_url: formData.arquivo_url, // Pode ser atualizado após a geração do PDF
        };

        let result;
        if (formData.id) {
            result = await supabase
                .from('propostas')
                .update(dataToSave)
                .eq('id', formData.id)
                .select('id')
                .single();
        } else {
            result = await supabase
                .from('propostas')
                .insert(dataToSave)
                .select('id')
                .single();
        }

        setIsSaving(false);

        if (result.error) {
            console.error('Erro ao salvar proposta:', result.error);
            setError(`Erro ao salvar: ${result.error.message}`);
        } else {
            alert('Proposta salva com sucesso!');
            onSaveSuccess();
            fetchOpportunityDetails(); // Recarrega a lista de propostas
        }
    }, [session, formData, onSaveSuccess, validate, fetchOpportunityDetails]);

    const handleGeneratePDF = useCallback(() => {
        if (!formData.clientes || !formData.imoveis) {
            alert('Não foi possível gerar o PDF: dados do cliente ou imóvel ausentes.');
            return;
        }

        const doc = new jsPDF();
        doc.setFontSize(18);
        doc.text("Proposta de Imóvel - Imperial Paris", 14, 22);
        doc.setFontSize(12);
        doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 14, 30);
        doc.text(`Validade: ${new Date(formData.data_validade).toLocaleDateString('pt-BR')}`, 14, 36);

        doc.setFontSize(14);
        doc.text("Dados do Cliente:", 14, 48);
        doc.setFontSize(12);
        doc.text(`Nome: ${formData.clientes.nome}`, 14, 56);
        doc.text(`Telefone: ${formData.clientes.telefone}`, 14, 62);
        doc.text(`Email: ${formData.clientes.email}`, 14, 68);

        doc.setFontSize(14);
        doc.text("Dados do Imóvel:", 14, 80);
        doc.setFontSize(12);
        doc.text(`Código: ${formData.imoveis.codigo}`, 14, 88);
        doc.text(`Endereço: ${formData.imoveis.logradouro}, ${formData.imoveis.numero} - ${formData.imoveis.bairro}`, 14, 94);
        doc.text(`Valor de Venda (Base): ${formData.imoveis.dados_valores.valor_venda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, 100);
        doc.text(`Valor de Locação (Base): ${formData.imoveis.dados_valores.valor_locacao.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, 106);

        doc.setFontSize(14);
        doc.text("Detalhes da Proposta:", 14, 118);
        doc.setFontSize(12);
        doc.text(`Valor Proposto: ${formData.valor_proposto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}`, 14, 126);
        doc.text(`Condições de Pagamento: ${formData.condicoes_pagamento || 'A combinar'}`, 14, 132);

        doc.save(`proposta_${formData.imoveis.codigo}_${formData.clientes.nome}.pdf`);
        alert('PDF da proposta gerado com sucesso! (Simulação)');
    }, [formData]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark-text flex items-center">
                        <FileText className="w-5 h-5 mr-2" /> Gerar Proposta para {opportunity.nome}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {isLoadingDetails ? (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                        <p className="text-gray-600">Carregando detalhes...</p>
                    </div>
                ) : error ? (
                    <div className="p-6 text-red-600 text-sm">{error}</div>
                ) : (
                    <div className="p-6 space-y-6">
                        <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                            <p className="text-sm font-semibold text-blue-800">Cliente: {formData.clientes?.nome || 'N/A'}</p>
                            <p className="text-xs text-blue-700">Imóvel: {formData.imoveis?.codigo || 'N/A'}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <NumberInput 
                                label="Valor Proposto" 
                                id="valor_proposto" 
                                isCurrency
                                value={formData.valor_proposto} 
                                onChange={handleChange} 
                                placeholder="R$ 0,00"
                                required
                            />
                            <TextInput 
                                label="Data de Validade" 
                                id="data_validade" 
                                type="date"
                                value={formData.data_validade} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                        
                        <div className="space-y-2">
                            <label htmlFor="condicoes_pagamento" className="block text-sm font-medium text-light-text">Condições de Pagamento</label>
                            <textarea 
                                id="condicoes_pagamento" 
                                rows={4} 
                                value={formData.condicoes_pagamento || ''}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                            ></textarea>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="status" className="block text-sm font-medium text-light-text">Status da Proposta</label>
                            <select 
                                id="status" 
                                value={formData.status} 
                                onChange={handleStatusChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                            >
                                <option value="Rascunho">Rascunho</option>
                                <option value="Enviada">Enviada</option>
                                <option value="Aceita">Aceita</option>
                                <option value="Recusada">Recusada</option>
                            </select>
                        </div>

                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
                            <Button 
                                variant="outline" 
                                onClick={handleGeneratePDF}
                                disabled={!formData.clientes || !formData.imoveis}
                            >
                                <Printer className="w-4 h-4 mr-2" /> Gerar PDF
                            </Button>
                            <Button onClick={handleSaveProposal} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Salvar Proposta
                            </Button>
                        </div>

                        {/* Histórico de Propostas */}
                        <div className="space-y-3 mt-6">
                            <h3 className="text-lg font-semibold text-dark-text">Propostas Anteriores ({existingProposals.length})</h3>
                            {existingProposals.length === 0 ? (
                                <p className="text-sm text-gray-500">Nenhuma proposta anterior para esta oportunidade.</p>
                            ) : (
                                <div className="space-y-2">
                                    {existingProposals.map(proposal => (
                                        <div key={proposal.id} className="p-3 bg-white rounded-md border border-gray-200 flex justify-between items-center">
                                            <div>
                                                <p className="font-semibold text-dark-text flex items-center">
                                                    <FileText className="w-4 h-4 mr-2 text-gray-500" />
                                                    Proposta de {proposal.valor_proposto.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </p>
                                                <p className="text-sm text-light-text mt-1">
                                                    Status: {proposal.status} | Validade: {new Date(proposal.data_validade).toLocaleDateString('pt-BR')}
                                                </p>
                                            </div>
                                            <Button variant="ghost" size="sm" title="Ver Detalhes (Mock)">
                                                <Eye className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProposalGeneratorModal;
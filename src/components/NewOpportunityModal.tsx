import React, { useState, useCallback, useEffect } from 'react';
import { X, Save, Loader2, TrendingUp, User, Home, DollarSign, Calendar } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import NumberInput from './NumberInput';
import PersonSelect from './PersonSelect';
import ImovelSelect from './ImovelSelect';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

// Tipos para a oportunidade
export type OpportunityStage = 'Novos Leads' | 'Em Atendimento' | 'Visita Agendada' | 'Em Negociação' | 'Proposta Enviada' | 'Venda Ganha' | 'Venda Perdida';

export interface Opportunity {
    id?: string; // Opcional para novas oportunidades
    nome: string;
    cliente_id: string | null;
    imovel_id: string | null;
    etapa: OpportunityStage;
    valor_estimado: number | null;
    data_fechamento_estimada: string | null; // Formato 'YYYY-MM-DD'
    observacoes: string | null;
    // Campos adicionais para display (vindos do join)
    clientes?: { nome: string } | null;
    imoveis?: { codigo: string, logradouro: string, numero: string, bairro: string } | null;
}

interface NewOpportunityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    initialOpportunity?: Opportunity | null; // Para edição
}

const initialFormData: Opportunity = {
    nome: '',
    cliente_id: null,
    imovel_id: null,
    etapa: 'Novos Leads',
    valor_estimado: null,
    data_fechamento_estimada: null,
    observacoes: null,
};

const NewOpportunityModal: React.FC<NewOpportunityModalProps> = ({ isOpen, onClose, onSaveSuccess, initialOpportunity }) => {
    const { session } = useAuth();
    const [formData, setFormData] = useState<Opportunity>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialOpportunity || initialFormData);
            setError(null);
        }
    }, [isOpen, initialOpportunity]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        setFormData(prev => {
            let newValue: any = value;
            if (type === 'number' || id === 'valor_estimado') {
                newValue = value === '' ? null : parseFloat(value);
            } else if (id === 'imovel_id' && value === '') { // Permitir deselecionar imóvel
                newValue = null;
            }
            return { ...prev, [id]: newValue };
        });
        setError(null);
    };
    
    const handlePersonSelectChange = (personId: string) => {
        setFormData(prev => ({ ...prev, cliente_id: personId }));
        setError(null);
    };
    
    const handleImovelSelectChange = (imovelId: string) => {
        setFormData(prev => ({ ...prev, imovel_id: imovelId }));
        setError(null);
    };

    const validate = () => {
        const errors: string[] = [];
        if (!formData.nome.trim()) errors.push('O nome da oportunidade é obrigatório.');
        if (!formData.cliente_id) errors.push('O cliente é obrigatório.');
        
        if (errors.length > 0) {
            setError(errors.join(' '));
            return false;
        }
        setError(null);
        return true;
    };

    const handleSave = useCallback(async () => {
        if (!session || !validate()) return;

        setIsSaving(true);
        
        const dataToSave = {
            user_id: session.user.id,
            nome: formData.nome.trim(),
            cliente_id: formData.cliente_id,
            imovel_id: formData.imovel_id || null,
            etapa: formData.etapa,
            valor_estimado: formData.valor_estimado,
            data_fechamento_estimada: formData.data_fechamento_estimada,
            observacoes: formData.observacoes?.trim() || null,
        };

        let result;
        if (formData.id) {
            // Atualizar oportunidade existente
            result = await supabase
                .from('oportunidades')
                .update(dataToSave)
                .eq('id', formData.id)
                .select('id')
                .single();
        } else {
            // Inserir nova oportunidade
            result = await supabase
                .from('oportunidades')
                .insert(dataToSave)
                .select('id')
                .single();
        }

        setIsSaving(false);

        if (result.error) {
            console.error('Erro ao salvar oportunidade:', result.error);
            setError(`Erro ao salvar: ${result.error.message}`);
        } else {
            onSaveSuccess();
            setFormData(initialFormData); // Resetar formulário
            onClose();
        }
    }, [session, formData, onClose, onSaveSuccess, validate]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark-text flex items-center">
                        <TrendingUp className="w-5 h-5 mr-2" /> {initialOpportunity ? 'Editar Oportunidade' : 'Nova Oportunidade'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}
                    
                    <TextInput 
                        label="Nome da Oportunidade" 
                        id="nome" 
                        value={formData.nome} 
                        onChange={handleChange} 
                        placeholder="Ex: Venda Apartamento Centro - João Silva"
                        required
                    />
                    
                    <PersonSelect 
                        label="Cliente" 
                        id="cliente_id" 
                        value={formData.cliente_id || ''} 
                        onChange={handlePersonSelectChange} 
                        required
                        showNewButton
                    />
                    
                    <ImovelSelect 
                        label="Imóvel Associado (Opcional)" 
                        id="imovel_id" 
                        value={formData.imovel_id || ''} 
                        onChange={handleImovelSelectChange} 
                        placeholder="Selecione um imóvel ou deixe em branco"
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput 
                            label="Valor Estimado" 
                            id="valor_estimado" 
                            isCurrency
                            value={formData.valor_estimado || ''} 
                            onChange={handleChange} 
                            placeholder="R$ 0,00"
                        />
                        <TextInput 
                            label="Data de Fechamento Estimada" 
                            id="data_fechamento_estimada" 
                            type="date"
                            value={formData.data_fechamento_estimada || ''} 
                            onChange={handleChange} 
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <label htmlFor="observacoes" className="block text-sm font-medium text-light-text">Observações</label>
                        <textarea 
                            id="observacoes" 
                            rows={3} 
                            value={formData.observacoes || ''}
                            onChange={handleChange}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                        ></textarea>
                    </div>
                </div>

                {/* Footer de Ações */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Oportunidade
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NewOpportunityModal;
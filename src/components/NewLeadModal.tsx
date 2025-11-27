import React, { useState, useCallback, useEffect } from 'react';
import { X, Save, Loader2, Zap, User, Phone, Mail, MessageSquare } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import UserSelect from './UserSelect';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { LeadInput, LeadStatus, LeadSource } from '../../types';
import { Label } from './ui/Label';
import { RadioGroup, RadioGroupItem } from './ui/RadioGroup';

interface NewLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: () => void;
    initialLead?: LeadInput | null; // Para edição
}

const initialFormData: LeadInput = {
    nome: '',
    telefone: '',
    email: '',
    origem: '',
    responsavel_id: null,
    observacoes: null,
    status: 'Novo',
};

const leadSources: LeadSource[] = ['Indicação', 'Site', 'Instagram', 'WhatsApp', 'Portal Imobiliário', 'Outro'];
const leadStatuses: LeadStatus[] = ['Novo', 'Contatado', 'Qualificado', 'Desqualificado'];

const NewLeadModal: React.FC<NewLeadModalProps> = ({ isOpen, onClose, onSaveSuccess, initialLead }) => {
    const { session } = useAuth();
    const [formData, setFormData] = useState<LeadInput>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            setFormData(initialLead || initialFormData);
            setError(null);
        }
    }, [isOpen, initialLead]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        setError(null);
    };
    
    const handleUserSelectChange = (userId: string) => {
        setFormData(prev => ({ ...prev, responsavel_id: userId }));
        setError(null);
    };
    
    const handleStatusChange = (value: LeadStatus) => {
        setFormData(prev => ({ ...prev, status: value }));
        setError(null);
    };

    const validate = () => {
        const errors: string[] = [];
        if (!formData.nome.trim()) errors.push('O nome é obrigatório.');
        if (!formData.telefone.trim() && !formData.email?.trim()) errors.push('Telefone ou E-mail é obrigatório.');
        
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
            telefone: formData.telefone.replace(/\D/g, '').trim() || null,
            email: formData.email?.trim() || null,
            origem: formData.origem || null,
            responsavel_id: formData.responsavel_id,
            observacoes: formData.observacoes?.trim() || null,
            status: formData.status,
        };

        let result;
        if (formData.id) {
            // Atualizar lead existente
            result = await supabase
                .from('leads')
                .update(dataToSave)
                .eq('id', formData.id)
                .select('id')
                .single();
        } else {
            // Inserir novo lead
            result = await supabase
                .from('leads')
                .insert(dataToSave)
                .select('id')
                .single();
        }

        setIsSaving(false);

        if (result.error) {
            console.error('Erro ao salvar lead:', result.error);
            setError(`Erro ao salvar: ${result.error.message}`);
        } else {
            alert(`Lead ${formData.id ? 'atualizado' : 'salvo'} com sucesso!`);
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
                        <Zap className="w-5 h-5 mr-2 text-primary-orange" /> {initialLead ? 'Editar Lead' : 'Novo Lead'}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}
                    
                    <TextInput 
                        label="Nome" 
                        id="nome" 
                        value={formData.nome} 
                        onChange={handleChange} 
                        placeholder="Nome do Lead"
                        required
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput 
                            label="Telefone" 
                            id="telefone" 
                            value={formData.telefone} 
                            onChange={handleChange} 
                            placeholder="(53) 99999-9999"
                        />
                        <TextInput 
                            label="E-mail" 
                            id="email" 
                            type="email"
                            value={formData.email || ''} 
                            onChange={handleChange} 
                            placeholder="email@exemplo.com"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="origem" className="block text-sm font-medium text-light-text">Origem</Label>
                            <select 
                                id="origem" 
                                value={formData.origem} 
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                            >
                                <option value="">Selecione a origem</option>
                                {leadSources.map(source => <option key={source} value={source}>{source}</option>)}
                            </select>
                        </div>
                        
                        <UserSelect 
                            label="Corretor Responsável" 
                            id="responsavel_id" 
                            value={formData.responsavel_id || ''} 
                            onChange={handleUserSelectChange} 
                            placeholder="Selecione o responsável"
                        />
                    </div>
                    
                    <div className="space-y-2">
                        <Label className="text-sm font-medium text-light-text">Status Inicial</Label>
                        <RadioGroup 
                            value={formData.status} 
                            onValueChange={(value: LeadStatus) => handleStatusChange(value)}
                            className="flex flex-wrap gap-4"
                        >
                            {leadStatuses.map(status => (
                                <div key={status} className="flex items-center space-x-2">
                                    <RadioGroupItem value={status} id={status} />
                                    <Label htmlFor={status}>{status}</Label>
                                </div>
                            ))}
                        </RadioGroup>
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
                        Salvar Lead
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NewLeadModal;
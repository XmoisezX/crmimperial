import React, { useState, useCallback } from 'react';
import { X, Save, Loader2, User } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

interface NewPersonModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: (personId: string, name: string) => void;
}

interface PersonFormData {
    tipo_cadastro: 'PF' | 'PJ';
    nome: string;
    nome_social: string;
    cpf_cnpj: string;
    email: string;
    telefone: string;
}

const initialFormData: PersonFormData = {
    tipo_cadastro: 'PF',
    nome: '',
    nome_social: '',
    cpf_cnpj: '',
    email: '',
    telefone: '',
};

const NewPersonModal: React.FC<NewPersonModalProps> = ({ isOpen, onClose, onSaveSuccess }) => {
    const { session } = useAuth();
    const [formData, setFormData] = useState<PersonFormData>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    const handleRadioChange = (value: 'PF' | 'PJ') => {
        setFormData(prev => ({ ...prev, tipo_cadastro: value }));
    };

    const validate = () => {
        const errors: string[] = [];
        if (!formData.nome.trim()) errors.push('Nome é obrigatório.');
        if (!formData.telefone.trim()) errors.push('Telefone é obrigatório.');
        if (formData.tipo_cadastro === 'PF' && !formData.cpf_cnpj.trim()) errors.push('CPF é obrigatório para PF.');
        if (formData.tipo_cadastro === 'PJ' && !formData.cpf_cnpj.trim()) errors.push('CNPJ é obrigatório para PJ.');
        
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
        
        const dataToInsert = {
            user_id: session.user.id,
            tipo_cadastro: formData.tipo_cadastro,
            nome: formData.nome.trim(),
            nome_social: formData.nome_social.trim() || null,
            cpf_cnpj: formData.cpf_cnpj.replace(/\D/g, '').trim() || null,
            email: formData.email.trim() || null,
            telefone: formData.telefone.replace(/\D/g, '').trim(),
        };

        const { data, error: insertError } = await supabase
            .from('pessoas')
            .insert(dataToInsert)
            .select('id, nome')
            .single();

        setIsSaving(false);

        if (insertError) {
            console.error('Erro ao salvar pessoa:', insertError);
            setError(`Erro ao salvar: ${insertError.message}`);
        } else {
            onSaveSuccess(data.id, data.nome);
            setFormData(initialFormData);
            onClose();
        }
    }, [session, formData, onClose, onSaveSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark-text flex items-center"><User className="w-5 h-5 mr-2" /> Novo Cadastro</h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-4">
                    {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}
                    
                    <div className="space-y-2">
                        <h3 className="text-sm font-medium text-light-text">Tipo de cadastro <span className="text-red-500">*</span></h3>
                        <div className="flex space-x-4">
                            <label className="flex items-center space-x-2 text-sm">
                                <input type="radio" name="tipo_cadastro" checked={formData.tipo_cadastro === 'PF'} onChange={() => handleRadioChange('PF')} className="text-blue-600" />
                                <span>PF</span>
                            </label>
                            <label className="flex items-center space-x-2 text-sm">
                                <input type="radio" name="tipo_cadastro" checked={formData.tipo_cadastro === 'PJ'} onChange={() => handleRadioChange('PJ')} className="text-blue-600" />
                                <span>PJ</span>
                            </label>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput 
                            label={<span>Nome <span className="text-red-500">*</span></span>} 
                            id="nome" 
                            value={formData.nome} 
                            onChange={handleChange} 
                            placeholder="Nome completo"
                        />
                        <TextInput 
                            label="Nome Social" 
                            id="nome_social" 
                            value={formData.nome_social} 
                            onChange={handleChange} 
                            placeholder="Nome Social"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput 
                            label={<span>{formData.tipo_cadastro === 'PF' ? 'CPF' : 'CNPJ'} <span className="text-red-500">*</span></span>} 
                            id="cpf_cnpj" 
                            value={formData.cpf_cnpj} 
                            onChange={handleChange} 
                            placeholder={formData.tipo_cadastro === 'PF' ? '999.999.999-99' : '99.999.999/9999-99'}
                        />
                        <TextInput 
                            label="Email" 
                            id="email" 
                            type="email"
                            value={formData.email} 
                            onChange={handleChange} 
                            placeholder="exemplo@exemplo.com"
                        />
                    </div>
                    
                    <TextInput 
                        label={<span>Telefone <span className="text-red-500">*</span></span>} 
                        id="telefone" 
                        value={formData.telefone} 
                        onChange={handleChange} 
                        placeholder="(53) 99999-9999"
                    />
                </div>

                {/* Footer de Ações */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NewPersonModal;
import React, { useState, useCallback, useEffect } from 'react';
import { X, Save, Loader2, Key, AlertTriangle } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import { supabase } from '../integrations/supabase/client';
import { KeyListingData, WithdrawalFormData, WithdrawalType, WithdrawalReason, KeyStatus } from '../../types';
import { RadioGroup, RadioGroupItem } from './ui/RadioGroup';
import { Label } from './ui/Label';
import { Checkbox } from './ui/Checkbox';
import { useAuth } from '../contexts/AuthContext';

interface KeyWithdrawalModalProps {
    isOpen: boolean;
    onClose: () => void;
    keyData: KeyListingData | null;
    onSaveSuccess: () => void;
}

const initialFormData: WithdrawalFormData = {
    tipo_retirada: 'Temporária',
    motivo: 'Visita',
    retirada_por: '',
    previsao_entrega: new Date().toISOString().split('T')[0],
    hora_entrega: '17:00',
    imprimir_termo: true,
};

const withdrawalTypes: WithdrawalType[] = ['Temporária', 'Definitiva'];
const withdrawalReasons: WithdrawalReason[] = ['Visita', 'Vistoria', 'Manutenção'];

const KeyWithdrawalModal: React.FC<KeyWithdrawalModalProps> = ({ isOpen, onClose, keyData, onSaveSuccess }) => {
    const { session } = useAuth();
    const [formData, setFormData] = useState<WithdrawalFormData>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            // Reset form data on open, but keep today's date and default time
            setFormData({
                ...initialFormData,
                previsao_entrega: new Date().toISOString().split('T')[0],
            });
            setError(null);
        }
    }, [isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };
    
    const handleRadioChange = (name: keyof WithdrawalFormData, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value }));
    };
    
    const handleCheckboxChange = (checked: boolean) => {
        setFormData(prev => ({ ...prev, imprimir_termo: checked }));
    };

    const validate = () => {
        const errors: string[] = [];
        if (!formData.retirada_por.trim()) errors.push('Quem retirou é obrigatório.');
        if (!formData.previsao_entrega) errors.push('Previsão de entrega é obrigatória.');
        if (!formData.hora_entrega) errors.push('Hora é obrigatória.');
        
        if (errors.length > 0) {
            setError(errors.join(' '));
            return false;
        }
        setError(null);
        return true;
    };

    const handleSave = useCallback(async () => {
        if (!session || !keyData || !validate()) return;

        setIsSaving(true);
        
        // 1. Determinar o novo status
        const newStatus: KeyStatus = 'Retirada';
        
        // 2. Dados para atualização
        const dataToUpdate = {
            status: newStatus,
            retirada_por: formData.retirada_por.trim(),
            tipo_retirada: formData.tipo_retirada,
            motivo: formData.motivo,
            previsao_entrega: formData.previsao_entrega,
            hora_entrega: formData.hora_entrega,
            // agencia is already set on creation, no need to update unless necessary
        };

        const { error: updateError } = await supabase
            .from('imovel_chaves')
            .update(dataToUpdate)
            .eq('id', keyData.id)
            .eq('user_id', session.user.id);

        setIsSaving(false);

        if (updateError) {
            console.error('Erro ao registrar retirada:', updateError);
            setError(`Erro ao salvar: ${updateError.message}`);
        } else {
            if (formData.imprimir_termo) {
                alert('Retirada registrada! (Termo de empréstimo simulado para impressão)');
            } else {
                alert('Retirada registrada com sucesso!');
            }
            onSaveSuccess();
            onClose();
        }
    }, [session, keyData, formData, onClose, onSaveSuccess, validate]);

    if (!isOpen || !keyData) return null;
    
    const imovelAddress = keyData.imoveis 
        ? `${keyData.imoveis.logradouro}, ${keyData.imoveis.numero} - ${keyData.imoveis.bairro}`
        : 'Imóvel não encontrado';

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark-text flex items-center">
                        <Key className="w-5 h-5 mr-2 text-primary-orange" /> Retirada de Chave: {keyData.codigo_chave}
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-sm font-semibold text-blue-800">Imóvel: {keyData.imoveis?.codigo || 'N/A'}</p>
                        <p className="text-xs text-blue-700">{imovelAddress}</p>
                    </div>
                    
                    {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md flex items-center"><AlertTriangle className="w-4 h-4 mr-2" /> {error}</div>}
                    
                    {/* Tipo de Retirada */}
                    <div className="space-y-2">
                        <Label htmlFor="tipo_retirada" className="text-sm font-medium text-light-text">Tipo de Retirada</Label>
                        <RadioGroup 
                            id="tipo_retirada" 
                            value={formData.tipo_retirada} 
                            onValueChange={(value) => handleRadioChange('tipo_retirada', value)}
                            className="flex space-x-4"
                        >
                            {withdrawalTypes.map(type => (
                                <div key={type} className="flex items-center space-x-2">
                                    <RadioGroupItem value={type} id={type} />
                                    <Label htmlFor={type}>{type}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                    
                    {/* Motivo */}
                    <div className="space-y-2">
                        <Label htmlFor="motivo" className="text-sm font-medium text-light-text">Motivo</Label>
                        <RadioGroup 
                            id="motivo" 
                            value={formData.motivo} 
                            onValueChange={(value) => handleRadioChange('motivo', value)}
                            className="flex space-x-4"
                        >
                            {withdrawalReasons.map(reason => (
                                <div key={reason} className="flex items-center space-x-2">
                                    <RadioGroupItem value={reason} id={reason} />
                                    <Label htmlFor={reason}>{reason}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </div>
                    
                    {/* Quem Retirou (Mock Autocomplete com TextInput) */}
                    <TextInput 
                        label="Quem retirou (Nome, CPF ou Telefone)" 
                        id="retirada_por" 
                        value={formData.retirada_por} 
                        onChange={handleChange} 
                        placeholder="Busque por nome ou documento"
                        required
                    />
                    
                    {/* Previsão de Entrega e Hora */}
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput 
                            label="Previsão de Entrega" 
                            id="previsao_entrega" 
                            type="date"
                            value={formData.previsao_entrega} 
                            onChange={handleChange} 
                            required
                        />
                        <TextInput 
                            label="Hora" 
                            id="hora_entrega" 
                            type="time"
                            value={formData.hora_entrega} 
                            onChange={handleChange} 
                            required
                        />
                    </div>
                    
                    {/* Checkbox Termo */}
                    <div className="flex items-center space-x-2 pt-4 border-t border-gray-100">
                        <Checkbox 
                            id="imprimir_termo" 
                            checked={formData.imprimir_termo} 
                            onCheckedChange={handleCheckboxChange}
                            className="w-5 h-5 text-blue-600 border-gray-400"
                        />
                        <Label htmlFor="imprimir_termo" className="text-sm font-medium text-dark-text">
                            Imprimir termo de empréstimo de chaves
                        </Label>
                    </div>
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

export default KeyWithdrawalModal;
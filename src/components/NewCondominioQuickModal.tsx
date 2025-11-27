import React, { useState, useCallback, useEffect } from 'react';
import { X, Save, Loader2, Building2, MapPin } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import NumberInput from '../components/NumberInput';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { useCepLookup } from '../../hooks/useCepLookup';

interface NewCondominioQuickModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSaveSuccess: (condominioId: string, name: string) => void;
}

interface CondominioQuickFormData {
    nome: string;
    fechado: 'Sim' | 'Não';
    tipo_condominio: 'Vertical' | 'Horizontal' | 'Misto' | '';
    cep: string;
    andares: number;
    estado: string;
    cidade: string;
    bairro: string;
    logradouro: string;
    numero: string;
    referencia: string;
}

const initialFormData: CondominioQuickFormData = {
    nome: '',
    fechado: 'Não',
    tipo_condominio: '',
    cep: '',
    andares: 0,
    estado: 'RS',
    cidade: 'Pelotas',
    bairro: '',
    logradouro: '',
    numero: '',
    referencia: '',
};

const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas'];

const NewCondominioQuickModal: React.FC<NewCondominioQuickModalProps> = ({ isOpen, onClose, onSaveSuccess }) => {
    const { session } = useAuth();
    const [formData, setFormData] = useState<CondominioQuickFormData>(initialFormData);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    const { data: cepData, lookup: lookupCep, loading: cepLoading, error: cepError } = useCepLookup();

    useEffect(() => {
        if (cepData) {
            setFormData(prev => ({
                ...prev,
                logradouro: cepData.logradouro || prev.logradouro,
                bairro: cepData.bairro || prev.bairro,
                cidade: cepData.localidade || prev.cidade,
                estado: cepData.uf || prev.estado,
                cep: cepData.cep || prev.cep,
            }));
        }
    }, [cepData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target;
        
        setFormData(prev => {
            let newValue: any = value;
            if (type === 'number') {
                newValue = value === '' ? 0 : parseFloat(value);
            }
            return { ...prev, [id]: newValue };
        });
        setError(null);
    };
    
    const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const cep = e.target.value;
        handleChange(e);
        
        if (cep.replace(/\D/g, '').length === 8) {
            lookupCep(cep);
        }
    };

    const validate = () => {
        const errors: string[] = [];
        if (!formData.nome.trim()) errors.push('Nome é obrigatório.');
        if (!formData.tipo_condominio) errors.push('Tipo de condomínio é obrigatório.');
        if (formData.cep.replace(/\D/g, '').length !== 8) errors.push('CEP inválido.');
        if (!formData.logradouro.trim()) errors.push('Logradouro é obrigatório.');
        if (!formData.numero.trim()) errors.push('Número é obrigatório.');
        
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
        
        // Mapeamento dos dados para a tabela 'condominios'
        const dataToInsert = {
            user_id: session.user.id,
            nome: formData.nome.trim(),
            ficha: formData.fechado === 'Sim', // Usando 'ficha' como proxy para 'fechado' (mock)
            loteamento: formData.tipo_condominio === 'Horizontal', // Usando 'loteamento' como proxy para tipo (mock)
            
            // Localização
            cep: formData.cep.replace(/\D/g, '').trim(),
            endereco: formData.logradouro.trim(),
            numero: formData.numero.trim(),
            cidade: formData.cidade.trim(),
            estado: formData.estado.trim(),
            bairro: formData.bairro.trim(),
            referencia: formData.referencia.trim() || null,
            
            // Outros campos obrigatórios (mockados ou nulos)
            area_terreno_m2: 0,
            ano_termino: new Date().getFullYear(),
            arquitetura: 'Não informado',
            descricao: `Condomínio ${formData.nome} - Cadastro Rápido.`,
            // Removido 'estagio' daqui
        };

        // 1. Inserir Condomínio
        const { data: insertedCondominio, error: condominioError } = await supabase
            .from('condominios')
            .insert(dataToInsert)
            .select('id, nome')
            .single();

        if (condominioError) {
            console.error('Erro ao salvar condomínio:', condominioError);
            setError(`Erro ao salvar: ${condominioError.message}`);
            setIsSaving(false);
            return;
        }
        
        const condominioId = insertedCondominio.id;
        
        // 2. Inserir Estágio da Obra na tabela relacionada (condominio_obra)
        const obraData = {
            condominio_id: condominioId,
            estagio: formData.tipo_condominio === 'Vertical' ? 'Na planta' : 'Pronto', // Define um estágio inicial baseado no tipo
            destaque_obra: false,
            percentual_projeto: 0,
            percentual_terraplanagem: 0,
            percentual_fundacao: 0,
            percentual_estrutura: 0,
            percentual_alvenaria: 0,
            percentual_instalacoes: 0,
            percentual_acabamento: 0,
            percentual_paisagismo: 0,
        };
        
        const { error: obraError } = await supabase
            .from('condominio_obra')
            .insert(obraData);
            
        if (obraError) {
            console.error('Aviso: Erro ao salvar dados da obra:', obraError);
            // Não impedimos o sucesso, mas alertamos sobre o problema
        }

        setIsSaving(false);
        onSaveSuccess(condominioId, insertedCondominio.nome);
        setFormData(initialFormData);
        onClose();
        
    }, [session, formData, onClose, onSaveSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark-text flex items-center"><Building2 className="w-5 h-5 mr-2" /> Novo Condomínio (Rápido)</h2>
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
                        placeholder="Digite o nome do condomínio"
                    />
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Fechado</label>
                            <div className="flex space-x-4">
                                <label className="flex items-center space-x-2 text-sm">
                                    <input type="radio" name="fechado" checked={formData.fechado === 'Sim'} onChange={() => setFormData(prev => ({ ...prev, fechado: 'Sim' }))} className="text-blue-600" />
                                    <span>Sim</span>
                                </label>
                                <label className="flex items-center space-x-2 text-sm">
                                    <input type="radio" name="fechado" checked={formData.fechado === 'Não'} onChange={() => setFormData(prev => ({ ...prev, fechado: 'Não' }))} className="text-blue-600" />
                                    <span>Não</span>
                                </label>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Tipo de condomínio</label>
                            <select 
                                id="tipo_condominio"
                                value={formData.tipo_condominio}
                                onChange={handleChange}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                            >
                                <option value="">Selecione o tipo</option>
                                <option value="Vertical">Vertical</option>
                                <option value="Horizontal">Horizontal</option>
                                <option value="Misto">Misto</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <TextInput 
                                label="CEP" 
                                id="cep" 
                                value={formData.cep} 
                                onChange={handleCepChange} 
                                placeholder="99999-999"
                                maxLength={9}
                            />
                            {cepLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500 absolute right-3 top-8" />}
                            {cepError && <p className="text-xs text-red-500 mt-1">Erro no CEP.</p>}
                        </div>
                        <NumberInput 
                            label="Andares" 
                            id="andares" 
                            value={formData.andares} 
                            onChange={handleChange} 
                            placeholder="Informe o número de andares"
                            min={0}
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Estado</label>
                            <select id="estado" value={formData.estado} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled>
                                <option value="RS">Rio Grande do Sul</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Cidade</label>
                            <select id="cidade" value={formData.cidade} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled>
                                <option value="Pelotas">Pelotas</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Bairro</label>
                            <select id="bairro" value={formData.bairro} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                                <option value="">Escolha o bairro</option>
                                {neighborhoods.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <TextInput 
                            label="Logradouro" 
                            id="logradouro" 
                            value={formData.logradouro} 
                            onChange={handleChange} 
                            placeholder="Informe o logradouro"
                        />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <TextInput 
                            label="Número" 
                            id="numero" 
                            value={formData.numero} 
                            onChange={handleChange} 
                            placeholder="Informe o número"
                        />
                        <TextInput 
                            label="Ponto de referência" 
                            id="referencia" 
                            value={formData.referencia} 
                            onChange={handleChange} 
                            placeholder="Ex.: Ao lado da igreja"
                        />
                    </div>
                </div>

                {/* Footer de Ações */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Condomínio
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default NewCondominioQuickModal;
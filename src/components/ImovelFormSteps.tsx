import React, { useCallback, useEffect, useState } from 'react';
import { Home, MapPin, DollarSign, Eye, Lock, Key, FileText, Image, List, CheckCircle, Zap, Loader2, Plus, Building2, Link as LinkIcon, Trash2, Edit } from 'lucide-react';
import { ImovelInput, VisibilidadeMapa, Ocupacao, ImovelImage, Permuta, TipoBemPermuta, TipoMovelPermuta, ImovelChave, ResponsavelChave } from '../../types';
import TextInput from './TextInput';
import NumberInput from './NumberInput';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import ToggleSwitch from './ToggleSwitch';
import ImageCard from './ImageCard';
import ActionsDropdown from './ActionsDropdown';
import PersonSelect from './PersonSelect';
import UserSelect from './UserSelect';
import MapDisplay from './MapDisplay';
import CondominioSelect from './CondominioSelect'; // Importando o novo componente

// --- Mock Data ---
const propertyTypes = [
    'Apartamento', 'Apartamento Garden', 'Box', 'Campo', 'Casa', 'Casa Comercial', 
    'Casa de Condomínio', 'Chácara', 'Cobertura', 'Conjunto Comercial', 'Duplex', 
    'Fazenda', 'Flat', 'Galpão', 'Geminado', 'Haras', 'Hotel', 'Kitnet', 'Loft', 
    'Loja', 'Pavilhão', 'Ponto Comercial', 'Pousada', 'Prédio Comercial', 
    'Prédio Residencial', 'Sala Comercial', 'Salão Comercial', 'Sobrado', 'Studio', 
    'Sítio', 'Terreno', 'Terreno Comercial', 'Triplex', 'Área Rural'
];
const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas'];
const motives = ['Vendido', 'Alugado', 'Retirado pelo proprietário'];
const indexOptions = ['IGP-M', 'IPCA', 'FIPE'];
const occupationOptions: Ocupacao[] = ['Desocupado', 'Ocupado', 'Locado'];
const floorOptions = ['Nenhum', 'Térreo', '1º Andar', '2º Andar', '3º Andar', '4º Andar']; // Adicionado 4º Andar
const orientationOptions = ['Norte', 'Sul', 'Leste', 'Oeste'];
const floorTypes = ['Aquecido', 'Carpete', 'Laminado', 'Tabuão', 'Ardósia', 'Cerâmico', 'Mármore', 'Usina', 'Associado', 'Flutuante', 'Parquet', 'Vinílico', 'Granito', 'Bruto', 'Porcelanato'];
const booleanOptions = ['Sim', 'Não'];
const conditionOptions = ['Em construção', 'Na planta', 'Novo', 'Usado'];
const approvalOptions = ['Aprovado', 'Não aprovado', 'Aguardando'];

const visibilidadeEnderecoOptions = [
    'Apenas estado',
    'Apenas o estado e a cidade',
    'Todas acima incluindo o bairro',
    'Todas acima incluindo logradouro',
    'Todas acima incluindo condomínio e subcondomínio',
    'Todos acima incluindo o número',
    'Todos acima incluindo o andar',
    'Todos acima incluindo o complemento',
];

// Opções para Tipo de Bem (Permuta)
const tipoBemOptions: TipoBemPermuta[] = ['Imóvel', 'Móvel'];
const tipoMovelOptions: TipoMovelPermuta[] = ['Automóvel', 'Motocicleta', 'Barco'];
const estadoOptions = ['RS', 'SC', 'PR', 'SP', 'MG', 'RJ', 'Outro']; // Mock de estados
const cidadeOptions = ['Pelotas', 'Rio Grande', 'Porto Alegre', 'Outra']; // Mock de cidades

// Opções para Responsável pela Chave (NOVO)
const responsavelChaveOptions: ResponsavelChave[] = [
    'Imobiliária', 'Agenciador', 'Proprietário', 'Corretor Externo', 
    'Familiar', 'Porteiro', 'Síndico', 'Zelador'
];

interface ImovelFormStepsProps {
    step: number;
    formData: ImovelInput;
    images: ImovelImage[];
    selectedImageIds: string[];
    isEditing: boolean;
    fileInputRef: React.RefObject<HTMLInputElement>;
    
    // Handlers de Input
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleCepChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRadioChange: (name: keyof ImovelInput, value: string) => void;
    handleToggleChange: (name: 'vis_venda' | 'vis_locacao' | 'vis_temporada' | 'vis_iptu' | 'vis_condominio', checked: boolean) => void; // Atualizado
    handleCheckboxGroupChange: (field: keyof ImovelInput, value: string | boolean) => void; // Atualizado para aceitar boolean
    handleFinalidadeToggle: (field: 'venda_ativo' | 'locacao_ativo' | 'temporada_ativo', checked: boolean) => void;
    handlePersonSelectChange: (id: keyof ImovelInput, personId: string) => void;
    
    // Handlers de Mídia
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleImageSelect: (id: string, isSelected: boolean) => void;
    handleLegendUpdate: (id: string, legend: string) => void;
    handleAction: (action: string) => void;
    handleSelectAll: (checked: boolean) => void;
    
    // Props de Geocodificação (Recebidas do pai)
    nominatimLocation: { lat: number, lng: number, display_name: string } | null;
    nominatimLoading: boolean;
    nominatimError: string | null;

    // NOVO: Setter de formData do componente pai
    setFormData: React.Dispatch<React.SetStateAction<ImovelInput | null>>;
}

const ImovelFormSteps: React.FC<ImovelFormStepsProps> = ({
    step,
    formData,
    images,
    selectedImageIds,
    isEditing,
    fileInputRef,
    handleInputChange,
    handleCepChange,
    handleRadioChange,
    handleToggleChange,
    handleCheckboxGroupChange,
    handleFinalidadeToggle,
    handlePersonSelectChange,
    handleFileSelect,
    handleImageSelect,
    handleLegendUpdate,
    handleAction,
    handleSelectAll,
    nominatimLocation,
    nominatimLoading,
    nominatimError,
    setFormData,
}) => {
    
    // --- Estado para a seção de Permutas ---
    const [showPermutaForm, setShowPermutaForm] = useState(false);
    const [currentPermuta, setCurrentPermuta] = useState<Permuta>({
        id: crypto.randomUUID(),
        tipo_bem: '',
        tipo_especifico: '',
        valor_minimo: null,
        valor_maximo: null,
        estado: '',
        cidade: '',
        bairros_condominios: '',
    });
    const [editingPermutaIndex, setEditingPermutaIndex] = useState<number | null>(null);
    
    // --- Estado para a seção de Chaves (NOVO) ---
    const [showChaveForm, setShowChaveForm] = useState(false);
    const [currentChave, setCurrentChave] = useState<ImovelChave>({
        id: crypto.randomUUID(),
        responsavel_tipo: '',
        codigo_chave: '',
        disponivel_emprestimo: true,
        nome_contato: '',
        telefone_contato: '',
        observacoes: '',
    });
    const [editingChaveIndex, setEditingChaveIndex] = useState<number | null>(null);

    // A lógica de geocodificação e CEP lookup foi movida para o componente pai.
    // Aqui, apenas usamos os resultados passados via props.
    
    const RequiredAsterisk = () => <span className="text-red-500 ml-1">*</span>;

    // Helper function to render radio groups
    const renderRadioGroup = (name: keyof ImovelInput, options: (string | number)[], required = false) => (
        <div className={`flex flex-wrap gap-4 ${!isEditing ? 'opacity-50 pointer-events-none' : ''}`}>
            {options.map((option, index) => (
                <label key={`${name}-${option}-${index}`} className="flex items-center space-x-2 text-sm">
                    <input 
                        type="radio" 
                        name={name} 
                        value={String(option)} 
                        checked={String(formData[name]) === String(option)}
                        onChange={() => handleRadioChange(name, String(option))}
                        className="text-blue-600 focus:ring-blue-500" 
                        required={required} 
                        disabled={!isEditing}
                    />
                    <span>{option}</span>
                </label>
            ))}
        </div>
    );
    
    // Helper function to render checkbox groups (for piso types)
    const renderPisoCheckboxGroup = (options: string[]) => (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {options.map(type => (
                <label key={type} className="flex items-center space-x-2 text-sm">
                    <Checkbox 
                        id={`piso-${type}`} 
                        checked={formData.tipos_piso.includes(type)}
                        onCheckedChange={(checked) => handleCheckboxGroupChange('tipos_piso', type)}
                        disabled={!isEditing}
                    />
                    <span>{type}</span>
                </label>
            ))}
        </div>
    );
    
    const isAddressValid = formData.cep.replace(/\D/g, '').length === 8 && formData.bairro && formData.logradouro && formData.numero;
    const fullAddress = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}`;

    // --- Handlers de Permuta ---
    const handlePermutaInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value, type } = e.target;
        setCurrentPermuta(prev => {
            let newValue: any = value;
            if (type === 'number' || id.includes('valor')) {
                newValue = value === '' ? null : parseFloat(value);
            }
            return { ...prev, [id]: newValue };
        });
    }, []);

    const handleAddPermuta = useCallback(() => {
        if (!isEditing) return;
        // Validação básica da permuta
        if (!currentPermuta.tipo_bem || !currentPermuta.tipo_especifico) {
            alert('Por favor, preencha o tipo de bem e o tipo específico da permuta.');
            return;
        }

        setFormData(prev => {
            if (!prev) return null; // Adicionado para lidar com prev nulo
            const updatedPermutas = editingPermutaIndex !== null
                ? prev.permutas.map((p, idx) => idx === editingPermutaIndex ? currentPermuta : p)
                : [...prev.permutas, currentPermuta];
            return { ...prev, permutas: updatedPermutas };
        });

        // Resetar formulário de permuta
        setCurrentPermuta({
            id: crypto.randomUUID(),
            tipo_bem: '',
            tipo_especifico: '',
            valor_minimo: null,
            valor_maximo: null,
            estado: '',
            cidade: '',
            bairros_condominios: '',
        });
        setEditingPermutaIndex(null);
        setShowPermutaForm(false);
    }, [currentPermuta, editingPermutaIndex, isEditing, setFormData]);

    const handleEditPermuta = useCallback((index: number) => {
        if (!isEditing) return;
        setCurrentPermuta({ ...formData.permutas[index] });
        setEditingPermutaIndex(index);
        setShowPermutaForm(true);
    }, [formData.permutas, isEditing]);

    const handleDeletePermuta = useCallback((id: string) => {
        if (!isEditing) return;
        if (window.confirm('Tem certeza que deseja remover esta permuta?')) {
            setFormData(prev => {
                if (!prev) return null; // Adicionado para lidar com prev nulo
                return {
                    ...prev,
                    permutas: prev.permutas.filter(p => p.id !== id),
                };
            });
            // Se a permuta sendo editada for a excluída, reseta o formulário
            if (currentPermuta.id === id) {
                setShowPermutaForm(false);
                setCurrentPermuta({
                    id: crypto.randomUUID(), tipo_bem: '', tipo_especifico: '', valor_minimo: null, valor_maximo: null, estado: '', cidade: '', bairros_condominios: '',
                });
                setEditingPermutaIndex(null);
            }
        }
    }, [currentPermuta.id, isEditing, setFormData]);

    const handleCancelPermutaEdit = useCallback(() => {
        setShowPermutaForm(false);
        setCurrentPermuta({
            id: crypto.randomUUID(), tipo_bem: '', tipo_especifico: '', valor_minimo: null, valor_maximo: null, estado: '', cidade: '', bairros_condominios: '',
        });
        setEditingPermutaIndex(null);
    }, []);
    
    // --- Handlers de Chaves (NOVO) ---
    const handleChaveInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setCurrentChave(prev => ({ ...prev, [id]: value }));
    }, []);
    
    const handleChaveToggleChange = useCallback((checked: boolean) => {
        setCurrentChave(prev => ({ ...prev, disponivel_emprestimo: checked }));
    }, []);

    const handleAddChave = useCallback(() => {
        if (!isEditing) return;
        
        if (!currentChave.responsavel_tipo || !currentChave.codigo_chave) {
            alert('O tipo de responsável e o código da chave são obrigatórios.');
            return;
        }

        setFormData(prev => {
            if (!prev) return null;
            const updatedChaves = editingChaveIndex !== null
                ? prev.chaves.map((c, idx) => idx === editingChaveIndex ? currentChave : c)
                : [...prev.chaves, currentChave];
            return { ...prev, chaves: updatedChaves };
        });

        // Resetar formulário de chave
        setCurrentChave({
            id: crypto.randomUUID(),
            responsavel_tipo: '',
            codigo_chave: '',
            disponivel_emprestimo: true,
            nome_contato: '',
            telefone_contato: '',
            observacoes: '',
        });
        setEditingChaveIndex(null);
        setShowChaveForm(false);
    }, [currentChave, editingChaveIndex, isEditing, setFormData]);

    const handleEditChave = useCallback((index: number) => {
        if (!isEditing) return;
        setCurrentChave({ ...formData.chaves[index] });
        setEditingChaveIndex(index);
        setShowChaveForm(true);
    }, [formData.chaves, isEditing]);

    const handleDeleteChave = useCallback((id: string) => {
        if (!isEditing) return;
        if (window.confirm('Tem certeza que deseja remover esta chave?')) {
            setFormData(prev => {
                if (!prev) return null;
                return {
                    ...prev,
                    chaves: prev.chaves.filter(c => c.id !== id),
                };
            });
            if (currentChave.id === id) {
                setShowChaveForm(false);
                setCurrentChave({
                    id: crypto.randomUUID(), responsavel_tipo: '', codigo_chave: '', disponivel_emprestimo: true, nome_contato: '', telefone_contato: '', observacoes: '',
                });
                setEditingChaveIndex(null);
            }
        }
    }, [currentChave.id, isEditing, setFormData]);

    const handleCancelChaveEdit = useCallback(() => {
        setShowChaveForm(false);
        setCurrentChave({
            id: crypto.randomUUID(), responsavel_tipo: '', codigo_chave: '', disponivel_emprestimo: true, nome_contato: '', telefone_contato: '', observacoes: '',
        });
        setEditingChaveIndex(null);
    }, []);


    switch (step) {
        case 1:
            const isVendaActive = formData.venda_ativo;
            const isLocacaoActive = formData.locacao_ativo;
            const isTemporadaActive = formData.temporada_ativo;

            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Tipo do imóvel <RequiredAsterisk /></label>
                            <select 
                                id="tipo_imovel"
                                value={formData.tipo_imovel}
                                onChange={handleInputChange}
                                disabled={!isEditing}
                                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary-orange focus:border-primary-orange sm:text-sm transition duration-150 ease-in-out placeholder:text-gray-400 disabled:bg-gray-100"
                            >
                                <option value="">Escolha o tipo do imóvel</option>
                                {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <TextInput label={<span>Código <RequiredAsterisk /></span>} id="codigo" value={formData.codigo} onChange={handleInputChange} placeholder="52564" disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {/* Venda */}
                        <div className={`p-3 border rounded-lg space-y-2 ${!isVendaActive && isEditing ? 'opacity-50' : ''}`}>
                            <label htmlFor="venda_ativo" className="flex items-center space-x-2 font-semibold text-dark-text cursor-pointer">
                                <input 
                                    type="checkbox"
                                    id="venda_ativo"
                                    checked={isVendaActive}
                                    onChange={(e) => handleFinalidadeToggle('venda_ativo', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    disabled={!isEditing}
                                />
                                <span>Venda</span>
                            </label>
                            <h4 className="text-sm font-medium text-light-text">Disponibilidade</h4>
                            {renderRadioGroup('venda_disponibilidade', ['Disponível', 'Indisponível'], false)}
                            <h4 className="text-sm font-medium text-light-text">Motivo indisponibilidade</h4>
                            <select 
                                id="venda_motivo_indisponibilidade"
                                value={formData.venda_motivo_indisponibilidade}
                                onChange={handleInputChange}
                                disabled={formData.venda_disponibilidade === 'Disponível' || !isVendaActive || !isEditing}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                            >
                                <option value="">Escolha o motivo da indisponibilidade</option>
                                {motives.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        
                        {/* Locação */}
                        <div className={`p-3 border rounded-lg space-y-2 ${!isLocacaoActive && isEditing ? 'opacity-50' : ''}`}>
                            <label htmlFor="locacao_ativo" className="flex items-center space-x-2 font-semibold text-dark-text cursor-pointer">
                                <input 
                                    type="checkbox"
                                    id="locacao_ativo"
                                    checked={isLocacaoActive}
                                    onChange={(e) => handleFinalidadeToggle('locacao_ativo', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    disabled={!isEditing}
                                />
                                <span>Locação</span>
                            </label>
                            <h4 className="text-sm font-medium text-light-text">Disponibilidade</h4>
                            {renderRadioGroup('locacao_disponibilidade', ['Disponível', 'Indisponível'], false)}
                            <h4 className="text-sm font-medium text-light-text">Motivo indisponibilidade</h4>
                            <select 
                                id="locacao_motivo_indisponibilidade"
                                value={formData.locacao_motivo_indisponibilidade}
                                onChange={handleInputChange}
                                disabled={formData.locacao_disponibilidade === 'Disponível' || !isLocacaoActive || !isEditing}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                            >
                                <option value="">Escolha o motivo da indisponibilidade</option>
                                {motives.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                        
                        {/* Temporada */}
                        <div className={`p-3 border rounded-lg space-y-2 ${!isTemporadaActive && isEditing ? 'opacity-50' : ''}`}>
                            <label htmlFor="temporada_ativo" className="flex items-center space-x-2 font-semibold text-dark-text cursor-pointer">
                                <input 
                                    type="checkbox"
                                    id="temporada_ativo"
                                    checked={isTemporadaActive}
                                    onChange={(e) => handleFinalidadeToggle('temporada_ativo', e.target.checked)}
                                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                    disabled={!isEditing}
                                />
                                <span>Temporada</span>
                            </label>
                            <h4 className="text-sm font-medium text-light-text">Disponibilidade</h4>
                            {renderRadioGroup('temporada_disponibilidade', ['Disponível', 'Indisponível'], false)}
                            <h4 className="text-sm font-medium text-light-text">Motivo indisponibilidade</h4>
                            <select 
                                id="temporada_motivo_indisponibilidade"
                                value={formData.temporada_motivo_indisponibilidade}
                                onChange={handleInputChange}
                                disabled={formData.temporada_disponibilidade === 'Disponível' || !isTemporadaActive || !isEditing}
                                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                            >
                                <option value="">Escolha o motivo da indisponibilidade</option>
                                {motives.map(m => <option key={m} value={m}>{m}</option>)}
                            </select>
                        </div>
                    </div>
                </>
            );
        case 2:
            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <CondominioSelect 
                            label="Condomínio" 
                            id="condominio_id" 
                            value={formData.condominio_id} 
                            onChange={(id) => handlePersonSelectChange('condominio_id', id)}
                            disabled={!isEditing}
                        />
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Bloco / Torre / Quadra</label>
                            <select id="bloco_torre" value={formData.bloco_torre} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                <option value="">Pesquise pelo nome do subcondomínio (Mock)</option>
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="relative">
                            <TextInput 
                                label={<span>CEP <RequiredAsterisk /></span>} 
                                id="cep" 
                                value={formData.cep} 
                                onChange={handleCepChange} 
                                placeholder="99999-999" 
                                maxLength={9}
                                disabled={!isEditing}
                            />
                            {/* Removido cepLoading, pois o pai gerencia o estado e o preenchimento */}
                        </div>
                        
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Estado <RequiredAsterisk /></label>
                            <select id="estado" value={formData.estado} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                <option value={formData.estado}>{formData.estado}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Cidade <RequiredAsterisk /></label>
                            <select id="cidade" value={formData.cidade} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                <option value={formData.cidade}>{formData.cidade}</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Bairro <RequiredAsterisk /></label>
                            <select id="bairro" value={formData.bairro} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                <option value={formData.bairro}>{formData.bairro}</option>
                                {/* Mock de bairros se não houver CEP data */}
                                {neighborhoods.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <TextInput label={<span>Logradouro <RequiredAsterisk /></span>} id="logradouro" value={formData.logradouro} onChange={handleInputChange} placeholder="Informe o logradouro" disabled={!isEditing} />
                        <TextInput label={<span>Número <RequiredAsterisk /></span>} id="numero" value={formData.numero} onChange={handleInputChange} placeholder="Informe o número" disabled={!isEditing} />
                        <TextInput label="Complemento" id="complemento" value={formData.complemento} onChange={handleInputChange} placeholder="Informe o complemento" disabled={!isEditing} />
                        <TextInput label="Ponto de referência" id="referencia" value={formData.referencia} onChange={handleInputChange} placeholder="Ex: Ao lado da igreja" disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Andar</label>
                            <select id="andar" value={formData.andar} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                {floorOptions.map(f => <option key={f} value={f}>{f}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Último andar</label>
                            {renderRadioGroup('ultimo_andar', booleanOptions)}
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <label className="block text-sm font-medium text-light-text">Mapa no site</label>
                            {renderRadioGroup('mapa_visibilidade', ['Exata', 'Aproximada', 'Não mostrar'])}
                        </div>
                    </div>
                    
                    <MapDisplay 
                        visibilidade={formData.mapa_visibilidade as VisibilidadeMapa} 
                        address={fullAddress}
                        isValid={isAddressValid}
                        location={nominatimLocation ? { lat: nominatimLocation.lat, lng: nominatimLocation.lng } : null}
                        isGeocoding={nominatimLoading}
                        geocodingError={nominatimError}
                    />
                </>
            );
        case 3:
            const isCondominioDisabled = formData.condominio_isento || !isEditing;
            const isIptuDisabled = formData.iptu_isento || !isEditing;

            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <NumberInput label={<span>Valor de venda <RequiredAsterisk /></span>} id="valor_venda" isCurrency value={formData.valor_venda} onChange={handleInputChange} placeholder="R$ 0,00" disabled={!formData.venda_ativo || !isEditing} />
                        <NumberInput label="Valor de locação" id="valor_locacao" isCurrency value={formData.valor_locacao} onChange={handleInputChange} placeholder="R$ 0,00" disabled={!formData.locacao_ativo || !isEditing} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="flex space-x-2 items-center">
                            <NumberInput 
                                label="Valor de condomínio" 
                                id="valor_condominio" 
                                isCurrency 
                                value={formData.valor_condominio} 
                                onChange={handleInputChange} 
                                placeholder="R$ 0,00" 
                                disabled={isCondominioDisabled} 
                                className={isCondominioDisabled ? 'opacity-50' : ''}
                            />
                            <label className="flex items-center space-x-1 text-sm mt-6">
                                <Checkbox 
                                    id="condominio_isento" 
                                    checked={formData.condominio_isento} 
                                    onCheckedChange={(checked) => handleCheckboxGroupChange('condominio_isento', checked as any)} 
                                    disabled={!isEditing}
                                />
                                <span>Isento</span>
                            </label>
                        </div>
                        <div className="flex space-x-2 items-center">
                            <NumberInput 
                                label="Valor de IPTU" 
                                id="valor_iptu" 
                                isCurrency 
                                value={formData.valor_iptu} 
                                onChange={handleInputChange} 
                                placeholder="R$ 0,00" 
                                disabled={isIptuDisabled} 
                                className={isIptuDisabled ? 'opacity-50' : ''}
                            />
                            <label className="flex items-center space-x-1 text-sm mt-6">
                                <Checkbox 
                                    id="iptu_isento" 
                                    checked={formData.iptu_isento} 
                                    onCheckedChange={(checked) => handleCheckboxGroupChange('iptu_isento', checked as any)} 
                                    disabled={!isEditing}
                                />
                                <span>Isento</span>
                            </label>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <NumberInput label="Seguro Incêndio (anual)" id="seguro_incendio" value={formData.seguro_incendio} onChange={handleInputChange} placeholder="R$ 0,00" isCurrency disabled={!isEditing} />
                        <NumberInput label="Taxa de limpeza" id="taxa_limpeza" value={formData.taxa_limpeza} onChange={handleInputChange} placeholder="R$ 0,00" isCurrency disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Índice de reajuste</label>
                            <select id="indice_reajuste" value={formData.indice_reajuste} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                {indexOptions.map(i => <option key={i} value={i}>{i}</option>)}
                            </select>
                        </div>
                        <NumberInput label="Valor Base" id="valor_base" value={formData.valor_base} onChange={handleInputChange} placeholder="Informe o valor base" isCurrency disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Período do IPTU</label>
                            {renderRadioGroup('iptu_periodo', ['Mensal', 'Anual'])}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Financiável <RequiredAsterisk /></label>
                            {renderRadioGroup('financiavel', ['Sim', 'Não', 'MCMV'])}
                        </div>
                    </div>

                    {/* --- Seção de Permutas --- */}
                    <div className="mt-8 pt-6 border-t border-gray-200 space-y-4">
                        <h3 className="text-lg font-semibold text-primary-orange">Adicionar Nova Permuta</h3>
                        
                        {formData.permutas.length > 0 && (
                            <div className="space-y-2">
                                <h4 className="text-sm font-medium text-light-text">Permutas Cadastradas ({formData.permutas.length})</h4>
                                {formData.permutas.map((permuta, index) => (
                                    <div key={permuta.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                                        <p className="text-sm text-dark-text font-medium truncate">
                                            {permuta.tipo_especifico} ({permuta.tipo_bem}) - R$ {permuta.valor_minimo?.toLocaleString('pt-BR') || 'N/A'}
                                        </p>
                                        <div className="flex space-x-2 flex-shrink-0">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleEditPermuta(index)}
                                                disabled={!isEditing}
                                                className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </Button>
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                onClick={() => handleDeletePermuta(permuta.id)}
                                                disabled={!isEditing}
                                                className="text-red-600 border-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {!showPermutaForm && (
                            <div className="text-center">
                                <Button 
                                    onClick={() => { 
                                        setShowPermutaForm(true); 
                                        setCurrentPermuta({
                                            id: crypto.randomUUID(), tipo_bem: '', tipo_especifico: '', valor_minimo: null, valor_maximo: null, estado: '', cidade: '', bairros_condominios: '',
                                        });
                                        setEditingPermutaIndex(null);
                                    }}
                                    className="bg-primary-orange hover:bg-secondary-orange text-white"
                                    disabled={!isEditing}
                                >
                                    <Plus className="w-4 h-4 mr-2" /> Adicionar Nova Permuta
                                </Button>
                            </div>
                        )}

                        {showPermutaForm && (
                            <div className={`p-4 border rounded-lg bg-gray-50 space-y-4 ${!isEditing ? 'opacity-50 pointer-events-none' : ''}`}>
                                <h4 className="text-md font-semibold text-dark-text">
                                    {editingPermutaIndex !== null ? 'Editar Permuta' : 'Nova Permuta'}
                                </h4>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-light-text">Tipo de bem</label>
                                    <div className="flex space-x-4">
                                        {tipoBemOptions.map(option => (
                                            <label key={option} className="flex items-center space-x-2 text-sm">
                                                <input 
                                                    type="radio" 
                                                    name="tipo_bem" 
                                                    value={option} 
                                                    checked={currentPermuta.tipo_bem === option}
                                                    onChange={(e) => setCurrentPermuta(prev => ({ ...prev, tipo_bem: e.target.value as TipoBemPermuta, tipo_especifico: '' }))}
                                                    className="text-blue-600 focus:ring-blue-500" 
                                                    disabled={!isEditing}
                                                />
                                                <span>{option}</span>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {currentPermuta.tipo_bem && (
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-light-text">Tipo</label>
                                        <select 
                                            id="tipo_especifico"
                                            value={currentPermuta.tipo_especifico}
                                            onChange={handlePermutaInputChange}
                                            disabled={!isEditing}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                                        >
                                            <option value="">Selecione o tipo</option>
                                            {currentPermuta.tipo_bem === 'Móvel' && tipoMovelOptions.map(t => <option key={t} value={t}>{t}</option>)}
                                            {currentPermuta.tipo_bem === 'Imóvel' && propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                )}

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <NumberInput 
                                        label="Valor mínimo" 
                                        id="valor_minimo" 
                                        isCurrency 
                                        value={currentPermuta.valor_minimo || ''} 
                                        onChange={handlePermutaInputChange} 
                                        placeholder="R$ 0,00" 
                                        disabled={!isEditing}
                                    />
                                    <NumberInput 
                                        label="Valor máximo" 
                                        id="valor_maximo" 
                                        isCurrency 
                                        value={currentPermuta.valor_maximo || ''} 
                                        onChange={handlePermutaInputChange} 
                                        placeholder="R$ 0,00" 
                                        disabled={!isEditing}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-light-text">Estado</label>
                                        <select 
                                            id="estado"
                                            value={currentPermuta.estado}
                                            onChange={handlePermutaInputChange}
                                            disabled={!isEditing}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                                        >
                                            <option value="">Selecione o estado</option>
                                            {estadoOptions.map(e => <option key={e} value={e}>{e}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-medium text-light-text">Cidade</label>
                                        <select 
                                            id="cidade"
                                            value={currentPermuta.cidade}
                                            onChange={handlePermutaInputChange}
                                            disabled={!isEditing}
                                            className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                                        >
                                            <option value="">Selecione a cidade</option>
                                            {cidadeOptions.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <TextInput 
                                    label="Bairros e condomínios" 
                                    id="bairros_condominios" 
                                    value={currentPermuta.bairros_condominios} 
                                    onChange={handlePermutaInputChange} 
                                    placeholder="Ex: Centro, Laranjal, Condomínio X" 
                                    disabled={!isEditing}
                                />
                                
                                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                                    <Button 
                                        variant="outline" 
                                        onClick={handleCancelPermutaEdit}
                                        disabled={!isEditing}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button 
                                        onClick={handleAddPermuta}
                                        disabled={!isEditing}
                                    >
                                        {editingPermutaIndex !== null ? 'Salvar Alterações' : 'Adicionar Permuta'}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            );
        case 4:
            return (
                <>
                    <div className="p-3 bg-blue-50 border-l-4 border-blue-500 text-sm text-blue-800 mb-4">
                        As informações de visibilidade podem ser sobrescritas de acordo com as configurações dos Portais.
                    </div>
                    
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-light-text">Endereço <RequiredAsterisk /></label>
                        <select id="vis_endereco" value={formData.vis_endereco} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                            {visibilidadeEnderecoOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                    </div>
                    
                    <h3 className="text-sm font-medium text-light-text mt-4">Valores</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <ToggleSwitch 
                            label="Venda" 
                            id="vis_venda" 
                            checked={formData.vis_venda === 'Visível'} 
                            onChange={(checked) => handleToggleChange('vis_venda', checked)}
                            disabled={!formData.venda_ativo || !isEditing}
                        />
                        <ToggleSwitch 
                            label="Locação" 
                            id="vis_locacao" 
                            checked={formData.vis_locacao === 'Visível'} 
                            onChange={(checked) => handleToggleChange('vis_locacao', checked)}
                            disabled={!formData.locacao_ativo || !isEditing}
                        />
                        <ToggleSwitch 
                            label="Temporada" 
                            id="vis_temporada" 
                            checked={formData.vis_temporada === 'Visível'} 
                            onChange={(checked) => handleToggleChange('vis_temporada', checked)}
                            disabled={!formData.temporada_ativo || !isEditing}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <ToggleSwitch 
                            label="IPTU" 
                            id="vis_iptu" 
                            checked={formData.vis_iptu === 'Visível'} 
                            onChange={(checked) => handleToggleChange('vis_iptu', checked)}
                            disabled={!isEditing}
                        />
                        <ToggleSwitch 
                            label="Condomínio" 
                            id="vis_condominio" 
                            checked={formData.vis_condominio === 'Visível'} 
                            onChange={(checked) => handleToggleChange('vis_condominio', checked)}
                            disabled={!isEditing}
                        />
                    </div>
                </>
            );
        case 5:
            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <PersonSelect 
                            label="Proprietário" 
                            id="proprietario_id" 
                            value={formData.proprietario_id} 
                            onChange={(id) => handlePersonSelectChange('proprietario_id', id)}
                            required
                            showNewButton
                            disabled={!isEditing}
                        />
                        <NumberInput label="Comissão (%)" id="comissao_proprietario_percent" value={formData.comissao_proprietario_percent} onChange={handleInputChange} placeholder="100%" disabled={!isEditing} />
                    </div>
                    <Button variant="outline" className="mt-2" disabled={!isEditing}>+ Mais um proprietário (Mock)</Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <NumberInput label="Período do email de atualização (dias)" id="periodo_email_atualizacao" value={formData.periodo_email_atualizacao} onChange={handleInputChange} placeholder="30" disabled={!isEditing} />
                        <label className="flex items-center space-x-2 text-sm mt-6">
                            <Checkbox id="enviar_email_atualizacao" checked={formData.enviar_email_atualizacao} onCheckedChange={(checked) => handleCheckboxGroupChange('enviar_email_atualizacao', checked as any)} disabled={!isEditing} />
                            <span>Enviar email de atualização</span>
                        </label>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <UserSelect 
                            label="Agenciador / Captador" 
                            id="agenciador_id" 
                            value={formData.agenciador_id} 
                            onChange={(id) => handlePersonSelectChange('agenciador_id', id)}
                            required
                            disabled={!isEditing}
                        />
                        <UserSelect 
                            label="Responsável / Corretor" 
                            id="responsavel_id" 
                            value={formData.responsavel_id} 
                            onChange={(id) => handlePersonSelectChange('responsavel_id', id)}
                            required
                            disabled={!isEditing}
                        />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <NumberInput label="Honorários Venda (%)" id="honorarios_venda_percent" value={formData.honorarios_venda_percent} onChange={handleInputChange} placeholder="0%" disabled={!formData.venda_ativo || !isEditing} />
                        <NumberInput label="Honorários Locação (%)" id="honorarios_locacao_percent" value={formData.honorarios_locacao_percent} onChange={handleInputChange} placeholder="0%" disabled={!formData.locacao_ativo || !isEditing} />
                        <NumberInput label="Honorários Temporada (%)" id="honorarios_temporada_percent" value={formData.honorarios_temporada_percent} onChange={handleInputChange} placeholder="0%" disabled={!formData.temporada_ativo || !isEditing} />
                        <TextInput label={<span>Data agenciamento <RequiredAsterisk /></span>} id="data_agenciamento" type="date" value={formData.data_agenciamento} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Ocupação <RequiredAsterisk /></label>
                            <select id="ocupacao" value={formData.ocupacao} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                {occupationOptions.map(o => <option key={o} value={o}>{o}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Exclusivo</label>
                            {renderRadioGroup('exclusivo', booleanOptions)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Placa</label>
                            {renderRadioGroup('placa', booleanOptions)}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <TextInput label="Nº medidor energia" id="medidor_energia" value={formData.medidor_energia} onChange={handleInputChange} placeholder="Informe o Nº da energia" disabled={!isEditing} />
                        <TextInput label="Nº medidor água" id="medidor_agua" value={formData.medidor_agua} onChange={handleInputChange} placeholder="Informe o Nº da água" disabled={!isEditing} />
                        <TextInput label="Nº medidor gás" id="medidor_gas" value={formData.medidor_gas} onChange={handleInputChange} placeholder="Informe o Nº do gás" disabled={!isEditing} />
                    </div>
                    
                    <div className="space-y-2 mt-4">
                        <label className="block text-sm font-medium text-light-text">Observações internas</label>
                        <textarea 
                            id="observacoes_internas" 
                            rows={3} 
                            value={formData.observacoes_internas}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                            disabled={!isEditing}
                        ></textarea>
                    </div>
                </>
            );
        case 6: // Chaves (NOVO)
            return (
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-primary-orange">Gerenciamento de Chaves</h3>
                    
                    {formData.chaves.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium text-light-text">Chaves Cadastradas ({formData.chaves.length})</h4>
                            {formData.chaves.map((chave, index) => (
                                <div key={chave.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md border border-gray-200">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm text-dark-text font-medium truncate">
                                            <Key className="w-4 h-4 mr-1 inline text-gray-500" /> {chave.codigo_chave} ({chave.responsavel_tipo})
                                        </p>
                                        <p className="text-xs text-light-text truncate">
                                            {chave.nome_contato || 'Contato não informado'} | {chave.disponivel_emprestimo ? 'Disponível para empréstimo' : 'Indisponível'}
                                        </p>
                                    </div>
                                    <div className="flex space-x-2 flex-shrink-0">
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleEditChave(index)}
                                            disabled={!isEditing}
                                            className="text-blue-600 border-blue-600 hover:bg-blue-50"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                        <Button 
                                            variant="outline" 
                                            size="sm" 
                                            onClick={() => handleDeleteChave(chave.id)}
                                            disabled={!isEditing}
                                            className="text-red-600 border-red-600 hover:bg-red-50"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!showChaveForm && (
                        <div className="text-center">
                            <Button 
                                onClick={() => { 
                                    // 1. Reseta o formulário de edição/adição para garantir que é uma nova chave
                                    setCurrentChave({
                                        id: crypto.randomUUID(), responsavel_tipo: '', codigo_chave: '', disponivel_emprestimo: true, nome_contato: '', telefone_contato: '', observacoes: '',
                                    });
                                    setEditingChaveIndex(null);
                                    // 2. Exibe o formulário
                                    setShowChaveForm(true); 
                                }}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                                disabled={!isEditing}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Adicionar Chave
                            </Button>
                        </div>
                    )}

                    {showChaveForm && (
                        <div className={`p-4 border rounded-lg bg-gray-50 space-y-4 ${!isEditing ? 'opacity-50 pointer-events-none' : ''}`}>
                            <h4 className="text-md font-semibold text-dark-text">
                                {editingChaveIndex !== null ? 'Editar Chave' : 'Nova Chave'}
                            </h4>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-light-text">Responsável pela chave <RequiredAsterisk /></label>
                                    <select 
                                        id="responsavel_tipo"
                                        value={currentChave.responsavel_tipo}
                                        onChange={handleChaveInputChange}
                                        disabled={!isEditing}
                                        className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                                    >
                                        <option value="">Selecione o responsável</option>
                                        {responsavelChaveOptions.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <TextInput 
                                    label={<span>Código da chave <RequiredAsterisk /></span>} 
                                    id="codigo_chave" 
                                    value={currentChave.codigo_chave} 
                                    onChange={handleChaveInputChange} 
                                    placeholder="Ex: 1A, 505" 
                                    disabled={!isEditing}
                                />
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <ToggleSwitch 
                                    label="Disponível para empréstimo" 
                                    id="disponivel_emprestimo" 
                                    checked={currentChave.disponivel_emprestimo} 
                                    onChange={handleChaveToggleChange}
                                    disabled={!isEditing}
                                />
                                <TextInput 
                                    label="Nome do Contato" 
                                    id="nome_contato" 
                                    value={currentChave.nome_contato} 
                                    onChange={handleChaveInputChange} 
                                    placeholder="Nome" 
                                    disabled={!isEditing}
                                />
                                <TextInput 
                                    label="Telefone do Contato" 
                                    id="telefone_contato" 
                                    value={currentChave.telefone_contato} 
                                    onChange={handleChaveInputChange} 
                                    placeholder="(53) 99999-9999" 
                                    disabled={!isEditing}
                                />
                            </div>
                            
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-light-text">Observações</label>
                                <textarea 
                                    id="observacoes" 
                                    rows={2} 
                                    value={currentChave.observacoes}
                                    onChange={handleChaveInputChange}
                                    className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                                    disabled={!isEditing}
                                ></textarea>
                            </div>
                            
                            <div className="flex justify-end space-x-2 pt-2 border-t border-gray-200">
                                <Button 
                                    variant="outline" 
                                    onClick={handleCancelChaveEdit}
                                    disabled={!isEditing}
                                >
                                    Cancelar
                                </Button>
                                <Button 
                                    onClick={handleAddChave}
                                    disabled={!isEditing}
                                >
                                    {editingChaveIndex !== null ? 'Salvar Alterações' : 'Adicionar Chave'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            );
        case 7: // Documentos Anexados
            return (
                <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-light-text">Nenhum documento anexado encontrado. (Mock)</p>
                    <Button variant="outline" className="mt-4 bg-white text-blue-600 border-blue-600 hover:bg-blue-50" disabled={!isEditing}>
                        + Novo anexo
                    </Button>
                </div>
            );
        case 8: // Mídias
            return (
                <>
                    <div className="flex border-b border-gray-200 mb-4">
                        <button className="py-2 px-4 border-b-2 border-blue-600 text-blue-600 font-medium flex items-center"><Image className="w-4 h-4 mr-1" /> Imagens ({images.length})</button>
                        <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center" disabled={!isEditing}><List className="w-4 h-4 mr-1" /> Plantas (0)</button>
                        <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center" disabled={!isEditing}>Tour 360 (0)</button>
                        <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center" disabled={!isEditing}>Vídeos (0)</button>
                    </div>
                    
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        multiple 
                        accept="image/*" 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        disabled={!isEditing}
                    />
                    
                    <Button 
                        onClick={() => fileInputRef.current?.click()}
                        variant="outline" 
                        className="bg-white text-blue-600 border-blue-600 hover:bg-blue-50 flex items-center"
                        disabled={!isEditing}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Adicionar imagem
                    </Button>
                    
                    {images.length > 0 && (
                        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center space-x-4 mb-4">
                                <label className="flex items-center space-x-2 text-sm font-medium">
                                    <Checkbox 
                                        id="select-all" 
                                        checked={selectedImageIds.length === images.length && images.length > 0}
                                        onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                                        className="w-5 h-5 text-blue-600 border-gray-400"
                                        disabled={!isEditing}
                                    />
                                    <span>Selecionar ({selectedImageIds.length})</span>
                                </label>
                                <ActionsDropdown 
                                    onAction={handleAction} 
                                    disabled={selectedImageIds.length === 0 || !isEditing} 
                                    selectedCount={selectedImageIds.length}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {images.map(img => (
                                    <ImageCard 
                                        key={img.id}
                                        image={img}
                                        onSelect={handleImageSelect}
                                        onLegendChange={handleLegendUpdate}
                                        isSelected={selectedImageIds.includes(img.id)}
                                        disabled={!isEditing}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            );
        case 9:
            return (
                <>
                    <TextInput label="Etiquetas" id="etiquetas" value={formData.etiquetas} onChange={handleInputChange} placeholder="Selecione ou pesquise etiquetas" disabled={!isEditing} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Dormitórios <RequiredAsterisk /></label>
                            {renderRadioGroup('dormitorios', [0, 1, 2, 3, 4, 5], true)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Quantos são suítes? <RequiredAsterisk /></label>
                            {renderRadioGroup('suites', [0, 1, 2, 3, 4, 5], true)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Banheiros <RequiredAsterisk /></label>
                            {renderRadioGroup('banheiros', [0, 1, 2, 3, 4, 5], true)}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Vagas de garagem <RequiredAsterisk /></label>
                            {renderRadioGroup('vagas_garagem', [0, 1, 2, 3, 4, 5], true)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Condição <RequiredAsterisk /></label>
                            {renderRadioGroup('condicao', conditionOptions, true)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Mobiliado</label>
                            {renderRadioGroup('mobiliado', ['Não', 'Sim', 'Semimobiliado'])}
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Orientação solar</label>
                            {renderRadioGroup('orientacao_solar', orientationOptions)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Posição</label>
                            {renderRadioGroup('posicao', ['Frente', 'Lateral', 'Fundos'])}
                        </div>
                        <TextInput label="Entrega da obra" id="entrega_obra" type="date" value={formData.entrega_obra} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                        <NumberInput label={<span>Área Privativa (m²) <RequiredAsterisk /></span>} id="area_privativa_m2" value={formData.area_privativa_m2} onChange={handleInputChange} placeholder="0" disabled={!isEditing} />
                        <NumberInput label="Pessoas / Acomodações" id="pessoas_acomodacoes" value={formData.pessoas_acomodacoes} onChange={handleInputChange} placeholder="Informe o número de pessoas" disabled={!isEditing} />
                        <NumberInput label="Distância para o mar (m)" id="distancia_mar_m" value={formData.distancia_mar_m} onChange={handleInputChange} placeholder="0" disabled={!isEditing} />
                    </div>
                    
                    <h3 className="text-sm font-medium text-light-text mt-6">Tipo de piso</h3>
                    {renderPisoCheckboxGroup(floorTypes)}
                    
                    <h3 className="text-sm font-medium text-light-text mt-6">Título no site e portais</h3>
                    <TextInput label="" id="titulo_site" value={formData.titulo_site} onChange={handleInputChange} placeholder="Título do anúncio" disabled={!isEditing} />
                    
                    <h3 className="text-sm font-medium text-light-text mt-4">Descrição no site e portais</h3>
                    <textarea 
                        id="descricao_site" 
                        rows={5} 
                        value={formData.descricao_site}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                        disabled={!isEditing}
                    ></textarea>
                    <Button variant="outline" className="mt-2 bg-white text-blue-600 border-blue-600 hover:bg-blue-50" disabled={!isEditing}>
                        Gerar descrição agora (Mock IA)
                    </Button>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <TextInput label="Meta title" id="meta_title" value={formData.meta_title} onChange={handleInputChange} placeholder="Meta title" disabled={!isEditing} />
                        <TextInput label="Meta description" id="meta_description" value={formData.meta_description} onChange={handleInputChange} placeholder="Meta description" disabled={!isEditing} />
                    </div>
                </>
            );
        case 10: // Sites e portais
            return (
                <>
                    <div className="p-3 bg-yellow-50 border-l-4 border-yellow-500 text-sm text-yellow-800 mb-4">
                        Não é possível anunciar um imóvel sem contratos disponíveis, caso já exista um anúncio ativo, o mesmo será removido.
                    </div>
                    <label className="flex items-center space-x-2 text-sm font-medium mb-4">
                        <Checkbox id="select_all_portals" disabled={!isEditing} />
                        <span>Selecionar todos (Mock)</span>
                    </label>
                    
                    {/* Mock de Portais */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <h4 className="font-semibold text-dark-text">jetlar.com</h4>
                            <p className="text-sm text-red-600 mt-2">Não possui anúncios disponíveis</p>
                        </div>
                        <div className="p-4 border rounded-lg bg-white">
                            <label className="flex items-center space-x-2 font-semibold text-dark-text">
                                <Checkbox id="imperialparis_portal" checked disabled={!isEditing} />
                                <span>imperialparis.com</span>
                            </label>
                            <div className="space-y-2 mt-2">
                                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                    <option>Sem destaque</option>
                                </select>
                                <p className="text-xs text-light-text">Data de inclusão: 28/10/2025</p>
                                <p className="text-xs text-light-text">Data de remoção: -</p>
                            </div>
                        </div>
                    </div>
                </>
            );
        case 11:
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                        <h3 className="text-sm font-medium text-light-text">Status de aprovação <RequiredAsterisk /></h3>
                        {renderRadioGroup('status_aprovacao', approvalOptions)}
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-light-text">Observações</label>
                        <textarea 
                            id="observacoes_aprovacao" 
                            rows={3} 
                            value={formData.observacoes_aprovacao}
                            onChange={handleInputChange}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                            disabled={!isEditing}
                        ></textarea>
                    </div>
                </div>
            );
        default:
            return <p>Passo não encontrado.</p>;
    }
};

export default ImovelFormSteps;
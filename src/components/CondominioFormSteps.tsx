import React, { useCallback, useEffect, useState } from 'react';
import { Home, MapPin, DollarSign, Eye, Lock, Key, FileText, Image, List, CheckCircle, Zap, Loader2, Plus, Building2, Link as LinkIcon } from 'lucide-react';
import { CondominioInput, CondominioMedia } from '../../types';
import TextInput from './TextInput';
import NumberInput from './NumberInput';
import { Button } from './ui/Button';
import { Checkbox } from './ui/Checkbox';
import ToggleSwitch from './ToggleSwitch';
import ImageCard from './ImageCard';
import ActionsDropdown from './ActionsDropdown';
import MapDisplay from './MapDisplay';
import AvatarUploader from './AvatarUploader';
import { supabase } from '../integrations/supabase/client';

// --- Mock Data ---
const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas'];
const estagioOptions = ['Na planta', 'Em construção', 'Pronto'];
const booleanOptions = ['Sim', 'Não'];

// Mock de dados para FKs (Incorporadoras e Lançamentos)
interface LookupItem {
    id: number;
    nome: string;
}

interface CondominioFormStepsProps {
    step: number;
    formData: CondominioInput;
    media: CondominioMedia[];
    selectedMediaIds: string[];
    isEditing: boolean;
    fileInputRef: React.RefObject<HTMLInputElement>;
    
    // Handlers de Input
    handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => void;
    handleCepChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleRadioChange: (name: keyof CondominioInput, value: string) => void;
    handleCheckboxChange: (name: keyof CondominioInput, checked: boolean) => void;
    handleCheckboxGroupChange: (field: keyof CondominioInput, value: number) => void;
    
    // Handlers de Mídia
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
    handleMediaSelect: (id: string, isSelected: boolean) => void;
    handleMediaAction: (action: string) => void;
    handleSelectAllMedia: (checked: boolean) => void;
    handleLogoUploadSuccess: (url: string) => Promise<boolean>;
    
    // Props de Geocodificação
    nominatimLocation: { lat: number, lng: number, display_name: string } | null;
    nominatimLoading: boolean;
    nominatimError: string | null;
}

const CondominioFormSteps: React.FC<CondominioFormStepsProps> = ({
    step,
    formData,
    media,
    selectedMediaIds,
    isEditing,
    fileInputRef,
    handleInputChange,
    handleCepChange,
    handleRadioChange,
    handleCheckboxChange,
    handleCheckboxGroupChange,
    handleFileSelect,
    handleMediaSelect,
    handleMediaAction,
    handleSelectAllMedia,
    handleLogoUploadSuccess,
    nominatimLocation,
    nominatimLoading,
    nominatimError,
}) => {
    
    const [caracteristicasPadrao, setCaracteristicasPadrao] = useState<LookupItem[]>([]);
    const [incorporadoras, setIncorporadoras] = useState<LookupItem[]>([]);
    const [lancamentos, setLancamentos] = useState<LookupItem[]>([]);
    const [isLoadingLookups, setIsLoadingLookups] = useState(false);

    const fetchLookups = useCallback(async () => {
        setIsLoadingLookups(true);
        
        const [caracRes, incorpRes, lancRes] = await Promise.all([
            supabase.from('caracteristicas_padrao').select('id, nome').order('nome'),
            supabase.from('incorporadoras').select('id, nome').order('nome'),
            supabase.from('lancamentos').select('id, nome').order('nome'),
        ]);

        if (caracRes.data) setCaracteristicasPadrao(caracRes.data as LookupItem[]);
        if (incorpRes.data) setIncorporadoras(incorpRes.data as LookupItem[]);
        if (lancRes.data) setLancamentos(lancRes.data as LookupItem[]);
        
        setIsLoadingLookups(false);
    }, []);

    useEffect(() => {
        fetchLookups();
    }, [fetchLookups]);

    const RequiredAsterisk = () => <span className="text-red-500 ml-1">*</span>;

    const renderRadioGroup = (name: keyof CondominioInput, options: (string | number | boolean)[], required = false) => (
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
                    <span>{String(option)}</span>
                </label>
            ))}
        </div>
    );
    
    const isAddressValid = formData.cep.replace(/\D/g, '').length === 8 && formData.bairro && formData.endereco && formData.numero;
    const fullAddress = `${formData.endereco}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}`;

    switch (step) {
        case 1: // Dados do condomínio
            return (
                <>
                    <TextInput label={<span>Nome do Condomínio <RequiredAsterisk /></span>} id="nome" value={formData.nome} onChange={handleInputChange} placeholder="Ex: Residencial Imperial Park" disabled={!isEditing} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Ficha Técnica</label>
                            {renderRadioGroup('ficha', booleanOptions)}
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Loteamento</label>
                            {renderRadioGroup('loteamento', booleanOptions)}
                        </div>
                        <NumberInput label="Ano de Término" id="ano_termino" value={formData.ano_termino} onChange={handleInputChange} placeholder="2025" disabled={!isEditing} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        <NumberInput label="Área do Terreno (m²)" id="area_terreno_m2" value={formData.area_terreno_m2} onChange={handleInputChange} placeholder="10000" disabled={!isEditing} />
                        <TextInput label="Arquitetura / Arquiteto" id="arquitetura" value={formData.arquitetura} onChange={handleInputChange} placeholder="Ex: Moderno, João Silva" disabled={!isEditing} />
                    </div>
                    
                    <div className="space-y-3 mt-6 p-4 border rounded-lg bg-gray-50">
                        <h3 className="text-lg font-semibold text-dark-text mb-3">Logo do Condomínio</h3>
                        <AvatarUploader 
                            currentAvatarUrl={formData.logo_url}
                            onUploadSuccess={handleLogoUploadSuccess}
                            disabled={!isEditing}
                        />
                        <p className="text-xs text-gray-500 mt-2">Esta imagem será usada como logo/ícone do condomínio no site.</p>
                    </div>
                    
                    <div className="space-y-2 mt-4">
                        <label className="block text-sm font-medium text-light-text">Incorporadora</label>
                        <select 
                            id="incorporadora_id"
                            value={formData.incorporadora_id || ''}
                            onChange={handleInputChange}
                            disabled={!isEditing || isLoadingLookups}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                        >
                            <option value="">{isLoadingLookups ? 'Carregando...' : 'Selecione a incorporadora'}</option>
                            {incorporadoras.map(i => <option key={i.id} value={i.id}>{i.nome}</option>)}
                        </select>
                        <Button variant="outline" size="sm" className="mt-2 text-blue-600 border-blue-600 hover:bg-blue-50" disabled={!isEditing}>+ Nova Incorporadora (Mock)</Button>
                    </div>
                </>
            );
        case 2: // Localização
            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                            <label className="block text-sm font-medium text-light-text">Bairro</label>
                            <select id="bairro" value={formData.bairro} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                <option value="">Selecione o bairro</option>
                                {neighborhoods.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                        <TextInput label={<span>Endereço <RequiredAsterisk /></span>} id="endereco" value={formData.endereco} onChange={handleInputChange} placeholder="Rua/Avenida" disabled={!isEditing} />
                        <NumberInput label={<span>Número <RequiredAsterisk /></span>} id="numero" value={formData.numero} onChange={handleInputChange} placeholder="Número" disabled={!isEditing} />
                        <TextInput label="Complemento" id="complemento" value={formData.complemento} onChange={handleInputChange} placeholder="Ex: Bloco A" disabled={!isEditing} />
                        <TextInput label="Ponto de referência" id="referencia" value={formData.referencia} onChange={handleInputChange} placeholder="Ex: Ao lado da igreja" disabled={!isEditing} />
                    </div>
                    
                    <MapDisplay 
                        visibilidade={'Exata'} // Condomínios sempre mostram localização exata
                        address={fullAddress}
                        isValid={isAddressValid}
                        location={nominatimLocation ? { lat: nominatimLocation.lat, lng: nominatimLocation.lng } : null}
                        isGeocoding={nominatimLoading}
                        geocodingError={nominatimError}
                    />
                    <Button variant="outline" className="mt-2 bg-white text-blue-600 border-blue-600 hover:bg-blue-50" disabled={!isEditing}>
                        Repositionar marcador (Mock)
                    </Button>
                </>
            );
        case 3: // Características
            return (
                <>
                    <h3 className="text-sm font-medium text-light-text mb-3">Selecione as características do condomínio: <RequiredAsterisk /></h3>
                    {isLoadingLookups ? (
                        <div className="flex items-center text-gray-500"><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando características...</div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {caracteristicasPadrao.map(carac => (
                                <label key={carac.id} className="flex items-center space-x-2 text-sm">
                                    <Checkbox 
                                        id={`carac-${carac.id}`} 
                                        checked={formData.caracteristicas_ids.includes(carac.id)}
                                        onCheckedChange={() => handleCheckboxGroupChange('caracteristicas_ids', carac.id)}
                                        disabled={!isEditing}
                                    />
                                    <span>{carac.nome}</span>
                                </label>
                            ))}
                        </div>
                    )}
                </>
            );
        case 4: // Descrição
            return (
                <>
                    <h3 className="text-sm font-medium text-light-text mt-4">Descrição do Condomínio <RequiredAsterisk /></h3>
                    <textarea 
                        id="descricao" 
                        rows={8} 
                        value={formData.descricao}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                        disabled={!isEditing}
                    ></textarea>
                    <Button variant="outline" className="mt-2 bg-white text-blue-600 border-blue-600 hover:bg-blue-50" disabled={!isEditing}>
                        Gerar descrição agora (Mock IA)
                    </Button>
                </>
            );
        case 5: // Website
            return (
                <>
                    <TextInput label="Slug (URL amigável)" id="slug" value={formData.slug} onChange={handleInputChange} placeholder="ex: residencial-imperial-park" disabled={!isEditing} />
                    <TextInput label="URL do Website" id="website_url" value={formData.website_url} onChange={handleInputChange} placeholder="https://www.imperialpark.com.br" disabled={!isEditing} />
                    <h3 className="text-sm font-medium text-light-text mt-4">Meta Description (SEO)</h3>
                    <textarea 
                        id="meta_description" 
                        rows={3} 
                        value={formData.meta_description}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                        disabled={!isEditing}
                    ></textarea>
                </>
            );
        case 6: // Documentos associados
            return (
                <div className="text-center py-10 border border-dashed border-gray-300 rounded-lg">
                    <p className="text-light-text">Nenhum documento anexado encontrado. (Mock)</p>
                    <Button variant="outline" className="mt-4 bg-white text-blue-600 border-blue-600 hover:bg-blue-50" disabled={!isEditing}>
                        + Novo anexo
                    </Button>
                </div>
            );
        case 7: // Mídias
            const isAllSelected = media.length > 0 && selectedMediaIds.length === media.length;
            return (
                <>
                    <div className="flex border-b border-gray-200 mb-4">
                        <button className="py-2 px-4 border-b-2 border-blue-600 text-blue-600 font-medium flex items-center"><Image className="w-4 h-4 mr-1" /> Imagens ({media.filter(m => m.tipo === 'imagem').length})</button>
                        <button className="py-2 px-4 text-gray-500 hover:text-blue-600 flex items-center" disabled={!isEditing}><LinkIcon className="w-4 h-4 mr-1" /> Vídeos (0)</button>
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
                    
                    {media.length > 0 && (
                        <div className="mt-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                            <div className="flex items-center space-x-4 mb-4">
                                <label className="flex items-center space-x-2 text-sm font-medium">
                                    <Checkbox 
                                        id="select-all" 
                                        checked={isAllSelected}
                                        onCheckedChange={(checked) => handleSelectAllMedia(checked as boolean)}
                                        className="w-5 h-5 text-blue-600 border-gray-400"
                                        disabled={!isEditing}
                                    />
                                    <span>Selecionar ({selectedMediaIds.length})</span>
                                </label>
                                <ActionsDropdown 
                                    onAction={handleMediaAction} 
                                    disabled={selectedMediaIds.length === 0 || !isEditing} 
                                    selectedCount={selectedMediaIds.length}
                                />
                            </div>
                            
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {media.map(img => (
                                    <ImageCard 
                                        key={img.id}
                                        image={{ 
                                            id: img.id, 
                                            url: img.url, 
                                            legend: img.tipo, // Usando tipo como legenda mock
                                            isVisible: img.destaque, // Usando destaque como visibilidade mock
                                            rotation: 0, // Rotação não aplicável aqui
                                        }}
                                        onSelect={handleMediaSelect}
                                        onLegendChange={() => {}} // Não há legenda para mídia de condomínio
                                        isSelected={selectedMediaIds.includes(img.id)}
                                        disabled={!isEditing}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </>
            );
        case 8: // Andamento de obra
            return (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Estágio da Obra <RequiredAsterisk /></label>
                            <select id="estagio" value={formData.estagio} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled={!isEditing}>
                                <option value="">Selecione o estágio</option>
                                {estagioOptions.map(e => <option key={e} value={e}>{e}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="block text-sm font-medium text-light-text">Destaque na Obra</label>
                            {renderRadioGroup('destaque_obra', booleanOptions)}
                        </div>
                        <TextInput label="Data de Entrega" id="entrega_obra" type="date" value={formData.entrega_obra} onChange={handleInputChange} disabled={!isEditing} />
                    </div>
                    
                    <h3 className="text-sm font-medium text-light-text mt-6 border-b pb-2">Percentual de Conclusão</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <NumberInput label="Projeto (%)" id="percentual_projeto" value={formData.percentual_projeto} onChange={handleInputChange} min={0} max={100} disabled={!isEditing} />
                        <NumberInput label="Terraplanagem (%)" id="percentual_terraplanagem" value={formData.percentual_terraplanagem} onChange={handleInputChange} min={0} max={100} disabled={!isEditing} />
                        <NumberInput label="Fundação (%)" id="percentual_fundacao" value={formData.percentual_fundacao} onChange={handleInputChange} min={0} max={100} disabled={!isEditing} />
                        <NumberInput label="Estrutura (%)" id="percentual_estrutura" value={formData.percentual_estrutura} onChange={handleInputChange} min={0} max={100} disabled={!isEditing} />
                        <NumberInput label="Alvenaria (%)" id="percentual_alvenaria" value={formData.percentual_alvenaria} onChange={handleInputChange} min={0} max={100} disabled={!isEditing} />
                        <NumberInput label="Instalações (%)" id="percentual_instalacoes" value={formData.percentual_instalacoes} onChange={handleInputChange} min={0} max={100} disabled={!isEditing} />
                        <NumberInput label="Acabamento (%)" id="percentual_acabamento" value={formData.percentual_acabamento} onChange={handleInputChange} min={0} max={100} disabled={!isEditing} />
                        <NumberInput label="Paisagismo (%)" id="percentual_paisagismo" value={formData.percentual_paisagismo} onChange={handleInputChange} min={0} max={100} disabled={!isEditing} />
                    </div>
                </>
            );
        case 9: // Informações complementares
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextInput label="Administradora" id="administradora" value={formData.administradora} onChange={handleInputChange} disabled={!isEditing} />
                    <TextInput label="Síndico" id="sindico" value={formData.sindico} onChange={handleInputChange} disabled={!isEditing} />
                    <TextInput label="Construtora" id="construtora" value={formData.construtora} onChange={handleInputChange} disabled={!isEditing} />
                    <TextInput label="Incorporadora (Nome)" id="incorporadora" value={formData.incorporadora} onChange={handleInputChange} disabled={!isEditing} />
                    <TextInput label="Projeto Arquitetônico" id="projeto_arquitetonico" value={formData.projeto_arquitetonico} onChange={handleInputChange} disabled={!isEditing} />
                    <TextInput label="Projeto Engenharia" id="projeto_engenharia" value={formData.projeto_engenharia} onChange={handleInputChange} disabled={!isEditing} />
                    <TextInput label="Projeto Decoração" id="projeto_decoracao" value={formData.projeto_decoracao} onChange={handleInputChange} disabled={!isEditing} />
                    <TextInput label="Decoradora" id="decoradora" value={formData.decoradora} onChange={handleInputChange} disabled={!isEditing} />
                    <TextInput label="Ocupação Interna" id="ocupacao_interna" value={formData.ocupacao_interna} onChange={handleInputChange} disabled={!isEditing} />
                </div>
            );
        case 10: // Visibilidade no site
            return (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <ToggleSwitch label="Andamento da Obra Visível" id="andamento_obra_visivel" checked={formData.andamento_obra_visivel} onChange={(checked) => handleCheckboxChange('andamento_obra_visivel', checked)} disabled={!isEditing} />
                    <ToggleSwitch label="Álbum de Fotos Visível" id="album_visivel" checked={formData.album_visivel} onChange={(checked) => handleCheckboxChange('album_visivel', checked)} disabled={!isEditing} />
                    <ToggleSwitch label="Entregas Visível" id="entregas_visivel" checked={formData.entregas_visivel} onChange={(checked) => handleCheckboxChange('entregas_visivel', checked)} disabled={!isEditing} />
                    <ToggleSwitch label="Ficha Técnica Visível" id="ficha_tecnica_visivel" checked={formData.ficha_tecnica_visivel} onChange={(checked) => handleCheckboxChange('ficha_tecnica_visivel', checked)} disabled={!isEditing} />
                    <ToggleSwitch label="Plantas Visível" id="plantas_visivel" checked={formData.plantas_visivel} onChange={(checked) => handleCheckboxChange('plantas_visivel', checked)} disabled={!isEditing} />
                    <ToggleSwitch label="Projeções Visível" id="projecoes_visivel" checked={formData.projecoes_visivel} onChange={(checked) => handleCheckboxChange('projecoes_visivel', checked)} disabled={!isEditing} />
                    <ToggleSwitch label="Tipologias Visível" id="tipologias_visivel" checked={formData.tipologias_visivel} onChange={(checked) => handleCheckboxChange('tipologias_visivel', checked)} disabled={!isEditing} />
                    <ToggleSwitch label="Transações Visível" id="transacoes_visivel" checked={formData.transacoes_visivel} onChange={(checked) => handleCheckboxChange('transacoes_visivel', checked)} disabled={!isEditing} />
                </div>
            );
        case 11: // Anexar ao caso lançamento
            return (
                <>
                    <div className="space-y-2">
                        <label className="block text-sm font-medium text-light-text">Vincular a um Lançamento</label>
                        {renderRadioGroup('vincular_lancamento', booleanOptions)}
                    </div>
                    
                    <div className="space-y-2 mt-4">
                        <label className="block text-sm font-medium text-light-text">Lançamento</label>
                        <select 
                            id="lancamento_id"
                            value={formData.lancamento_id || ''}
                            onChange={handleInputChange}
                            disabled={!formData.vincular_lancamento || !isEditing || isLoadingLookups}
                            className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                        >
                            <option value="">{isLoadingLookups ? 'Carregando...' : 'Selecione o lançamento'}</option>
                            {lancamentos.map(l => <option key={l.id} value={l.id}>{l.nome}</option>)}
                        </select>
                        <Button variant="outline" size="sm" className="mt-2 text-blue-600 border-blue-600 hover:bg-blue-50" disabled={!isEditing}>+ Novo Lançamento (Mock)</Button>
                    </div>
                </>
            );
        default:
            return <p>Passo não encontrado.</p>;
    }
};

export default CondominioFormSteps;
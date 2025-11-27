import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Home, MapPin, DollarSign, Eye, Lock, Key, FileText, Image, List, CheckCircle, Zap, Loader2, Plus, Edit, Save, X } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ImovelInput, VisibilidadeMapa, Ocupacao, ImovelImage, ImovelChave } from '../../types';
import { useAuth } from '../contexts/AuthContext';
import ImovelStep from '../components/ImovelStep';
import { Button } from '../components/ui/Button';
import { useCepLookup } from '../../hooks/useCepLookup';
import { useNominatimLookup } from '../../hooks/useNominatimLookup';
import { uploadImovelMedia, saveMediaMetadata } from '../utils/media';
import ImageCarousel from '../components/ImageCarousel';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning';
import { supabase } from '../integrations/supabase/client';
import ImovelFormSteps from '../components/ImovelFormSteps';
import { validateAllImovelSteps } from '../utils/imovelValidation';
import { syncImovelChaves, fetchImovelChaves } from '../utils/chaveManagement';

// --- Mock Data (Mantido apenas para referência de validação) ---
const propertyTypes = [
    'Apartamento', 'Apartamento Garden', 'Box', 'Campo', 'Casa', 'Casa Comercial', 
    'Casa de Condomínio', 'Chácara', 'Cobertura', 'Conjunto Comercial', 'Duplex', 
    'Fazenda', 'Flat', 'Galpão', 'Geminado', 'Haras', 'Hotel', 'Kitnet', 'Loft', 
    'Loja', 'Pavilhão', 'Ponto Comercial', 'Pousada', 'Prédio Comercial', 
    'Prédio Residencial', 'Sala Comercial', 'Salão Comercial', 'Sobrado', 'Studio', 
    'Sítio', 'Terreno', 'Terreno Comercial', 'Triplex', 'Área Rural'
];
const motives = ['Vendido', 'Alugado', 'Retirado pelo proprietário'];
const occupationOptions: Ocupacao[] = ['Desocupado', 'Ocupado', 'Locado'];
const conditionOptions = ['Em construção', 'Na planta', 'Novo', 'Usado'];
const approvalOptions = ['Aprovado', 'Não aprovado', 'Aguardando'];

const TOTAL_STEPS = 11;

const ViewImovelPage: React.FC = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const { id: imovelId } = useParams<{ id: string }>();

    const [formData, setFormData] = useState<ImovelInput | null>(null);
    const [initialFormData, setInitialFormData] = useState<ImovelInput | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoadingData, setIsLoadingData] = useState(true);
    
    // --- Estado de Mídias ---
    const [images, setImages] = useState<ImovelImage[]>([]);
    const [initialImages, setInitialImages] = useState<ImovelImage[]>([]);
    const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // --- Estado de Chaves ---
    const [initialChaves, setInitialChaves] = useState<ImovelChave[]>([]);
    
    const { data: cepData, lookup: lookupCep } = useCepLookup();
    const { 
        location: nominatimLocation, 
        loading: nominatimLoading, 
        error: nominatimError, 
        lookup: lookupNominatim 
    } = useNominatimLookup();
    
    // Função para verificar se o formulário está 'sujo' (alterado)
    const isFormDirty = useCallback(() => {
        if (!formData || !initialFormData) return false;
        
        const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormData);
        
        const imagesChanged = JSON.stringify(images.map(img => ({ id: img.id, legend: img.legend, isVisible: img.isVisible, rotation: img.rotation, ordem: img.ordem, file: img.file ? true : false }))) !== 
                              JSON.stringify(initialImages.map(img => ({ id: img.id, legend: img.legend, isVisible: img.isVisible, rotation: img.rotation, ordem: img.ordem, file: img.file ? true : false })));

        // NEW: Check if keys changed
        const chavesChanged = JSON.stringify(formData.chaves) !== JSON.stringify(initialChaves);

        return formChanged || imagesChanged || chavesChanged;
    }, [formData, initialFormData, images, initialImages, initialChaves]);
    
    useUnsavedChangesWarning(isEditing && isFormDirty(), 'Você tem alterações não salvas. Tem certeza que quer sair?');


    // --- Função para buscar dados do imóvel ---
    const fetchImovelData = useCallback(async () => {
        if (!imovelId || !session) return;

        setIsLoadingData(true);

        const { data, error } = await supabase
            .from('imoveis')
            .select(`
                *,
                dados_contrato, dados_localizacao, dados_valores, dados_internos, dados_caracteristicas,
                imagens_imovel(id, url, legend, is_visible, rotation, ordem)
            `)
            .eq('id', imovelId)
            .eq('user_id', session.user.id)
            .single();

        if (error) {
            console.error('Erro ao buscar imóvel:', error);
            alert('Não foi possível carregar os dados do imóvel.');
            navigate('/crm/imoveis');
            return;
        }
        
        // Fetch Chaves
        const chavesData = await fetchImovelChaves(imovelId);

        // Mapear dados para o formato do formulário
        const mappedData: ImovelInput = {
            ...data,
            ...data.dados_contrato,
            ...data.dados_localizacao,
            ...data.dados_valores,
            ...data.dados_internos,
            ...data.dados_caracteristicas,
            permutas: data.dados_valores.permutas || [],
            chaves: chavesData, // NEW: Map chaves
        };

        setFormData(mappedData);
        setInitialFormData(mappedData);
        setInitialChaves(chavesData); // NEW: Set initial chaves state

        const mappedImages: ImovelImage[] = data.imagens_imovel
            .map((media: any) => ({
                id: media.id,
                url: media.url,
                file: null,
                legend: media.legend,
                isVisible: media.is_visible,
                rotation: media.rotation,
                ordem: media.ordem,
            }))
            .sort((a: ImovelImage, b: ImovelImage) => a.ordem - b.ordem);

        setImages(mappedImages);
        setInitialImages(mappedImages);
        setIsLoadingData(false);

    }, [imovelId, session, navigate]);

    useEffect(() => {
        fetchImovelData();
    }, [fetchImovelData]);
    
    // --- Handlers de Mídias ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && isEditing) {
            const newFiles = Array.from(e.target.files);
            const newImages: ImovelImage[] = newFiles.map(file => ({
                id: crypto.randomUUID(),
                url: URL.createObjectURL(file),
                file: file,
                legend: '',
                isVisible: true,
                rotation: 0,
                ordem: images.length > 0 ? Math.max(...images.map(img => img.ordem)) + 1 : 0,
            }));
            setImages(prev => [...prev, ...newImages]);
        }
    };

    const handleImageSelect = (id: string, isSelected: boolean) => {
        setSelectedImageIds(prev => 
            isSelected ? [...prev, id] : prev.filter(imgId => imgId !== id)
        );
    };
    
    const handleLegendUpdate = (id: string, legend: string) => {
        setImages(prev => prev.map(img => img.id === id ? { ...img, legend } : img));
    };

    const handleAction = (action: string) => {
        if (selectedImageIds.length === 0 || !isEditing) {
            alert('Selecione pelo menos uma imagem para realizar esta ação.');
            return;
        }

        setImages(prev => {
            let newImages = [...prev];
            
            if (action === 'delete') {
                newImages = newImages.filter(img => !selectedImageIds.includes(img.id));
                selectedImageIds.forEach(id => {
                    const img = prev.find(i => i.id === id);
                    if (img) URL.revokeObjectURL(img.url);
                });
                setSelectedImageIds([]);
                alert(`${selectedImageIds.length} imagem(ns) excluída(s).`);
            } else if (action === 'show') {
                newImages = newImages.map(img => selectedImageIds.includes(img.id) ? { ...img, isVisible: true } : img);
            } else if (action === 'hide') {
                newImages = newImages.map(img => selectedImageIds.includes(img.id) ? { ...img, isVisible: false } : img);
            } else if (action === 'rotate90') {
                newImages = newImages.map(img => selectedImageIds.includes(img.id) ? { ...img, rotation: (img.rotation + 90) % 360 } : img);
            } else if (action === 'rotate180') {
                newImages = newImages.map(img => selectedImageIds.includes(img.id) ? { ...img, rotation: (img.rotation + 180) % 360 } : img);
            }
            
            return newImages;
        });
    };
    
    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedImageIds(images.map(img => img.id));
        } else {
            setSelectedImageIds([]);
        }
    };

    // --- Handlers de Formulário ---
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!formData || !isEditing) return;
        
        const { id, value, type, checked } = e.target as HTMLInputElement;
        
        // Lógica para desmarcar isento se o valor for alterado
        if (id === 'valor_condominio' && parseFloat(value) > 0) {
            setFormData(prev => prev ? ({ ...prev, condominio_isento: false }) : null);
        }
        if (id === 'valor_iptu' && parseFloat(value) > 0) {
            setFormData(prev => prev ? ({ ...prev, iptu_isento: false }) : null);
        }

        setFormData(prev => {
            if (!prev) return null;
            
            let newValue: any = value;

            if (type === 'checkbox') {
                newValue = checked;
            } else if (type === 'number' || id.includes('valor') || id.includes('percent') || id.includes('periodo') || id.includes('acomodacoes') || id.includes('distancia') || id.includes('area')) {
                newValue = value === '' ? 0 : parseFloat(value);
            } else if (id === 'dormitorios' || id === 'suites' || id === 'banheiros' || id === 'vagas_garagem') {
                 newValue = parseInt(value) || 0;
            }
            
            return { ...prev, [id]: newValue };
        });
        setValidationError(null);
    }, [formData, isEditing]);
    
    const handlePersonSelectChange = useCallback((id: keyof ImovelInput, personId: string) => {
        if (!formData || !isEditing) return;
        setFormData(prev => prev ? { ...prev, [id]: personId } : null);
        setValidationError(null);
    }, [formData, isEditing]);
    
    const handleRadioChange = useCallback((name: keyof ImovelInput, value: string) => {
        if (!formData || !isEditing) return;
        setFormData(prev => prev ? { ...prev, [name]: value as any } : null);
        setValidationError(null);
    }, [formData, isEditing]);
    
    const handleToggleChange = useCallback((name: 'vis_venda' | 'vis_locacao' | 'vis_temporada' | 'vis_iptu' | 'vis_condominio', checked: boolean) => {
        if (!formData || !isEditing) return;
        setFormData(prev => prev ? { ...prev, [name]: checked ? 'Visível' : 'Invisível' } : null);
        setValidationError(null);
    }, [formData, isEditing]);
    
    const handleCheckboxGroupChange = useCallback((field: keyof ImovelInput, value: string | boolean) => {
        if (!formData || !isEditing) return;
        setFormData(prev => {
            if (!prev) return null;
            
            if (typeof value === 'boolean') {
                // Lógica para isento
                if (field === 'condominio_isento') {
                    return { ...prev, [field]: value, valor_condominio: value ? 0 : prev.valor_condominio };
                }
                if (field === 'iptu_isento') {
                    return { ...prev, [field]: value, valor_iptu: value ? 0 : prev.valor_iptu };
                }
                return { ...prev, [field]: value as any };
            }
            
            const currentArray = (prev[field] as string[]) || [];
            const newArray = currentArray.includes(value)
                ? currentArray.filter(item => item !== value)
                : [...currentArray, value];
            return { ...prev, [field]: newArray as any };
        });
    }, [formData, isEditing]);
    
    const handleFinalidadeToggle = useCallback((field: 'venda_ativo' | 'locacao_ativo' | 'temporada_ativo', checked: boolean) => {
        if (!formData || !isEditing) return;
        setFormData(prev => {
            if (!prev) return null;
            const newState = { ...prev, [field]: checked };
            
            const activeCount = (newState.venda_ativo ? 1 : 0) + (newState.locacao_ativo ? 1 : 0) + (newState.temporada_ativo ? 1 : 0);
            
            if (activeCount === 0) {
                setValidationError('Pelo menos uma finalidade (Venda, Locação ou Temporada) deve estar ativa.');
                return prev;
            }
            
            setValidationError(null);
            return newState;
        });
    }, [formData, isEditing]);

    const handleCepChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        if (!isEditing) return;
        const cep = e.target.value;
        handleInputChange(e);
        
        if (cep.replace(/\D/g, '').length === 8) {
            lookupCep(cep);
        }
    }, [handleInputChange, lookupCep, isEditing]);
    
    // Efeito para preencher o formulário quando o CEP é encontrado
    useEffect(() => {
        if (cepData && isEditing) {
            setFormData(prev => prev ? ({
                ...prev,
                logradouro: cepData.logradouro || prev.logradouro,
                bairro: cepData.bairro || prev.bairro,
                cidade: cepData.localidade || prev.cidade,
                estado: cepData.uf || prev.estado,
                cep: cepData.cep || prev.cep,
            }) : null);
        }
    }, [cepData, isEditing]);

    // Efeito para geocodificar o endereço completo
    useEffect(() => {
        if (!formData) return;
        const fullAddress = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}`;
        const isAddressValid = formData.cep.replace(/\D/g, '').length === 8 && formData.bairro && formData.logradouro && formData.numero;
        
        if (isAddressValid) {
            lookupNominatim(fullAddress);
        }
    }, [formData?.logradouro, formData?.numero, formData?.bairro, formData?.cidade, formData?.estado, formData?.cep, lookupNominatim, formData]);


    // --- Handlers de Ação ---
    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleCancelEdit = () => {
        if (isFormDirty() && !window.confirm('Você tem alterações não salvas. Deseja descartá-las e cancelar a edição?')) {
            return;
        }
        setIsEditing(false);
        fetchImovelData();
    };

    const checkAllStepsValidity = useCallback((currentData: ImovelInput | null, shouldSetError: boolean = true): boolean => {
        if (!currentData) return false;
        
        const errors = validateAllImovelSteps(currentData);

        if (errors.length > 0) {
            if (shouldSetError) setValidationError(errors.join(' '));
            return false;
        }
        if (shouldSetError) setValidationError(null);
        return true;
    }, []);
    
    const handleSave = async () => {
        if (!formData || !checkAllStepsValidity(formData, true) || !session || !imovelId) return;

        setIsSaving(true);
        
        // 1. Estruturar dados para o Supabase
        const { 
            tipo_imovel, codigo, bairro, logradouro, numero, status_aprovacao,
            venda_ativo, venda_disponibilidade, venda_motivo_indisponibilidade,
            locacao_ativo, locacao_disponibilidade, locacao_motivo_indisponibilidade,
            temporada_ativo, temporada_disponibilidade, temporada_motivo_indisponibilidade,
            cep, estado, cidade, condominio_id, bloco_torre, complemento, referencia, andar, ultimo_andar, mapa_visibilidade,
            valor_venda, valor_locacao, valor_condominio, condominio_isento, valor_iptu, iptu_isento, seguro_incendio, taxa_limpeza, indice_reajuste, valor_base, iptu_periodo, financiavel, permutas, // INCLUINDO PERMUTAS
            proprietario_id, comissao_proprietario_percent, periodo_email_atualizacao, enviar_email_atualizacao, agenciador_id, responsavel_id, honorarios_venda_percent, honorarios_locacao_percent, honorarios_temporada_percent, data_agenciamento, numero_matricula, nao_possui_matricula, numero_iptu, vencimento_exclusividade, ocupacao, exclusivo, placa, medidor_energia, medidor_agua, medidor_gas, observacoes_internas,
            etiquetas, dormitorios, suites, banheiros, vagas_garagem, area_privativa_m2, condicao, mobiliado, orientacao_solar, posicao, entrega_obra, pessoas_acomodacoes, distancia_mar_m, tipos_piso, titulo_site, descricao_site, meta_title, meta_description, vis_endereco, vis_venda, vis_locacao, vis_temporada, vis_iptu, vis_condominio,
            observacoes_aprovacao,
            chaves, // NOVO: Destructure chaves
        } = formData;

        const imovelData = {
            user_id: session.user.id,
            codigo,
            tipo_imovel,
            bairro,
            logradouro,
            numero,
            status_aprovacao,
            
            dados_contrato: {
                venda_ativo, venda_disponibilidade, venda_motivo_indisponibilidade,
                locacao_ativo, locacao_disponibilidade, locacao_motivo_indisponibilidade,
                temporada_ativo, temporada_disponibilidade, temporada_motivo_indisponibilidade,
            },
            dados_localizacao: {
                cep, estado, cidade, condominio_id, bloco_torre, complemento, referencia, andar, ultimo_andar, mapa_visibilidade,
            },
            dados_valores: {
                valor_venda, valor_locacao, valor_condominio, condominio_isento, valor_iptu, iptu_isento, seguro_incendio, taxa_limpeza, indice_reajuste, valor_base, iptu_periodo, financiavel, permutas, // INCLUINDO PERMUTAS
            },
            dados_internos: {
                proprietario_id, comissao_proprietario_percent, periodo_email_atualizacao, enviar_email_atualizacao, agenciador_id, responsavel_id, honorarios_venda_percent, honorarios_locacao_percent, honorarios_temporada_percent, data_agenciamento, numero_matricula, nao_possui_matricula, numero_iptu, vencimento_exclusividade, ocupacao, exclusivo, placa, medidor_energia, medidor_agua, medidor_gas, observacoes_internas,
            },
            dados_caracteristicas: {
                etiquetas, dormitorios, suites, banheiros, vagas_garagem, area_privativa_m2, condicao, mobiliado, orientacao_solar, posicao, entrega_obra, pessoas_acomodacoes, distancia_mar_m, tipos_piso, titulo_site, descricao_site, meta_title, meta_description, vis_endereco, vis_venda, vis_locacao, vis_temporada, vis_iptu, vis_condominio,
            },
            observacoes_aprovacao,
        };

        // 2. Atualizar Imóvel no Banco de Dados
        const { error: imovelError } = await supabase
            .from('imoveis')
            .update(imovelData)
            .eq('id', imovelId);

        if (imovelError) {
            console.error('Erro ao atualizar imóvel:', imovelError);
            alert(`Erro ao salvar o imóvel: ${imovelError.message}`);
            setIsSaving(false);
            return;
        }
        
        // 3. Gerenciamento de Mídias
        const existingImageIds = initialImages.map(img => img.id);
        const currentImageIds = images.map(img => img.id);

        // Imagens a serem excluídas (estavam no initialImages mas não estão mais em images)
        const imagesToDelete = initialImages.filter(img => !currentImageIds.includes(img.id));
        for (const img of imagesToDelete) {
            const { error: deleteDbError } = await supabase
                .from('imagens_imovel')
                .delete()
                .eq('id', img.id);
            if (deleteDbError) {
                console.error(`Erro ao excluir metadados da imagem (${img.id}):`, deleteDbError);
            }
        }

        // Imagens novas (com `file` preenchido)
        const newImagesToUpload = images.filter(img => img.file !== null);
        if (newImagesToUpload.length > 0) {
            const uploadedMedia = await uploadImovelMedia(newImagesToUpload, session.user.id, imovelId);
            if (uploadedMedia.length > 0) {
                const { error: mediaError } = await saveMediaMetadata(imovelId, session.user.id, uploadedMedia);
                if (mediaError) {
                    console.error('Erro ao salvar metadados das novas mídias:', mediaError);
                    alert(`Atenção: Imóvel salvo, mas houve um erro ao salvar as novas mídias: ${mediaError.message}`);
                }
            }
        }

        // Imagens existentes que foram modificadas (sem `file`, mas com metadados alterados)
        const updatedExistingImages = images.filter(img => img.file === null && existingImageIds.includes(img.id))
            .filter(img => {
                const initial = initialImages.find(i => i.id === img.id);
                return initial && (initial.legend !== img.legend || initial.isVisible !== img.isVisible || initial.rotation !== img.rotation || initial.ordem !== img.ordem);
            });
        
        for (const img of updatedExistingImages) {
            const { error: updateError } = await supabase
                .from('imagens_imovel')
                .update({ legend: img.legend, is_visible: img.isVisible, rotation: img.rotation, ordem: img.ordem })
                .eq('id', img.id);
            if (updateError) {
                console.error(`Erro ao atualizar metadados da imagem (${img.id}):`, updateError);
            }
        }
        
        // 4. Sincronizar Chaves
        await syncImovelChaves(imovelId, session.user.id, chaves, initialChaves);

        setIsSaving(false);
        setIsEditing(false);
        alert('Imóvel atualizado com sucesso!');
        fetchImovelData();
    };

    const getStepTitle = (currentStep: number) => {
        const titles = [
            { icon: <Home className="w-5 h-5 mr-2" />, text: 'Dados do Imóvel' },
            { icon: <MapPin className="w-5 h-5 mr-2" />, text: 'Localização' },
            { icon: <DollarSign className="w-5 h-5 mr-2" />, text: 'Valores' },
            { icon: <Eye className="w-5 h-5 mr-2" />, text: 'Visibilidade' },
            { icon: <Lock className="w-5 h-5 mr-2" />, text: 'Dados não visíveis no site' },
            { icon: <Key className="w-5 h-5 mr-2" />, text: 'Chaves' },
            { icon: <FileText className="w-5 h-5 mr-2" />, text: 'Documentos Anexados (Placeholder)' },
            { icon: <Image className="w-5 h-5 mr-2" />, text: 'Mídias' },
            { icon: <List className="w-5 h-5 mr-2" />, text: 'Características' },
            { icon: <Zap className="w-5 h-5 mr-2" />, text: 'Sites e portais (Placeholder)' },
            { icon: <CheckCircle className="w-5 h-5 mr-2" />, text: 'Aprovação do imóvel' },
        ];
        const titleData = titles[currentStep - 1];
        return <span className="flex items-center">{titleData.icon} {titleData.text}</span>;
    };

    const allSteps = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1);

    if (isLoadingData || !formData) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                <p className="text-gray-600">Carregando dados do imóvel...</p>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
            <h1 className="text-2xl font-bold text-dark-text flex items-center">
                <Home className="w-6 h-6 mr-2 text-blue-600" /> INÍCIO &gt; IMÓVEIS &gt; EDITAR ({formData?.codigo || '...' })
            </h1>
            
            {validationError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md max-w-4xl mx-auto">
                    <p className="font-semibold">Erro de Validação:</p>
                    <p className="text-sm">{validationError}</p>
                </div>
            )}

            {/* Carrossel de Imagens (fora dos passos) */}
            <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
                <div className="relative h-64">
                    <ImageCarousel 
                        media={images.filter(img => img.isVisible)}
                        defaultImageUrl="/LOGO LARANJA.png"
                        altText={`Imóvel ${formData?.codigo || '...'}`}
                    />
                </div>
            </div>

            {/* Botões de Ação Global (Editar/Salvar/Cancelar) */}
            <div className="flex justify-end space-x-3 mb-6 max-w-4xl mx-auto">
                {!isEditing ? (
                    <Button 
                        onClick={handleEdit}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Edit className="w-4 h-4 mr-2" /> Editar Imóvel
                    </Button>
                ) : (
                    <>
                        <Button 
                            onClick={handleCancelEdit}
                            variant="outline"
                            className="text-gray-700 border-gray-300 hover:bg-gray-100"
                            disabled={isSaving}
                        >
                            <X className="w-4 h-4 mr-2" /> Cancelar Edição
                        </Button>
                        <Button 
                            onClick={handleSave}
                            className="bg-primary-orange hover:bg-secondary-orange"
                            disabled={isSaving || !isFormDirty()}
                        >
                            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                            Salvar Alterações
                        </Button>
                    </>
                )}
            </div>

            {/* Renderiza todos os passos em sequência */}
            {allSteps.map(currentStep => (
                <div 
                    key={currentStep} 
                    id={`imovel-step-${currentStep}`}
                >
                    <ImovelStep
                        title={getStepTitle(currentStep)}
                        step={currentStep}
                        totalSteps={TOTAL_STEPS}
                        onNext={() => {}} 
                        onBack={() => {}}
                        onSave={handleSave}
                        isLastStep={false}
                        isFirstStep={false}
                        isStepValid={true}
                        isSaving={isSaving}
                        disabled={!isEditing}
                    >
                        <ImovelFormSteps
                            step={currentStep}
                            formData={formData as ImovelInput}
                            images={images}
                            selectedImageIds={selectedImageIds}
                            isEditing={isEditing}
                            fileInputRef={fileInputRef}
                            handleInputChange={handleInputChange}
                            handleCepChange={handleCepChange}
                            handleRadioChange={handleRadioChange}
                            handleToggleChange={handleToggleChange}
                            handleCheckboxGroupChange={handleCheckboxGroupChange}
                            handleFinalidadeToggle={handleFinalidadeToggle}
                            handlePersonSelectChange={handlePersonSelectChange}
                            handleFileSelect={handleFileSelect}
                            handleImageSelect={handleImageSelect}
                            handleLegendUpdate={handleLegendUpdate}
                            handleAction={handleAction}
                            handleSelectAll={handleSelectAll}
                            // Props de Geocodificação
                            nominatimLocation={nominatimLocation}
                            nominatimLoading={nominatimLoading}
                            nominatimError={nominatimError}
                            setFormData={setFormData}
                        />
                    </ImovelStep>
                </div>
            ))}
        </div>
    );
};

export default ViewImovelPage;
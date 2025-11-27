import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Home, MapPin, DollarSign, Eye, Lock, Key, FileText, Image, List, CheckCircle, Zap, Loader2, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { ImovelInput, VisibilidadeMapa, Ocupacao, ImovelImage } from '../../types';
import { useAuth } from '../contexts/AuthContext';
import ImovelStep from '../components/ImovelStep';
import { Button } from '../components/ui/Button';
import { useCepLookup } from '../../hooks/useCepLookup';
import { useNominatimLookup } from '../../hooks/useNominatimLookup';
import { uploadImovelMedia, saveMediaMetadata } from '../utils/media';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning';
import ImovelFormSteps from '../components/ImovelFormSteps';
import { validateImovelStep } from '../utils/imovelValidation';
import { supabase } from '../integrations/supabase/client';
import { syncImovelChaves } from '../utils/chaveManagement';

// --- Mock Data ---
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

// Helper para gerar código randômico de 5 dígitos
const generateRandomCode = () => String(Math.floor(10000 + Math.random() * 90000));

// --- Initial State ---
const getInitialState = (): ImovelInput => ({
    tipo_imovel: '',
    codigo: generateRandomCode(),
    venda_ativo: false, 
    venda_disponibilidade: 'Disponível',
    venda_motivo_indisponibilidade: '',
    locacao_ativo: false,
    locacao_disponibilidade: 'Indisponível',
    locacao_motivo_indisponibilidade: '',
    temporada_ativo: false,
    temporada_disponibilidade: 'Indisponível',
    temporada_motivo_indisponibilidade: '',

    // Step 2: Localização
    condominio_id: '',
    bloco_torre: '',
    cep: '',
    estado: 'RS', 
    cidade: 'Pelotas',
    bairro: '',
    logradouro: '',
    numero: '',
    complemento: '',
    referencia: '',
    andar: 'Nenhum',
    ultimo_andar: 'Não',
    mapa_visibilidade: 'Exata',

    // Step 3: Valores
    valor_venda: 0,
    valor_locacao: 0,
    valor_condominio: 0,
    condominio_isento: false,
    valor_iptu: 0,
    iptu_isento: false,
    seguro_incendio: 0,
    taxa_limpeza: 0,
    indice_reajuste: 'IGP-M',
    valor_base: 0,
    iptu_periodo: 'Mensal',
    financiavel: 'Não',
    permutas: [], // NOVO: Inicializa array de permutas

    // Step 4: Visibilidade
    vis_endereco: 'Todas acima incluindo logradouro',
    vis_venda: 'Invisível',
    vis_locacao: 'Invisível',
    vis_temporada: 'Invisível',
    vis_iptu: 'Invisível',
    vis_condominio: 'Invisível',

    // Step 5: Dados não visíveis no site
    proprietario_id: '',
    comissao_proprietario_percent: 100,
    periodo_email_atualizacao: 30,
    enviar_email_atualizacao: true,
    agenciador_id: '',
    responsavel_id: '',
    honorarios_venda_percent: 0,
    honorarios_locacao_percent: 0,
    honorarios_temporada_percent: 0,
    data_agenciamento: new Date().toISOString().split('T')[0],
    numero_matricula: '',
    nao_possui_matricula: false,
    numero_iptu: '',
    vencimento_exclusividade: '',
    ocupacao: 'Desocupado',
    exclusivo: 'Não',
    placa: 'Não',
    medidor_energia: '',
    medidor_agua: '',
    medidor_gas: '',
    observacoes_internas: '',
    
    // Step 6: Chaves (NOVO)
    chaves: [],

    // Step 9: Características
    etiquetas: '',
    dormitorios: 0,
    suites: 0,
    banheiros: 0,
    vagas_garagem: 0,
    area_privativa_m2: 0,
    condicao: 'Usado',
    mobiliado: 'Não',
    orientacao_solar: 'Norte',
    posicao: 'Frente',
    entrega_obra: '',
    pessoas_acomodacoes: 0,
    distancia_mar_m: 0,
    tipos_piso: [],
    titulo_site: '',
    descricao_site: '',
    meta_title: '',
    meta_description: '',

    // Step 11: Aprovação do imóvel
    status_aprovacao: 'Aguardando',
    observacoes_aprovacao: '',
});

const TOTAL_STEPS = 11;

const NewImovelPage: React.FC = () => {
    const { supabase, session } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<ImovelInput>(getInitialState);
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
    
    // --- Estado de Mídias ---
    const [images, setImages] = useState<ImovelImage[]>([]);
    const [selectedImageIds, setSelectedImageIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { data: cepData, lookup: lookupCep } = useCepLookup();
    const { 
        location: nominatimLocation, 
        loading: nominatimLoading, 
        error: nominatimError, 
        lookup: lookupNominatim 
    } = useNominatimLookup();
    
    // Estado inicial para comparação (usamos uma cópia do estado inicial)
    const initialFormState = useRef(getInitialState());
    
    // Função para verificar se o formulário está 'sujo' (alterado)
    const isFormDirty = useCallback(() => {
        const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormState.current);
        const imagesChanged = images.length > 0;
        return formChanged || imagesChanged;
    }, [formData, images]);
    
    useUnsavedChangesWarning(isFormDirty(), 'Você tem alterações não salvas. Tem certeza que quer sair?');

    // --- Handlers de Mídias ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const newImages: ImovelImage[] = newFiles.map((file, index) => ({
                id: crypto.randomUUID(),
                url: URL.createObjectURL(file),
                file: file,
                legend: '',
                isVisible: true,
                rotation: 0,
                ordem: images.length + index,
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
        if (selectedImageIds.length === 0) {
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
        const { id, value, type } = e.target as HTMLInputElement;
        
        // Lógica para desmarcar isento se o valor for alterado
        if (id === 'valor_condominio' && parseFloat(value) > 0) {
            setFormData(prev => ({ ...prev, condominio_isento: false }));
        }
        if (id === 'valor_iptu' && parseFloat(value) > 0) {
            setFormData(prev => ({ ...prev, iptu_isento: false }));
        }

        setFormData(prev => {
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
    }, []);
    
    const handlePersonSelectChange = useCallback((id: keyof ImovelInput, personId: string) => {
        setFormData(prev => ({ ...prev, [id]: personId }));
        setValidationError(null);
    }, []);
    
    const handleRadioChange = useCallback((name: keyof ImovelInput, value: string) => {
        setFormData(prev => ({ ...prev, [name]: value as any }));
        setValidationError(null);
    }, []);
    
    const handleToggleChange = useCallback((name: 'vis_venda' | 'vis_locacao' | 'vis_temporada' | 'vis_iptu' | 'vis_condominio', checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked ? 'Visível' : 'Invisível' }));
        setValidationError(null);
    }, []);
    
    const handleCheckboxGroupChange = useCallback((field: keyof ImovelInput, value: string | boolean) => {
        setFormData(prev => {
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
        setValidationError(null);
    }, []);
    
    const handleFinalidadeToggle = useCallback((field: 'venda_ativo' | 'locacao_ativo' | 'temporada_ativo', checked: boolean) => {
        setFormData(prev => {
            const newState = { ...prev, [field]: checked };
            
            const activeCount = (newState.venda_ativo ? 1 : 0) + (newState.locacao_ativo ? 1 : 0) + (newState.temporada_ativo ? 1 : 0);
            
            if (activeCount === 0) {
                setValidationError('Pelo menos uma finalidade (Venda, Locação ou Temporada) deve estar ativa.');
                return prev;
            }
            
            setValidationError(null);
            return newState;
        });
    }, []);

    const handleCepChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const cep = e.target.value;
        handleInputChange(e);
        
        if (cep.replace(/\D/g, '').length === 8) {
            lookupCep(cep);
        }
    }, [handleInputChange, lookupCep]);
    
    // Efeito para preencher o formulário quando o CEP é encontrado
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

    // Efeito para geocodificar o endereço completo
    useEffect(() => {
        const fullAddress = `${formData.logradouro}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}`;
        const isAddressValid = formData.cep.replace(/\D/g, '').length === 8 && formData.bairro && formData.logradouro && formData.numero;
        
        if (isAddressValid) {
            lookupNominatim(fullAddress);
        }
    }, [formData.logradouro, formData.numero, formData.bairro, formData.cidade, formData.estado, formData.cep, lookupNominatim]);


    const checkStepValidity = useCallback((currentData: ImovelInput, currentStep: number, shouldSetError: boolean = true): boolean => {
        const errors = validateImovelStep(currentData, currentStep);

        if (errors.length > 0) {
            if (shouldSetError) {
                setValidationError(errors.join(' '));
            }
            return false;
        }
        if (shouldSetError) {
            setValidationError(null);
        }
        return true;
    }, []);

    useEffect(() => {
        const isValid = checkStepValidity(formData, step, false);
        setIsCurrentStepValid(isValid);
    }, [formData, step, checkStepValidity]);

    // Scroll to the active step whenever it changes
    useEffect(() => {
        const activeStepElement = document.getElementById(`imovel-step-${step}`);
        if (activeStepElement) {
            activeStepElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [step]);


    const handleNext = () => {
        if (checkStepValidity(formData, step, true)) {
            setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
        }
    };

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 1));
        setValidationError(null);
    };
    
    const handleSubmit = async () => {
        if (!checkStepValidity(formData, TOTAL_STEPS, true)) return;
        if (!session) {
            alert('Você precisa estar logado para salvar o imóvel.');
            return;
        }

        setIsSaving(true);
        
        // 1. Estruturando os dados para o Supabase
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

        // 2. Inserir Imóvel no Banco de Dados
        const { data: insertedImovel, error: imovelError } = await supabase
            .from('imoveis')
            .insert(imovelData)
            .select('id')
            .single();

        if (imovelError) {
            console.error('Erro ao salvar imóvel:', imovelError);
            alert(`Erro ao salvar o imóvel: ${imovelError.message}`);
            setIsSaving(false);
            return;
        }
        
        const imovelId = insertedImovel.id;
        
        // 3. Upload de Mídias e Salvamento de Metadados
        if (images.length > 0) {
            const uploadedMedia = await uploadImovelMedia(images, session.user.id, imovelId);
            
            if (uploadedMedia.length > 0) {
                const { error: mediaError } = await saveMediaMetadata(imovelId, session.user.id, uploadedMedia);
                
                if (mediaError) {
                    console.error('Erro ao salvar metadados das mídias:', mediaError);
                    alert(`Atenção: Imóvel salvo, mas houve um erro ao salvar as mídias: ${mediaError.message}`);
                }
            }
        }
        
        // 4. Salvar Chaves (Syncing new keys with an empty initial list)
        if (chaves.length > 0) {
            await syncImovelChaves(imovelId, session.user.id, chaves, []);
        }

        setIsSaving(false);
        alert('Imóvel cadastrado com sucesso!');
        navigate('/crm/imoveis');
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

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
            <h1 className="text-2xl font-bold text-dark-text flex items-center">
                <Home className="w-6 h-6 mr-2 text-blue-600" /> INÍCIO &gt; IMÓVEIS &gt; NOVO
            </h1>
            
            {validationError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md max-w-4xl mx-auto">
                    <p className="font-semibold">Erro de Validação:</p>
                    <p className="text-sm">{validationError}</p>
                </div>
            )}

            {/* Renderiza todos os passos */}
            {allSteps.map(currentStep => (
                <div 
                    key={currentStep} 
                    id={`imovel-step-${currentStep}`}
                    className={`transition-opacity duration-500 ${currentStep === step ? 'opacity-100' : 'opacity-30 pointer-events-none'}`}
                >
                    <ImovelStep
                        title={getStepTitle(currentStep)}
                        step={currentStep}
                        totalSteps={TOTAL_STEPS}
                        onNext={handleNext}
                        onBack={handleBack}
                        onSave={handleSubmit}
                        isLastStep={currentStep === TOTAL_STEPS}
                        isFirstStep={currentStep === 1}
                        isStepValid={currentStep === step ? isCurrentStepValid : true}
                        isSaving={isSaving}
                    >
                        <ImovelFormSteps
                            step={currentStep}
                            formData={formData}
                            images={images}
                            selectedImageIds={selectedImageIds}
                            isEditing={true} // Sempre editando na página de novo
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

export default NewImovelPage;
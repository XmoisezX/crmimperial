import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Home, Building2, Loader2, Plus, MapPin, List, FileText, Image, CheckCircle, Zap, Lock, Eye } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { CondominioInput, CondominioMedia } from '../../types';
import { useAuth } from '../contexts/AuthContext';
import ImovelStep from '../components/ImovelStep'; // Reusing ImovelStep for layout
import { useCepLookup } from '../../hooks/useCepLookup';
import { useNominatimLookup } from '../../hooks/useNominatimLookup';
import { useUnsavedChangesWarning } from '../hooks/useUnsavedChangesWarning';
import { supabase } from '../integrations/supabase/client';
import CondominioFormSteps from '../components/CondominioFormSteps';
import { validateCondominioStep } from '../utils/condominioValidation';
import { uploadCondominioMedia, saveCondominioMediaMetadata, uploadCondominioLogo } from '../utils/media';

const TOTAL_STEPS = 11;

// --- Initial State ---
const getInitialState = (): CondominioInput => ({
    nome: '',
    ficha: false,
    loteamento: false,
    incorporadora_id: null,
    area_terreno_m2: 0,
    ano_termino: new Date().getFullYear(),
    arquitetura: '',
    logo_url: '',

    // 2. Localização
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    cidade: 'Pelotas',
    estado: 'RS',
    bairro: '',
    referencia: '',
    latitude: null,
    longitude: null,

    // 3. Características
    caracteristicas_ids: [], 

    // 4. Descrição
    descricao: '',

    // 5. Website
    website_url: '',
    meta_description: '',
    slug: '',

    // 8. Andamento de obra
    estagio: '',
    destaque_obra: false,
    entrega_obra: '',
    percentual_projeto: 0,
    percentual_terraplanagem: 0,
    percentual_fundacao: 0,
    percentual_estrutura: 0,
    percentual_alvenaria: 0,
    percentual_instalacoes: 0,
    percentual_acabamento: 0,
    percentual_paisagismo: 0,

    // 9. Informações complementares
    administradora: '',
    sindico: '',
    construtora: '',
    incorporadora: '',
    projeto_arquitetonico: '',
    projeto_engenharia: '',
    projeto_decoracao: '',
    decoradora: '',
    ocupacao_interna: '',

    // 10. Visibilidade no site
    andamento_obra_visivel: false,
    album_visivel: false,
    entregas_visivel: false,
    ficha_tecnica_visivel: false,
    plantas_visivel: false,
    projecoes_visivel: false,
    tipologias_visivel: false,
    transacoes_visivel: false,

    // 11. Anexar ao caso lançamento
    vincular_lancamento: false,
    lancamento_id: null,
});

const NewCondominioPage: React.FC = () => {
    const { session } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<CondominioInput>(getInitialState);
    const [isSaving, setIsSaving] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    const [isCurrentStepValid, setIsCurrentStepValid] = useState(false);
    
    // --- Estado de Mídias ---
    const [media, setMedia] = useState<CondominioMedia[]>([]);
    const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    const { data: cepData, lookup: lookupCep } = useCepLookup();
    const { 
        location: nominatimLocation, 
        loading: nominatimLoading, 
        error: nominatimError, 
        lookup: lookupNominatim 
    } = useNominatimLookup();
    
    const initialFormState = useRef(getInitialState());
    
    const isFormDirty = useCallback(() => {
        const formChanged = JSON.stringify(formData) !== JSON.stringify(initialFormState.current);
        const mediaChanged = media.length > 0; // Simplificação: qualquer mídia adicionada/removida
        return formChanged || mediaChanged;
    }, [formData, media]);
    
    useUnsavedChangesWarning(isFormDirty(), 'Você tem alterações não salvas. Deseja descartá-las e sair?');

    // --- Handlers de Mídias ---
    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            const newMedia: CondominioMedia[] = newFiles.map((file, index) => ({
                id: crypto.randomUUID(),
                url: URL.createObjectURL(file),
                file: file,
                tipo: file.type.startsWith('image') ? 'imagem' : 'video',
                destaque: false,
                ordem: media.length + index,
            }));
            setMedia(prev => [...prev, ...newMedia]);
        }
    };

    const handleMediaSelect = (id: string, isSelected: boolean) => {
        setSelectedMediaIds(prev => 
            isSelected ? [...prev, id] : prev.filter(mediaId => mediaId !== id)
        );
    };
    
    const handleMediaAction = (action: string) => {
        if (selectedMediaIds.length === 0) {
            alert('Selecione pelo menos uma mídia para realizar esta ação.');
            return;
        }

        setMedia(prev => {
            let newMedia = [...prev];
            
            if (action === 'delete') {
                newMedia = newMedia.filter(item => !selectedMediaIds.includes(item.id));
                selectedMediaIds.forEach(id => {
                    const item = prev.find(i => i.id === id);
                    if (item && item.url.startsWith('blob:')) {
                        URL.revokeObjectURL(item.url);
                    }
                });
                setSelectedMediaIds([]);
                alert(`${selectedMediaIds.length} mídia(s) excluída(s).`);
            } else if (action === 'show') {
                newMedia = newMedia.map(item => selectedMediaIds.includes(item.id) ? { ...item, destaque: true } : item);
            } else if (action === 'hide') {
                newMedia = newMedia.map(item => selectedMediaIds.includes(item.id) ? { ...item, destaque: false } : item);
            }
            
            return newMedia;
        });
    };
    
    const handleSelectAllMedia = (checked: boolean) => {
        if (checked) {
            setSelectedMediaIds(media.map(item => item.id));
        } else {
            setSelectedMediaIds([]);
        }
    };
    
    const handleLogoUploadSuccess = useCallback(async (url: string): Promise<boolean> => {
        setFormData(prev => ({ ...prev, logo_url: url }));
        return true;
    }, []);

    // --- Handlers de Formulário ---
    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { id, value, type } = e.target as HTMLInputElement;

        setFormData(prev => {
            let newValue: any = value;

            if (type === 'number' || id.includes('area') || id.includes('ano') || id.includes('percentual')) {
                newValue = value === '' ? 0 : parseFloat(value);
            } else if (id.includes('_id')) {
                newValue = value === '' ? null : parseInt(value);
            }
            
            return { ...prev, [id]: newValue };
        });
        setValidationError(null);
    }, []);
    
    const handleRadioChange = useCallback((name: keyof CondominioInput, value: string) => {
        setFormData(prev => ({ ...prev, [name]: (value === 'true' || value === 'Sim') ? true : (value === 'false' || value === 'Não') ? false : value } as any));
        setValidationError(null);
    }, []);
    
    const handleCheckboxChange = useCallback((name: keyof CondominioInput, checked: boolean) => {
        setFormData(prev => ({ ...prev, [name]: checked } as any));
        setValidationError(null);
    }, []);
    
    const handleCheckboxGroupChange = useCallback((field: keyof CondominioInput, value: number) => {
        setFormData(prev => {
            const currentArray = (prev[field] as number[]) || [];
            const newArray = currentArray.includes(value)
                ? currentArray.filter(item => item !== value)
                : [...currentArray, value];
            return { ...prev, [field]: newArray as any };
        });
        setValidationError(null);
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
                endereco: cepData.logradouro || prev.endereco,
                bairro: cepData.bairro || prev.bairro,
                cidade: cepData.localidade || prev.cidade,
                estado: cepData.uf || prev.estado,
                cep: cepData.cep || prev.cep,
            }));
        }
    }, [cepData]);

    // Efeito para geocodificar o endereço completo
    useEffect(() => {
        const fullAddress = `${formData.endereco}, ${formData.numero} - ${formData.bairro}, ${formData.cidade} - ${formData.estado}`;
        const isAddressValid = formData.cep.replace(/\D/g, '').length === 8 && formData.bairro && formData.endereco && formData.numero;
        
        if (isAddressValid) {
            lookupNominatim(fullAddress);
        }
    }, [formData.endereco, formData.numero, formData.bairro, formData.cidade, formData.estado, formData.cep, lookupNominatim]);
    
    // Efeito para atualizar a validade do passo atual
    useEffect(() => {
        const errors = validateCondominioStep(formData, step);
        setIsCurrentStepValid(errors.length === 0);
    }, [formData, step]);


    const handleNext = () => {
        const errors = validateCondominioStep(formData, step);
        if (errors.length === 0) {
            setStep(prev => Math.min(prev + 1, TOTAL_STEPS));
            setValidationError(null);
        } else {
            setValidationError(errors.join(' '));
        }
    };

    const handleBack = () => {
        setStep(prev => Math.max(prev - 1, 1));
        setValidationError(null);
    };
    
    const handleSubmit = async () => {
        const errors = validateCondominioStep(formData, TOTAL_STEPS);
        if (errors.length > 0) {
            setValidationError(errors.join(' '));
            return;
        }
        if (!session) {
            alert('Você precisa estar logado para salvar o condomínio.');
            return;
        }

        setIsSaving(true);
        
        // 1. Estruturando os dados para o Supabase
        const { 
            nome, ficha, loteamento, incorporadora_id, area_terreno_m2, ano_termino, arquitetura, logo_url,
            cep, endereco, numero, complemento, cidade, estado, bairro, referencia, latitude, longitude,
            descricao, website_url, meta_description, slug,
            administradora, sindico, construtora, incorporadora, projeto_arquitetonico, projeto_engenharia, projeto_decoracao, decoradora, ocupacao_interna,
            andamento_obra_visivel, album_visivel, entregas_visivel, ficha_tecnica_visivel, plantas_visivel, projecoes_visivel, tipologias_visivel, transacoes_visivel,
            vincular_lancamento, lancamento_id,
            estagio, destaque_obra, entrega_obra, percentual_projeto, percentual_terraplanagem, percentual_fundacao, percentual_estrutura, percentual_alvenaria, percentual_instalacoes, percentual_acabamento, percentual_paisagismo,
            caracteristicas_ids,
        } = formData;

        const condominioData = {
            user_id: session.user.id,
            nome, ficha, loteamento, incorporadora_id, area_terreno_m2, ano_termino, arquitetura, logo_url,
            cep, endereco, numero, complemento, cidade, estado, bairro, referencia, 
            latitude: nominatimLocation?.lat || latitude, 
            longitude: nominatimLocation?.lng || longitude,
            descricao, website_url, meta_description, slug,
            administradora, sindico, construtora, incorporadora, projeto_arquitetonico, projeto_engenharia, projeto_decoracao, decoradora, ocupacao_interna,
            andamento_obra_visivel, album_visivel, entregas_visivel, ficha_tecnica_visivel, plantas_visivel, projecoes_visivel, tipologias_visivel, transacoes_visivel,
            vincular_lancamento, lancamento_id,
        };

        // 2. Inserir Condomínio no Banco de Dados
        const { data: insertedCondominio, error: condominioError } = await supabase
            .from('condominios')
            .insert(condominioData)
            .select('id')
            .single();

        if (condominioError) {
            console.error('Erro ao salvar condomínio:', condominioError);
            alert(`Erro ao salvar o condomínio: ${condominioError.message}`);
            setIsSaving(false);
            return;
        }
        
        const condominioId = insertedCondominio.id;
        
        // 3. Upload de Logo (se houver um novo arquivo no estado de logo)
        const logoFile = media.find(m => m.id === 'logo' && m.file);
        if (logoFile && logoFile.file) {
            const { url: newLogoUrl, error: logoUploadError } = await uploadCondominioLogo(logoFile.file, condominioId);
            if (logoUploadError) {
                console.error('Erro ao fazer upload do logo:', logoUploadError);
            } else if (newLogoUrl) {
                // Atualiza o logo_url no banco de dados principal
                await supabase.from('condominios').update({ logo_url: newLogoUrl }).eq('id', condominioId);
            }
        }

        // 4. Upload de Mídias e Salvamento de Metadados (Imagens/Vídeos)
        const mediaToUpload = media.filter(m => m.id !== 'logo' && m.file);
        if (mediaToUpload.length > 0) {
            const uploadedMedia = await uploadCondominioMedia(mediaToUpload, session.user.id, condominioId);
            if (uploadedMedia.length > 0) {
                const { error: mediaError } = await saveCondominioMediaMetadata(condominioId, uploadedMedia);
                if (mediaError) {
                    console.error('Erro ao salvar metadados das mídias:', mediaError);
                    alert(`Atenção: Condomínio salvo, mas houve um erro ao salvar as mídias: ${mediaError.message}`);
                }
            }
        }
        
        // 5. Salvar Características (N:N)
        const caracData = caracteristicas_ids.map(carac_id => ({
            condominio_id: condominioId,
            caracteristica_id: carac_id,
        }));
        if (caracData.length > 0) {
            const { error: caracError } = await supabase.from('condominio_caracteristicas').insert(caracData);
            if (caracError) console.error('Erro ao salvar características:', caracError);
        }
        
        // 6. Salvar Andamento de Obra (CondominioObra)
        const obraData = {
            condominio_id: condominioId,
            estagio, destaque_obra, entrega_obra, percentual_projeto, percentual_terraplanagem, percentual_fundacao, percentual_estrutura, percentual_alvenaria, percentual_instalacoes, percentual_acabamento, percentual_paisagismo,
        };
        const { error: obraError } = await supabase.from('condominio_obra').insert(obraData);
        if (obraError) console.error('Erro ao salvar andamento de obra:', obraError);


        setIsSaving(false);
        alert('Condomínio cadastrado com sucesso!');
        navigate('/crm/condominios');
    };

    const getStepTitle = (currentStep: number) => {
        const titles = [
            { icon: <Building2 className="w-5 h-5 mr-2" />, text: 'Dados do Condomínio' },
            { icon: <MapPin className="w-5 h-5 mr-2" />, text: 'Localização' },
            { icon: <List className="w-5 h-5 mr-2" />, text: 'Características' },
            { icon: <FileText className="w-5 h-5 mr-2" />, text: 'Descrição' },
            { icon: <Zap className="w-5 h-5 mr-2" />, text: 'Website' },
            { icon: <FileText className="w-5 h-5 mr-2" />, text: 'Documentos Associados' },
            { icon: <Image className="w-5 h-5 mr-2" />, text: 'Mídias' },
            { icon: <CheckCircle className="w-5 h-5 mr-2" />, text: 'Andamento de Obra' },
            { icon: <Lock className="w-5 h-5 mr-2" />, text: 'Informações Complementares' },
            { icon: <Eye className="w-5 h-5 mr-2" />, text: 'Visibilidade no Site' },
            { icon: <Plus className="w-5 h-5 mr-2" />, text: 'Anexar ao Caso Lançamento' },
        ];
        const titleData = titles[currentStep - 1];
        return <span className="flex items-center">{titleData.icon} {titleData.text}</span>;
    };

    const allSteps = Array.from({ length: TOTAL_STEPS }, (_, i) => i + 1);

    return (
        <div className="p-4 sm:p-6 lg:p-8 animate-fade-in space-y-6">
            <h1 className="text-2xl font-bold text-dark-text flex items-center">
                <Building2 className="w-6 h-6 mr-2 text-blue-600" /> 
                <Link to="/crm/dashboard" className="text-gray-500 hover:text-blue-600 transition-colors">INÍCIO</Link> 
                <span className="mx-2 text-gray-400">&gt;</span> 
                <Link to="/crm/condominios" className="text-gray-500 hover:text-blue-600 transition-colors">CONDOMÍNIOS</Link> 
                <span className="mx-2 text-gray-400">&gt;</span> 
                NOVO
            </h1>
            
            {validationError && (
                <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded-md max-w-4xl mx-auto">
                    <p className="font-semibold">Erro de Validação:</p>
                    <p className="text-sm">{validationError}</p>
                </div>
            )}

            {allSteps.map(currentStep => (
                <div 
                    key={currentStep} 
                    id={`condominio-step-${currentStep}`}
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
                        <CondominioFormSteps
                            step={currentStep}
                            formData={formData}
                            media={media}
                            selectedMediaIds={selectedMediaIds}
                            isEditing={true}
                            fileInputRef={fileInputRef}
                            handleInputChange={handleInputChange}
                            handleCepChange={handleCepChange}
                            handleRadioChange={handleRadioChange}
                            handleCheckboxChange={handleCheckboxChange}
                            handleCheckboxGroupChange={handleCheckboxGroupChange}
                            handleFileSelect={handleFileSelect}
                            handleMediaSelect={handleMediaSelect}
                            handleMediaAction={handleMediaAction}
                            handleSelectAllMedia={handleSelectAllMedia}
                            handleLogoUploadSuccess={handleLogoUploadSuccess}
                            // Props de Geocodificação
                            nominatimLocation={nominatimLocation}
                            nominatimLoading={nominatimLoading}
                            nominatimError={nominatimError}
                        />
                    </ImovelStep>
                </div>
            ))}
        </div>
    );
};

export default NewCondominioPage;
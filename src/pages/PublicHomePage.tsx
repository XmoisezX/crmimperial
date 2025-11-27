import React, { useState, useEffect, useMemo } from 'react';
import { Search, Home, DollarSign, MapPin, CheckCircle, ArrowRight, User, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Link } from 'react-router-dom';
import FloatingSearchForm from '../components/FloatingSearchForm';
import { useImovelLocations } from '../hooks/useImovelLocations'; // USANDO NOVO HOOK
import { useBannerPosition } from '../hooks/useBannerPosition';
import ClientOnly from '../components/ClientOnly';
import { DeviceType, ImageTransform } from '../components/ImageManipulator';
import PublicImovelCard from '../components/PublicImovelCard'; // Importando o novo card

// URL pública da imagem no Supabase Storage
const SUPABASE_HERO_IMAGE_URL = "https://pqievwbfrbiqhvdyalrh.supabase.co/storage/v1/object/public/imovel-media/hero-background.png";

// Mock Data (mantido para as outras seções)
const stats = [
    { value: '100+', label: 'Imóveis Exclusivos' },
    { value: '15', label: 'Anos de Experiência' },
    { value: '98%', label: 'Satisfação do Cliente' },
    { value: 'Pelotas', label: 'Foco Regional' },
];

// Função auxiliar para determinar o dispositivo (mais leve que usar estado)
const getDevice = (): DeviceType => {
    if (window.innerWidth >= 1024) return 'desktop';
    if (window.innerWidth >= 768) return 'tablet';
    return 'mobile';
};

const PublicHomePage: React.FC = () => {
    // Usando o novo hook que já filtra por disponibilidade e geocodifica
    const { imoveis, isLoading: isImoveisLoading, error } = useImovelLocations(); 
    const { settings, isLoading: isSettingsLoading } = useBannerPosition(); 
    const [currentTransform, setCurrentTransform] = useState<ImageTransform | null>(null);

    const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    
    // 1. Efeito para carregar a transformação inicial e monitorar redimensionamento
    useEffect(() => {
        if (isSettingsLoading) return;

        const updateTransform = () => {
            const device = getDevice();
            setCurrentTransform(settings[device]);
        };

        updateTransform();
        window.addEventListener('resize', updateTransform);
        return () => window.removeEventListener('resize', updateTransform);
    }, [settings, isSettingsLoading]);
    
    // 2. Memoização do estilo do banner
    const heroStyle: React.CSSProperties = useMemo(() => {
        let style: React.CSSProperties = {
            backgroundImage: `url('${SUPABASE_HERO_IMAGE_URL}')`,
            minHeight: '650px',
            backgroundRepeat: 'no-repeat',
        };

        if (currentTransform) {
            style.backgroundSize = `${currentTransform.scale * 100}%`;
            style.backgroundPosition = `${50 + currentTransform.offsetX}% ${50 + currentTransform.offsetY}%`;
        } else {
            style.backgroundSize = 'cover';
            style.backgroundPosition = 'center';
        }
        return style;
    }, [currentTransform]);
    
    // Limita os destaques a 3
    const featuredImoveis = imoveis.slice(0, 3);


    return (
        <div className="bg-white">
            {/* 1. Seção de Busca com Background */}
            <div 
                className="relative w-full bg-cover bg-center pb-20 pt-[120px]" 
                style={heroStyle}
            >
                {/* Overlay para escurecer a imagem e melhorar a legibilidade */}
                <div className="absolute inset-0 bg-black opacity-40"></div> 
                <div className="relative z-10">
                    <ClientOnly>
                        {/* Ajuste: Alinhando o formulário à esquerda (justify-start) */}
                        <div className="container mx-auto px-8 flex justify-start">
                            <FloatingSearchForm />
                        </div>
                    </ClientOnly>
                </div>
            </div>

            {/* 2. Stats/KPIs Section (Ajustando o posicionamento para subir e sobrepor a imagem) */}
            <div className="container mx-auto px-8 relative z-10 -mt-16"> 
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary-orange">
                    {stats.map((stat, index) => (
                        <div key={index} className="text-center p-3 border-r last:border-r-0 lg:border-r border-gray-200">
                            <p className="text-3xl font-bold text-primary-orange">{stat.value}</p>
                            <p className="text-sm text-light-text mt-1">{stat.label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* 3. Featured Properties (Imóveis em Destaque) */}
            <div className="container mx-auto p-8 mt-8">
                <h2 className="text-3xl font-bold text-dark-text mb-8 border-b pb-2">Imóveis em Destaque</h2>
                
                {isImoveisLoading && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-orange mr-3" />
                        <p className="ml-3 text-gray-600">Carregando imóveis...</p>
                    </div>
                )}
                
                {error && (
                    <div className="text-red-600 p-4 bg-red-50 rounded-md">Erro ao carregar destaques: {error}</div>
                )}
                
                {!isImoveisLoading && featuredImoveis.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p className="text-lg">Nenhum imóvel aprovado e disponível encontrado para destaque.</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {featuredImoveis.map(prop => (
                        <PublicImovelCard key={prop.id} imovel={prop} />
                    ))}
                </div>
                <div className="text-center mt-10">
                    <Link to="/imoveis">
                        <Button className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-3">
                            Ver Todos os Imóveis
                        </Button>
                    </Link>
                </div>
            </div>

            {/* 4. Why Choose Us Section */}
            <div className="bg-light-orange-bg p-12 mt-12">
                <div className="container mx-auto">
                    <h2 className="text-3xl font-bold text-dark-text text-center mb-10">Por que escolher a Imperial Paris Imóveis?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="text-center p-6 bg-white rounded-lg shadow-md border-t-4 border-blue-500">
                            <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Segurança Jurídica</h3>
                            <p className="text-light-text text-sm">Garantimos que toda a documentação do seu imóvel esteja impecável, do início ao fim do processo.</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-lg shadow-md border-t-4 border-primary-orange">
                            <DollarSign className="w-8 h-8 text-primary-orange mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Melhor Negociação</h3>
                            <p className="text-light-text text-sm">Nossa expertise em Pelotas garante que você obtenha o melhor valor, seja na compra, venda ou locação.</p>
                        </div>
                        <div className="text-center p-6 bg-white rounded-lg shadow-md border-t-4 border-green-500">
                            <User className="w-8 h-8 text-green-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold mb-2">Atendimento Personalizado</h3>
                            <p className="text-light-text text-sm">Você não é apenas um número. Oferecemos consultoria dedicada para atender suas necessidades específicas.</p>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* 5. Testimonials (Mock) */}
            <div className="container mx-auto p-8 mt-8">
                <h2 className="text-3xl font-bold text-dark-text text-center mb-8">O que dizem nossos clientes</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="p-6 bg-gray-50 rounded-lg shadow-inner border-l-4 border-primary-orange">
                        <p className="italic text-dark-text mb-4">"A equipe da Imperial Paris foi fundamental na compra do nosso primeiro apartamento. Profissionais, transparentes e muito atenciosos. Recomendo!"</p>
                        <p className="font-semibold text-sm text-dark-text">- João Silva, Comprador</p>
                    </div>
                    <div className="p-6 bg-gray-50 rounded-lg shadow-inner border-l-4 border-blue-500">
                        <p className="italic text-dark-text mb-4">"Consegui alugar meu imóvel em tempo recorde e com toda a segurança. O serviço de administração é excelente."</p>
                        <p className="font-semibold text-sm text-dark-text">- Maria Torres, Proprietária</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicHomePage;
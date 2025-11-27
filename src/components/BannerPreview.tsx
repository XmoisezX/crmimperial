import React from 'react';
import FloatingSearchForm from './FloatingSearchForm';
import { DeviceType, ImageTransform } from './ImageManipulator';

// URL pública da imagem no Supabase Storage
const SUPABASE_HERO_IMAGE_URL = "https://pqievwbfrbiqhvdyalrh.supabase.co/storage/v1/object/public/imovel-media/hero-background.png";

interface BannerPreviewProps {
    device: DeviceType;
    transform: ImageTransform;
    imageUrl: string;
}

const BannerPreview: React.FC<BannerPreviewProps> = ({ device, transform, imageUrl }) => {
    
    const { scale, offsetX, offsetY } = transform;

    let heroStyle: React.CSSProperties = {
        backgroundImage: `url('${imageUrl}')`,
        minHeight: '650px',
        backgroundAttachment: 'scroll', 
    };
    
    // Aplica a transformação dinâmica em todos os casos
    heroStyle = {
        ...heroStyle,
        backgroundSize: `${scale * 100}%`,
        backgroundPosition: `${50 + offsetX}% ${50 + offsetY}%`,
        backgroundRepeat: 'no-repeat',
    };
    
    // Dimensões simuladas para o preview
    const deviceClasses: Record<DeviceType, string> = {
        desktop: 'w-full', // Usar w-full para expandir
        tablet: 'w-[768px] max-w-full',
        mobile: 'w-[375px] max-w-full',
    };
    
    // Altura do container de visualização
    const previewHeight = '650px';

    return (
        <div className="flex justify-center items-start p-4 bg-gray-100 rounded-lg shadow-inner overflow-hidden">
            <div 
                className={`relative overflow-hidden border-8 border-gray-800 rounded-xl shadow-2xl transition-all duration-300 ${deviceClasses[device]}`}
                style={{ height: previewHeight }}
            >
                {/* 1. Seção de Busca com Background (Simulada) */}
                <div 
                    className="relative w-full bg-cover bg-no-repeat pb-24 pt-32" 
                    style={heroStyle}
                >
                    {/* Overlay para escurecer a imagem e melhorar a legibilidade */}
                    <div className="absolute inset-0 bg-black opacity-40"></div> 
                    <div className="relative z-10">
                        {/* Renderiza o formulário de busca no contexto do preview */}
                        <div className="container mx-auto px-8 flex justify-start">
                            <FloatingSearchForm isPreview={true} />
                        </div>
                    </div>
                </div>
                
                {/* 2. Stats/KPIs Section (Copiada da PublicHomePage) */}
                <div className="relative z-10 -mt-16">
                    <div className="container mx-auto px-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 bg-white p-6 rounded-xl shadow-lg border-t-4 border-primary-orange">
                            <div className="text-center p-3 border-r border-gray-200"><p className="text-3xl font-bold text-primary-orange">100+</p><p className="text-sm text-light-text mt-1">Imóveis</p></div>
                            <div className="text-center p-3 border-r border-gray-200"><p className="text-3xl font-bold text-primary-orange">15</p><p className="text-sm text-light-text mt-1">Anos</p></div>
                            <div className="text-center p-3 border-r border-gray-200"><p className="text-3xl font-bold text-primary-orange">98%</p><p className="text-sm text-light-text mt-1">Satisfação</p></div>
                            <div className="text-center p-3"><p className="text-3xl font-bold text-primary-orange">Pelotas</p><p className="text-sm text-light-text mt-1">Foco</p></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BannerPreview;
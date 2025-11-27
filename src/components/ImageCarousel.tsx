import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image } from 'lucide-react';

interface ImageCarouselProps {
    media: { url: string, rotation: number }[];
    defaultImageUrl: string;
    altText: string;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ media, defaultImageUrl, altText }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    
    const images = media.map(m => ({ url: m.url, rotation: m.rotation }));
    
    // Se não houver mídias, usamos a imagem padrão
    if (images.length === 0) {
        images.push({ url: defaultImageUrl, rotation: 0 });
    }

    const currentImage = images[currentIndex];
    const totalImages = images.length;

    const goToPrevious = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prevIndex) => (prevIndex === 0 ? totalImages - 1 : prevIndex - 1));
    };

    const goToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex((prevIndex) => (prevIndex === totalImages - 1 ? 0 : prevIndex + 1));
    };

    return (
        <div className="relative w-full h-full bg-gray-100 flex items-center justify-center overflow-hidden">
            {/* Imagem Atual */}
            <img 
                src={currentImage.url} 
                alt={`${altText} - Imagem ${currentIndex + 1}`} 
                className="w-full h-full object-cover transition-opacity duration-300"
                style={{ transform: `rotate(${currentImage.rotation}deg)` }}
            />

            {/* Controles de Navegação (apenas se houver mais de uma imagem) */}
            {totalImages > 1 && (
                <>
                    <button
                        onClick={goToPrevious}
                        className="absolute left-1 top-1/2 transform -translate-y-1/2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors z-10"
                        title="Anterior"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                        onClick={goToNext}
                        className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-75 transition-colors z-10"
                        title="Próximo"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </button>
                    
                    {/* Indicador de Imagem */}
                    <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-[10px] px-2 py-0.5 rounded-full">
                        {currentIndex + 1} / {totalImages}
                    </div>
                </>
            )}
            
            {/* Ícone de placeholder se for a imagem padrão */}
            {totalImages === 1 && currentImage.url === defaultImageUrl && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                    <Image className="w-8 h-8 mb-1" />
                    <p className="text-xs">Sem Mídia</p>
                </div>
            )}
        </div>
    );
};

export default ImageCarousel;
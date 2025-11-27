import React, { useState } from 'react';
import { Eye, EyeOff, RotateCw, Search } from 'lucide-react';
import { Checkbox } from './ui/Checkbox';

interface Image {
    id: string;
    url: string;
    legend: string;
    isVisible: boolean;
    rotation: number;
}

interface ImageCardProps {
    image: Image;
    onSelect: (id: string, isSelected: boolean) => void;
    onLegendChange: (id: string, legend: string) => void;
    isSelected: boolean;
    disabled?: boolean; // Nova prop
}

const ImageCard: React.FC<ImageCardProps> = ({ image, onSelect, onLegendChange, isSelected, disabled = false }) => {
    const [legend, setLegend] = useState(image.legend);

    const handleLegendChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!disabled) { // Só permite mudança se não estiver desabilitado
            setLegend(e.target.value);
            onLegendChange(image.id, e.target.value);
        }
    };

    return (
        <div className={`relative border rounded-lg overflow-hidden transition-all duration-200 ${isSelected ? 'border-blue-500 shadow-lg' : 'border-gray-200 hover:shadow-md'} ${disabled ? 'opacity-70' : ''}`}>
            
            {/* Checkbox de Seleção */}
            <div className="absolute top-2 left-2 z-10">
                <Checkbox 
                    id={`select-${image.id}`} 
                    checked={isSelected} 
                    onCheckedChange={(checked) => onSelect(image.id, checked as boolean)}
                    className="w-5 h-5 bg-white border-gray-400 text-blue-600"
                    disabled={disabled} // Desabilita o checkbox
                />
            </div>

            {/* Ações Rápidas (Mock) */}
            <div className="absolute top-2 right-2 z-10 flex flex-col space-y-1">
                <button title={image.isVisible ? 'Ocultar no site' : 'Mostrar no site'} className="p-1 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-600" disabled={disabled}>
                    {image.isVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button title="Girar 90°" className="p-1 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-600" disabled={disabled}>
                    <RotateCw className="w-4 h-4" />
                </button>
                <button title="Zoom" className="p-1 bg-white rounded-full shadow-md text-gray-600 hover:text-blue-600" disabled={disabled}>
                    <Search className="w-4 h-4" />
                </button>
            </div>

            {/* Imagem */}
            <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                <img 
                    src={image.url} 
                    alt={`Imagem ${image.id}`} 
                    className="w-full h-full object-cover"
                    style={{ transform: `rotate(${image.rotation}deg)` }}
                />
            </div>

            {/* Legenda */}
            <div className="p-2 bg-white">
                <input
                    type="text"
                    value={legend}
                    onChange={handleLegendChange}
                    placeholder="Legenda"
                    className="w-full text-xs border-b border-gray-200 focus:border-blue-500 focus:outline-none disabled:bg-gray-50 disabled:text-gray-500"
                    disabled={disabled} // Desabilita o input de legenda
                />
            </div>
        </div>
    );
};

export default ImageCard;
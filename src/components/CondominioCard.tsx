import React from 'react';
import { Building2, MapPin, Maximize2, ChevronRight, Image, Info, DollarSign } from 'lucide-react';
import ImageCarousel from './ImageCarousel';
import { Checkbox } from './ui/Checkbox';

// Interface baseada na estrutura de dados do Supabase (tabela condominios + midias)
interface Condominio {
    id: string;
    nome: string;
    logo_url: string;
    endereco: string;
    numero: string;
    bairro: string;
    cidade: string;
    estado: string;
    area_terreno_m2: number;
    
    // Dados de Obra (para resumo)
    condominio_obra: { estagio: string } | null;
    
    // Mídia (lista completa de mídias)
    condominio_midias: { arquivo_url: string, destaque: boolean, ordem: number }[];
}

interface CondominioCardProps {
    condominio: Condominio;
    onViewDetails: (condominioId: string) => void;
    isSelected: boolean;
    onSelect: (condominioId: string, isSelected: boolean) => void;
}

const CondominioCard: React.FC<CondominioCardProps> = ({ condominio, onViewDetails, isSelected, onSelect }) => {
    
    const defaultImage = '/LOGO LARANJA.png';
    
    // Mídias de destaque (usando a primeira imagem como capa)
    const mediaForCarousel = condominio.condominio_midias
        .filter(m => m.destaque)
        .map(m => ({ url: m.arquivo_url, rotation: 0 }))
        .slice(0, 1); // Apenas a primeira imagem de destaque

    if (mediaForCarousel.length === 0 && condominio.logo_url) {
        mediaForCarousel.push({ url: condominio.logo_url, rotation: 0 });
    }

    const estagio = condominio.condominio_obra?.estagio || 'Não informado';
    
    return (
        <div className={`relative border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 mb-4 group ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            
            {/* Top Bar: Checkbox e Ações */}
            <div className="flex justify-between items-center p-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                    <Checkbox 
                        id={`select-${condominio.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelect(condominio.id, checked as boolean)}
                        className="w-5 h-5 text-blue-600 border-gray-400"
                    />
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${estagio === 'Pronto' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {estagio}
                    </span>
                </div>
                <div className="flex space-x-4 text-gray-500 text-sm font-medium">
                    <button title="Mídias" className="flex items-center hover:text-blue-600 transition-colors"><Image className="w-4 h-4 mr-1" /> Mídias</button>
                    <button title="Informações" className="flex items-center hover:text-blue-600 transition-colors"><Info className="w-4 h-4 mr-1" /> Info</button>
                </div>
            </div>

            {/* Conteúdo Principal do Card */}
            <div className="flex p-3">
                
                {/* 1. Imagem e Nome */}
                <div className="flex-shrink-0 w-56 h-36 relative mr-4 rounded-md overflow-hidden">
                    <ImageCarousel 
                        media={mediaForCarousel}
                        defaultImageUrl={defaultImage}
                        altText={`Condomínio ${condominio.nome}`}
                    />
                    <div className="absolute bottom-0 left-0 bg-black bg-opacity-70 text-white text-xs px-2 py-0.5 font-semibold z-10">
                        {condominio.nome}
                    </div>
                </div>
                
                {/* 2. Detalhes e Características */}
                <div className="flex-1 grid grid-cols-3 gap-x-6">
                    
                    {/* Coluna 1: Endereço */}
                    <div className="col-span-1 flex flex-col justify-center">
                        <p className="text-sm font-semibold text-dark-text leading-tight">{condominio.endereco}, {condominio.numero}</p>
                        <p className="text-sm font-semibold text-dark-text leading-tight mt-1">{condominio.bairro}</p>
                        <p className="text-xs text-light-text leading-tight">{condominio.cidade} - {condominio.estado}</p>
                    </div>
                    
                    {/* Coluna 2: Características (Mock) */}
                    <div className="col-span-1 grid grid-cols-2 gap-y-1 text-sm text-dark-text">
                        <div className="flex items-center space-x-2">
                            <Maximize2 className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{condominio.area_terreno_m2} m²</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <DollarSign className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">R$ 300k+</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Building2 className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">12 Tipos</span>
                        </div>
                    </div>
                    
                    {/* Coluna 3: Ação */}
                    <div className="col-span-1 flex flex-col items-end justify-center text-right relative pr-8">
                        <p className="text-xs text-light-text">Imóveis Disponíveis</p>
                        <p className="text-lg font-bold text-dark-text">15</p>
                        
                        <button 
                            onClick={() => onViewDetails(condominio.id)}
                            className="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center text-blue-600 hover:text-primary-orange transition-all duration-200 hover:border-r-4 hover:border-primary-orange"
                            title="Ver Detalhes"
                        >
                            <ChevronRight className="w-6 h-6" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CondominioCard;
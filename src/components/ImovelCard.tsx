import React from 'react';
import { Bed, Bath, Car, Maximize2, ChevronRight, Image, RefreshCw, Info, Square as CheckboxIcon } from 'lucide-react';
import ImageCarousel from './ImageCarousel'; // Importando o carrossel
import { Link } from 'react-router-dom'; // Importando Link
import { Checkbox } from './ui/Checkbox'; // Importando Checkbox shadcn/ui

// Interface baseada na estrutura de dados do Supabase (tabela imoveis + primeira midia)
interface Imovel {
    id: string;
    codigo: string;
    bairro: string;
    logradouro: string;
    numero: string;
    status_aprovacao: 'Aprovado' | 'Não aprovado' | 'Aguardando';
    
    // Dados JSONB
    dados_contrato: {
        venda_ativo: boolean;
        locacao_ativo: boolean;
        venda_disponibilidade: 'Disponível' | 'Indisponível';
        locacao_disponibilidade: 'Disponível' | 'Indisponível';
    };
    dados_valores: {
        valor_venda: number;
        valor_locacao: number;
        valor_condominio: number;
        valor_iptu: number;
        iptu_periodo: 'Mensal' | 'Anual';
    };
    dados_localizacao: {
        cidade: string;
        estado: string;
    };
    dados_caracteristicas: {
        tipo_imovel: string;
        dormitorios: number;
        suites: number;
        banheiros: number;
        vagas_garagem: number;
        area_privativa_m2: number; // NOVO CAMPO
    };
    
    // Mídia (lista completa de mídias)
    imagens_imovel: { id: string, url: string, rotation: number, ordem: number }[]; // Adicionado 'id' e 'ordem'
}

interface ImovelCardProps {
    imovel: Imovel;
    onViewDetails: (imovelId: string) => void;
    isSelected: boolean; // Nova prop
    onSelect: (imovelId: string, isSelected: boolean) => void; // Nova prop
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const ImovelCard: React.FC<ImovelCardProps> = ({ imovel, onViewDetails, isSelected, onSelect }) => {
    
    const isVenda = imovel.dados_contrato.venda_ativo;
    const isLocacao = imovel.dados_contrato.locacao_ativo;
    
    const statusText = isVenda ? 'Venda' : (isLocacao ? 'Locação' : 'Indefinido');
    const statusColor = isVenda ? 'text-red-600' : 'text-blue-600';
    
    const isAvailable = (isVenda && imovel.dados_contrato.venda_disponibilidade === 'Disponível') || 
                        (isLocacao && imovel.dados_contrato.locacao_disponibilidade === 'Disponível');
    
    const price = isVenda ? imovel.dados_valores.valor_venda : imovel.dados_valores.valor_locacao;
    const type = imovel.dados_caracteristicas.tipo_imovel;
    
    const defaultImage = '/LOGO LARANJA.png';
    
    // Mídias visíveis (já vêm ordenadas do ImoveisPage.tsx)
    const mediaForCarousel = imovel.imagens_imovel
        .filter(m => m.url) // Garante que a URL existe
        .map(m => ({ url: m.url, rotation: m.rotation }));

    // Dados de características
    const { dormitorios, suites, banheiros, vagas_garagem, area_privativa_m2 } = imovel.dados_caracteristicas;
    
    // Formatação do IPTU
    const iptuValue = imovel.dados_valores.valor_iptu;
    const iptuPeriodo = imovel.dados_valores.iptu_periodo === 'Anual' ? '(anual)' : '(mensal)';

    return (
        <div className={`relative border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 mb-4 group ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
            
            {/* Top Bar: Checkbox e Ações */}
            <div className="flex justify-between items-center p-3 border-b border-gray-100">
                <div className="flex items-center space-x-3">
                    <Checkbox 
                        id={`select-${imovel.id}`}
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelect(imovel.id, checked as boolean)}
                        className="w-5 h-5 text-blue-600 border-gray-400"
                    />
                    <div className={`w-2 h-full rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`}></div> {/* Status Bar */}
                </div>
                <div className="flex space-x-4 text-gray-500 text-sm font-medium">
                    <button title="Mídias" className="flex items-center hover:text-blue-600 transition-colors"><Image className="w-4 h-4 mr-1" /> Mídias</button>
                    <button title="Atualizar" className="flex items-center hover:text-blue-600 transition-colors"><RefreshCw className="w-4 h-4 mr-1" /> Atualizar</button>
                    <button title="Informações" className="flex items-center hover:text-blue-600 transition-colors"><Info className="w-4 h-4 mr-1" /> Info</button>
                </div>
            </div>

            {/* Conteúdo Principal do Card */}
            <div className="flex p-3">
                
                {/* 1. Imagem e Código */}
                <div className="flex-shrink-0 w-56 h-36 relative mr-4 rounded-md overflow-hidden">
                    <ImageCarousel 
                        media={mediaForCarousel}
                        defaultImageUrl={defaultImage}
                        altText={`Imóvel ${imovel.codigo}`}
                    />
                    <div className="absolute bottom-0 left-0 bg-black bg-opacity-70 text-white text-xs px-2 py-0.5 font-semibold z-10">
                        {imovel.codigo}
                    </div>
                    {!isAvailable && (
                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-10">
                            <p className="text-white font-bold text-sm rotate-[-15deg]">Indisponível</p>
                        </div>
                    )}
                </div>
                
                {/* 2. Detalhes e Características */}
                <div className="flex-1 grid grid-cols-3 gap-x-6">
                    
                    {/* Coluna 1: Endereço */}
                    <div className="col-span-1 flex flex-col justify-center">
                        <p className="text-sm text-dark-text leading-tight">{imovel.logradouro},</p>
                        <p className="text-sm font-semibold text-dark-text leading-tight">{imovel.numero}</p>
                        <p className="text-sm font-semibold text-dark-text leading-tight mt-1">{type}</p>
                        <p className="text-sm font-semibold text-dark-text leading-tight">{imovel.bairro}</p>
                        <p className="text-xs text-light-text leading-tight">{imovel.dados_localizacao.cidade} - {imovel.dados_localizacao.estado}</p>
                    </div>
                    
                    {/* Coluna 2: Características com Ícones (Mais espaço) */}
                    <div className="col-span-1 grid grid-cols-2 gap-y-1 text-sm text-dark-text">
                        <div className="flex items-center space-x-2">
                            <Bed className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{dormitorios} ({suites})</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Bath className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{banheiros}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Car className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{vagas_garagem}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Maximize2 className="w-4 h-4 text-gray-500" />
                            <span className="font-medium">{area_privativa_m2} m²</span>
                        </div>
                    </div>
                    
                    {/* Coluna 3: Valores e Ação */}
                    <div className="col-span-1 flex flex-col items-end justify-center text-right relative pr-8">
                        <p className="text-xs text-light-text">{statusText}</p>
                        <p className="text-lg font-bold text-dark-text">{formatCurrency(price)}</p>
                        
                        {iptuValue > 0 && (
                            <>
                                <p className="text-xs text-light-text">IPTU {iptuPeriodo}</p>
                                <p className="text-sm font-semibold text-dark-text">{formatCurrency(iptuValue)}</p>
                            </>
                        )}
                        
                        {/* Botão de Detalhes (seta) - Agora com borda vertical laranja no hover */}
                        <button 
                            onClick={() => onViewDetails(imovel.id)}
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

export default ImovelCard;
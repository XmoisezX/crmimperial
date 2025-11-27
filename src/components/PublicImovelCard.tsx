import React from 'react';
import { Heart, Bed, Bath, Car, Maximize2, MapPin, DollarSign, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

// Interface baseada na estrutura de dados do useImovelLocations
interface Imovel {
    id: string;
    codigo: string;
    bairro: string;
    logradouro: string;
    numero: string;
    
    dados_contrato: {
        venda_ativo: boolean;
        locacao_ativo: boolean;
        venda_disponibilidade: 'Disponível' | 'Indisponível';
        locacao_disponibilidade: 'Disponível' | 'Indisponível';
    };
    dados_valores: {
        valor_venda: number;
        valor_locacao: number;
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
        area_privativa_m2: number;
    };
    
    imagens_imovel: { url: string, rotation: number, ordem: number }[];
}

interface PublicImovelCardProps {
    imovel: Imovel;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PublicImovelCard: React.FC<PublicImovelCardProps> = ({ imovel }) => {
    
    const isVenda = imovel.dados_contrato.venda_ativo && imovel.dados_contrato.venda_disponibilidade === 'Disponível';
    const isLocacao = imovel.dados_contrato.locacao_ativo && imovel.dados_contrato.locacao_disponibilidade === 'Disponível';
    
    const finalidade = isVenda ? 'Venda' : (isLocacao ? 'Locação' : 'Indefinido');
    const price = isVenda ? imovel.dados_valores.valor_venda : imovel.dados_valores.valor_locacao;
    
    const { tipo_imovel, dormitorios, banheiros, vagas_garagem, area_privativa_m2 } = imovel.dados_caracteristicas;
    
    const imageUrl = imovel.imagens_imovel?.[0]?.url || '/LOGO LARANJA.png'; // Usando logo como placeholder
    
    const fullAddress = `${imovel.logradouro}, ${imovel.dados_localizacao.cidade} - ${imovel.dados_localizacao.estado}`;

    return (
        <Link to={`/imoveis/${imovel.id}`} className="block">
            <div className="relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer">
                
                {/* Imagem Principal */}
                <img
                    src={imageUrl}
                    alt={tipo_imovel}
                    className="h-48 w-full object-cover rounded-t-xl"
                />

                <div className="p-4 sm:p-5 space-y-2">
                    
                    {/* Tipo e Bairro */}
                    <p className="text-sm text-light-text">{tipo_imovel}</p>
                    <h2 className="text-lg font-semibold text-dark-text truncate">{imovel.bairro}</h2>
                    <p className="text-sm text-gray-500 truncate">
                        {fullAddress}
                    </p>

                    {/* Informações Resumidas */}
                    <div className="flex flex-wrap items-center text-sm text-gray-600 space-x-4 pt-2 border-t border-gray-100">
                        {area_privativa_m2 > 0 && <span className="flex items-center"><Maximize2 className="w-4 h-4 mr-1 text-primary-orange" /> {area_privativa_m2} m²</span>}
                        {dormitorios > 0 && <span className="flex items-center"><Bed className="w-4 h-4 mr-1 text-primary-orange" /> {dormitorios} Qts</span>}
                        {banheiros > 0 && <span className="flex items-center"><Bath className="w-4 h-4 mr-1 text-primary-orange" /> {banheiros} Banh.</span>}
                        {vagas_garagem > 0 && <span className="flex items-center"><Car className="w-4 h-4 mr-1 text-primary-orange" /> {vagas_garagem} Vagas</span>}
                    </div>

                    {/* Preço e Código */}
                    <div className="mt-3">
                        <p className="text-sm text-light-text font-medium">{finalidade}</p>
                        {price > 0 ? (
                            <p className="text-xl font-bold text-primary-orange">
                                {formatCurrency(price)}
                            </p>
                        ) : (
                            <p className="text-xl font-bold text-gray-500">Preço sob consulta</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">Cód. {imovel.codigo}</p>
                    </div>
                </div>

                {/* Ícone de Favorito */}
                <button
                    className="absolute bottom-3 right-3 p-2 bg-white rounded-full shadow-lg text-gray-400 hover:text-red-500 transition"
                    aria-label="Favoritar"
                    onClick={(e) => {
                        e.preventDefault(); // Previne a navegação do Link pai
                        e.stopPropagation();
                        alert('Favoritado! (Mock)');
                    }}
                >
                    <Heart size={20} />
                </button>
            </div>
        </Link>
    );
};

export default PublicImovelCard;
import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Home, MapPin, DollarSign, Loader2, Bed, Bath, Car, Maximize2, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import ImageCarousel from '../components/ImageCarousel';
import ClientOnly from '../components/ClientOnly';
import LeafletMap from '../components/LeafletMap';
import { Button } from '../components/ui/Button'; // Importação adicionada

// Interface para os detalhes completos (baseada na estrutura do banco)
interface ImovelDetails {
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
        financiavel: 'Sim' | 'Não' | 'MCMV';
    };
    dados_caracteristicas: {
        tipo_imovel: string;
        dormitorios: number;
        suites: number;
        banheiros: number;
        vagas_garagem: number;
        area_privativa_m2: number;
        descricao_site: string;
    };
    dados_localizacao: {
        cidade: string;
        estado: string;
        mapa_visibilidade: 'Exata' | 'Aproximada' | 'Não mostrar';
    };
    
    imagens_imovel: { id: string, url: string, rotation: number, ordem: number, is_visible: boolean }[];
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

// Função de geocodificação simulada (usando Nominatim)
const geocodeAddress = async (address: string): Promise<{ lat: number, lng: number } | null> => {
    if (!address.trim()) return null;
    
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ImperialParisImoveisSimulator/1.0 (contato@imperialparis.com.br)'
            }
        });
        
        if (!response.ok) return null;

        const result = await response.json();

        if (result && result.length > 0) {
            return {
                lat: parseFloat(result[0].lat),
                lng: parseFloat(result[0].lon),
            };
        }
        return null;
    } catch (err) {
        return null;
    }
};


const PublicImovelDetailsPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [imovel, setImovel] = useState<ImovelDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [location, setLocation] = useState<{ lat: number, lng: number } | null>(null);

    const fetchImovel = useCallback(async () => {
        if (!id) return;

        setIsLoading(true);
        setError(null);
        
        // Busca o imóvel, garantindo que ele esteja APROVADO
        const { data, error } = await supabase
            .from('imoveis')
            .select(`
                id, codigo, bairro, logradouro, numero,
                dados_contrato, dados_valores, dados_localizacao, dados_caracteristicas,
                imagens_imovel(id, url, rotation, ordem, is_visible)
            `)
            .eq('id', id)
            .eq('status_aprovacao', 'Aprovado')
            .single();

        if (error || !data) {
            console.error('Erro ao buscar imóvel:', error);
            setError('Imóvel não encontrado ou não está disponível publicamente.');
            setIsLoading(false);
            return;
        }
        
        // Mapeamento e ordenação das imagens visíveis
        const mappedImovel = data as ImovelDetails;
        if (mappedImovel.imagens_imovel) {
            mappedImovel.imagens_imovel = mappedImovel.imagens_imovel
                .filter(img => img.is_visible)
                .sort((a, b) => a.ordem - b.ordem);
        }
        
        setImovel(mappedImovel);
        
        // Geocodificação para o mapa
        const address = `${mappedImovel.logradouro}, ${mappedImovel.numero}, ${mappedImovel.bairro}, ${mappedImovel.dados_localizacao.cidade}, ${mappedImovel.dados_localizacao.estado}`;
        const coords = await geocodeAddress(address);
        setLocation(coords);

        setIsLoading(false);
    }, [id]);

    useEffect(() => {
        fetchImovel();
    }, [fetchImovel]);

    if (isLoading) {
        return (
            <div className="container mx-auto p-8 min-h-[500px] flex items-center justify-center pt-[120px]">
                <Loader2 className="w-8 h-8 animate-spin text-primary-orange" />
                <p className="ml-3 text-gray-600">Carregando detalhes do imóvel...</p>
            </div>
        );
    }
    
    if (error || !imovel) {
        return (
            <div className="container mx-auto p-8 pt-[120px] min-h-[500px] text-center">
                <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-dark-text mb-2">Imóvel Indisponível</h1>
                <p className="text-lg text-light-text">{error || 'O imóvel solicitado não pôde ser carregado.'}</p>
            </div>
        );
    }
    
    const isVenda = imovel.dados_contrato.venda_ativo && imovel.dados_contrato.venda_disponibilidade === 'Disponível';
    const isLocacao = imovel.dados_contrato.locacao_ativo && imovel.dados_contrato.locacao_disponibilidade === 'Disponível';
    
    const price = isVenda ? imovel.dados_valores.valor_venda : imovel.dados_valores.valor_locacao;
    const operationType = isVenda ? 'Venda' : (isLocacao ? 'Locação' : 'Indefinido');
    
    const { dormitorios, suites, banheiros, vagas_garagem, area_privativa_m2, descricao_site, tipo_imovel } = imovel.dados_caracteristicas;
    const { financiavel } = imovel.dados_valores;
    const { mapa_visibilidade } = imovel.dados_localizacao;
    
    const mapCenter: [number, number] = location ? [location.lat, location.lng] : [-31.7719, -52.3425];
    const mapZoom = location ? (mapa_visibilidade === 'Aproximada' ? 13 : 16) : 12;

    return (
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 pt-[100px] bg-white min-h-[80vh]">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-3xl font-bold text-dark-text mb-2">{tipo_imovel} para {operationType} - Cód: {imovel.codigo}</h1>
                <p className="text-lg text-light-text mb-6 flex items-center">
                    <MapPin className="w-5 h-5 mr-2 text-primary-orange" /> 
                    {imovel.logradouro}, {imovel.bairro}, {imovel.dados_localizacao.cidade} - {imovel.dados_localizacao.estado}
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Coluna Principal (Imagens e Descrição) */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Carrossel de Imagens */}
                        <div className="relative h-[450px] rounded-lg overflow-hidden shadow-xl border border-gray-200">
                            <ImageCarousel 
                                media={imovel.imagens_imovel}
                                defaultImageUrl="/LOGO LARANJA.png"
                                altText={`Imóvel ${imovel.codigo}`}
                            />
                        </div>

                        {/* Descrição */}
                        <div className="p-6 bg-gray-50 rounded-lg shadow-inner">
                            <h2 className="text-xl font-semibold text-dark-text mb-3 border-b pb-2">Descrição do Imóvel</h2>
                            <p className="text-light-text whitespace-pre-wrap">{descricao_site || 'Descrição não fornecida.'}</p>
                        </div>
                        
                        {/* Características Detalhadas */}
                        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                            <h2 className="text-xl font-semibold text-dark-text mb-4 border-b pb-2">Características</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                                <div className="flex items-center text-dark-text"><Bed className="w-5 h-5 mr-2 text-primary-orange" /> Dormitórios: <span className="font-semibold ml-1">{dormitorios}</span></div>
                                <div className="flex items-center text-dark-text"><Bed className="w-5 h-5 mr-2 text-primary-orange" /> Suítes: <span className="font-semibold ml-1">{suites}</span></div>
                                <div className="flex items-center text-dark-text"><Bath className="w-5 h-5 mr-2 text-primary-orange" /> Banheiros: <span className="font-semibold ml-1">{banheiros}</span></div>
                                <div className="flex items-center text-dark-text"><Car className="w-5 h-5 mr-2 text-primary-orange" /> Vagas: <span className="font-semibold ml-1">{vagas_garagem}</span></div>
                                <div className="flex items-center text-dark-text"><Maximize2 className="w-5 h-5 mr-2 text-primary-orange" /> Área Privativa: <span className="font-semibold ml-1">{area_privativa_m2} m²</span></div>
                                <div className="flex items-center text-dark-text">
                                    {financiavel === 'Sim' || financiavel === 'MCMV' ? 
                                        <CheckCircle className="w-5 h-5 mr-2 text-green-600" /> : 
                                        <XCircle className="w-5 h-5 mr-2 text-red-600" />
                                    }
                                    Financiável: <span className="font-semibold ml-1">{financiavel}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Coluna Lateral (Valores e Mapa) */}
                    <div className="lg:col-span-1 space-y-6">
                        {/* Card de Valores */}
                        <div className="p-6 bg-primary-orange text-white rounded-lg shadow-xl">
                            <p className="text-lg font-medium">Valor de {operationType}</p>
                            <p className="text-4xl font-bold mt-1">{formatCurrency(price)}</p>
                            <Button className="w-full mt-4 bg-white text-primary-orange hover:bg-gray-100 font-bold">
                                Entrar em Contato
                            </Button>
                        </div>
                        
                        {/* Mapa de Localização */}
                        <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
                            <h3 className="text-lg font-semibold text-dark-text mb-3 flex items-center"><MapPin className="w-5 h-5 mr-2 text-primary-orange" /> Localização</h3>
                            <div className="relative h-64 rounded-md">
                                <ClientOnly>
                                    <LeafletMap 
                                        location={location} 
                                        visibilidade={mapa_visibilidade} 
                                        center={mapCenter} 
                                        zoom={mapZoom} 
                                    />
                                </ClientOnly>
                            </div>
                            <p className="text-xs text-light-text mt-2">
                                {mapa_visibilidade === 'Exata' ? 'Localização exata do imóvel.' : 'Localização aproximada (raio de 1km).'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PublicImovelDetailsPage;
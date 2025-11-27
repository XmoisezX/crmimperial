import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom'; // Importando useSearchParams
import { Home, MapPin, DollarSign, Bed, Bath, Car, Maximize2, Loader2, ArrowRight } from 'lucide-react';
import { useImovelLocations } from '../hooks/useImovelLocations';
import ClientOnly from '../components/ClientOnly';
import { Button } from '../components/ui/Button';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import CompactSearchForm from '../components/CompactSearchForm';
import PublicImovelCard from '../components/PublicImovelCard'; // Importando o novo card

// Ícone customizado para o mapa
const CustomIcon = L.divIcon({
    className: 'custom-div-icon',
    html: '<div class="bg-primary-orange text-white p-1 rounded-full shadow-lg border-2 border-white"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5"><path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /><path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" /></svg></div>',
    iconSize: [30, 30],
    iconAnchor: [15, 30],
});

// Componente de Mapa Leaflet (para ser usado dentro de ClientOnly)
interface MapComponentProps {
    imoveis: any[];
    highlightedId: string | null;
    onMarkerClick: (id: string) => void;
}

const MapComponent: React.FC<MapComponentProps> = ({ imoveis, highlightedId, onMarkerClick }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markersRef = useRef<{ [key: string]: L.Marker }>({});
    
    const defaultCenter: [number, number] = [-31.7719, -52.3425]; // Pelotas, RS

    useEffect(() => {
        if (mapRef.current) {
            if (!mapInstanceRef.current) {
                mapInstanceRef.current = L.map(mapRef.current, {
                    center: defaultCenter,
                    zoom: 12,
                    scrollWheelZoom: true,
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                }).addTo(mapInstanceRef.current);
            }

            const map = mapInstanceRef.current;
            
            // Limpa marcadores antigos
            Object.values(markersRef.current).forEach(marker => map.removeLayer(marker));
            markersRef.current = {};

            // Adiciona novos marcadores
            imoveis.forEach(imovel => {
                const latLng: L.LatLngTuple = [imovel.lat, imovel.lng];
                
                const marker = L.marker(latLng, { icon: CustomIcon })
                    .addTo(map)
                    .on('click', () => onMarkerClick(imovel.id));
                    
                markersRef.current[imovel.id] = marker;
            });
            
            // Ajusta o zoom para caber todos os marcadores
            if (imoveis.length > 0) {
                const bounds = L.latLngBounds(imoveis.map(i => [i.lat, i.lng] as L.LatLngTuple));
                map.fitBounds(bounds, { padding: [50, 50] });
            } else {
                map.setView(defaultCenter, 12);
            }
        }

        return () => {
            // Não destrói o mapa, apenas remove os marcadores
        };
    }, [imoveis, onMarkerClick]);
    
    // Efeito para destacar o marcador
    useEffect(() => {
        Object.entries(markersRef.current).forEach(([id, marker]) => {
            const isHighlighted = id === highlightedId;
            // Simplesmente muda a opacidade ou z-index para destacar
            marker.setOpacity(isHighlighted ? 1.0 : 0.7);
            marker.setZIndexOffset(isHighlighted ? 1000 : 0);
        });
        
        if (highlightedId && markersRef.current[highlightedId]) {
            // Centraliza o mapa no marcador destacado
            mapInstanceRef.current?.panTo(markersRef.current[highlightedId].getLatLng());
        }
    }, [highlightedId]);

    return <div ref={mapRef} className="w-full h-full z-0" />;
};

const ImoveisPublicPage: React.FC = () => {
    const { imoveis, isLoading, error } = useImovelLocations();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams(); // Hook para ler a URL
    const [highlightedId, setHighlightedId] = useState<string | null>(null);
    
    // Converte URLSearchParams para um objeto de filtros
    const initialFilters = React.useMemo(() => {
        const filters: Record<string, string> = {};
        for (const [key, value] of searchParams.entries()) {
            filters[key] = value;
        }
        return filters;
    }, [searchParams]);
    
    // Mock de função para reagir a mudanças no filtro compacto
    const handleCompactFilterChange = useCallback((newFilters: any) => {
        // Aqui você implementaria a lógica de re-filtragem da lista de imóveis
        console.log("Filtros atualizados no CompactSearchForm:", newFilters);
        
        // Opcional: Atualizar a URL com os novos filtros
        const params = new URLSearchParams();
        Object.entries(newFilters).forEach(([key, value]) => {
            if (value !== '' && value !== '0') {
                params.append(key, String(value));
            }
        });
        navigate(`?${params.toString()}`, { replace: true });
    }, [navigate]);
    
    const handleMarkerClick = useCallback((id: string) => {
        setHighlightedId(id);
    }, []);
    
    const handleListItemClick = useCallback((id: string) => {
        // 1. Destaca no mapa
        setHighlightedId(id);
        // 2. Navega para a página de detalhes
        // navigate(`/imoveis/${id}`); // Comentado para permitir apenas o destaque no mapa
    }, []);
    
    const handleViewDetails = useCallback((id: string) => {
        navigate(`/imoveis/${id}`);
    }, [navigate]);

    return (
        <div className="flex flex-col lg:grid lg:grid-cols-3 min-h-[calc(100vh-150px)] pt-[100px] bg-gray-50">
            
            {/* Coluna 1: Filtros e Lista de Imóveis (1/3 da tela em LG) */}
            <div className="lg:col-span-1 w-full flex-shrink-0 overflow-y-auto p-4 sm:p-6 space-y-6 bg-white shadow-lg lg:shadow-none">
                
                {/* Filtro Compacto (Ocupa 100% da largura do padding) */}
                <CompactSearchForm 
                    initialFilters={initialFilters} 
                    onFilterChange={handleCompactFilterChange}
                />
                
                <h1 className="text-2xl font-bold text-dark-text flex items-center border-t pt-4">
                    <Home className="w-5 h-5 mr-2 text-primary-orange" /> Imóveis para Venda ({imoveis.length})
                </h1>
                <p className="text-sm text-light-text">Clique em um imóvel para ver os detalhes ou no mapa para destacar.</p>
                
                {isLoading && (
                    <div className="flex items-center justify-center py-10">
                        <Loader2 className="w-6 h-6 animate-spin text-primary-orange mr-3" />
                        <p className="text-gray-600">Carregando imóveis...</p>
                    </div>
                )}
                
                {error && <div className="text-red-600 p-4 bg-red-50 rounded-md">Erro ao carregar imóveis: {error}</div>}

                <div className="space-y-4">
                    {imoveis.map(imovel => (
                        <div 
                            key={imovel.id} 
                            // Adiciona a classe de destaque para o card
                            className={imovel.id === highlightedId ? 'border-2 border-primary-orange rounded-xl shadow-lg' : ''}
                            onMouseEnter={() => setHighlightedId(imovel.id)}
                            onMouseLeave={() => setHighlightedId(null)}
                        >
                            <PublicImovelCard imovel={imovel} />
                        </div>
                    ))}
                </div>
                
                {!isLoading && imoveis.length === 0 && (
                    <div className="text-center py-10 text-gray-500">
                        <p className="text-lg">Nenhum imóvel disponível para venda encontrado.</p>
                    </div>
                )}
            </div>
            
            {/* Coluna 2: Mapa (2/3 da tela em LG) */}
            <div className="lg:col-span-2 h-[50vh] lg:h-auto lg:sticky lg:top-[88px] lg:flex-grow">
                <ClientOnly fallback={
                    <div className="flex items-center justify-center h-full bg-gray-200">
                        <Loader2 className="w-8 h-8 animate-spin text-primary-orange" />
                    </div>
                }>
                    <MapComponent 
                        imoveis={imoveis} 
                        highlightedId={highlightedId}
                        onMarkerClick={handleMarkerClick}
                    />
                </ClientOnly>
            </div>
        </div>
    );
};

export default ImoveisPublicPage;
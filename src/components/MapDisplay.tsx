import React, { useMemo, lazy, Suspense } from 'react';
import { MapPin, XCircle, Loader2 } from 'lucide-react';
import ClientOnly from './ClientOnly';
import LeafletMap from './LeafletMap'; // Importando o componente puro

interface MapDisplayProps {
    visibilidade: 'Exata' | 'Aproximada' | 'Não mostrar';
    address: string;
    isValid: boolean;
    location: { lat: number, lng: number } | null;
    isGeocoding: boolean;
    geocodingError: string | null;
}

const MapDisplay: React.FC<MapDisplayProps> = ({ visibilidade, isValid, location, isGeocoding, geocodingError }) => {
    
    const defaultCenter: [number, number] = [-31.7719, -52.3425]; // Centro de Pelotas, RS
    const center = location ? [location.lat, location.lng] as [number, number] : defaultCenter;
    const zoom = location ? (visibilidade === 'Aproximada' ? 13 : 16) : 12;

    const mapContent = useMemo(() => {
        if (!isValid) {
            return (
                <div className="flex flex-col items-center justify-center text-gray-500 p-4">
                    <XCircle className="w-8 h-8 text-red-500 mb-2" />
                    <p className="text-center font-semibold">Localização Inválida</p>
                    <p className="text-sm text-center">Preencha o CEP, Logradouro, Bairro e Número para visualizar o mapa.</p>
                </div>
            );
        } 
        
        if (isGeocoding) {
            return (
                <div className="text-center text-gray-500">
                    <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin" />
                    <p>Buscando endereço no mapa...</p>
                </div>
            );
        } 
        
        if (geocodingError) {
             return (
                <div className="flex flex-col items-center justify-center text-gray-500 p-4">
                    <XCircle className="w-8 h-8 text-red-500 mb-2" />
                    <p className="text-center font-semibold">Erro de Geocodificação</p>
                    <p className="text-sm text-center">{geocodingError}</p>
                </div>
            );
        } 
        
        if (visibilidade === 'Não mostrar') {
            return (
                <div className="text-center text-gray-500">
                    <MapPin className="w-8 h-8 mx-auto mb-2" />
                    <p>Localização no centro do bairro/cidade.</p>
                    <p className="text-xs">Endereço não será exibido no mapa do site.</p>
                </div>
            );
        }
        
        // Se tudo estiver OK, retorna null para renderizar o mapa real
        return null;
    }, [isValid, isGeocoding, geocodingError, visibilidade]);


    if (mapContent) {
        return (
            <div className="relative h-64 bg-gray-200 rounded-md mt-4 flex items-center justify-center overflow-hidden">
                {mapContent}
            </div>
        );
    }

    // Renderiza o mapa real dentro do ClientOnly
    return (
        <ClientOnly>
            <div className="relative h-64 rounded-md mt-4">
                <LeafletMap 
                    location={location} 
                    visibilidade={visibilidade} 
                    center={center} 
                    zoom={zoom} 
                />
            </div>
        </ClientOnly>
    );
};

export default MapDisplay;
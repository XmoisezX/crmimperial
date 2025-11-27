import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correção do ícone do Leaflet (necessário para o Leaflet puro também)
if (typeof window !== 'undefined' && L.Icon) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
    });
}

interface LeafletMapProps {
    visibilidade: 'Exata' | 'Aproximada' | 'Não mostrar';
    location: { lat: number, lng: number } | null;
    center: [number, number];
    zoom: number;
}

const LeafletMap: React.FC<LeafletMapProps> = ({ location, visibilidade, center, zoom }) => {
    const mapRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const markerRef = useRef<L.Marker | null>(null);
    const circleRef = useRef<L.Circle | null>(null);

    useEffect(() => {
        if (mapRef.current) {
            // 1. Inicializa o mapa se ainda não foi inicializado
            if (!mapInstanceRef.current) {
                mapInstanceRef.current = L.map(mapRef.current, {
                    center: center,
                    zoom: zoom,
                    scrollWheelZoom: false,
                });

                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                }).addTo(mapInstanceRef.current);
            }

            const map = mapInstanceRef.current;
            
            // 2. Atualiza a visualização do mapa
            map.setView(center, zoom);

            // 3. Gerencia Marcadores/Círculos
            
            // Remove marcadores/círculos antigos
            if (markerRef.current) {
                map.removeLayer(markerRef.current);
                markerRef.current = null;
            }
            if (circleRef.current) {
                map.removeLayer(circleRef.current);
                circleRef.current = null;
            }

            if (location) {
                const latLng: L.LatLngTuple = [location.lat, location.lng];

                if (visibilidade === 'Exata') {
                    markerRef.current = L.marker(latLng).addTo(map);
                } else if (visibilidade === 'Aproximada') {
                    circleRef.current = L.circle(latLng, {
                        radius: 1000, // 1 km
                        color: '#ff6600',
                        fillColor: '#ff6600',
                        fillOpacity: 0.35
                    }).addTo(map);
                }
            }
        }

        // Cleanup function
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [location, visibilidade, center, zoom]);

    return <div ref={mapRef} className="w-full h-full rounded-md z-0" />;
};

export default LeafletMap;
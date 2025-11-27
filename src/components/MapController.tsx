import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';

interface MapControllerProps {
    center: [number, number];
    zoom: number;
}

const MapController: React.FC<MapControllerProps> = ({ center, zoom }) => {
    const map = useMap();

    useEffect(() => {
        if (center && zoom) {
            // Anima a transição para o novo centro e zoom
            map.setView(center, zoom, {
                animate: true,
                duration: 0.5,
            });
        }
    }, [center, zoom, map]);

    return null;
};

export default MapController;
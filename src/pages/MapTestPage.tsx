import React from 'react';
import EnderecoMap from '../components/EnderecoMap';

const MapTestPage: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <h1 className="text-3xl font-bold text-dark-text mb-6 text-center">Teste de Geocodificação (Nominatim)</h1>
            <EnderecoMap />
        </div>
    );
};

export default MapTestPage;
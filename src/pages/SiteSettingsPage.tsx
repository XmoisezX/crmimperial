import React from 'react';
import BannerUploader from '../components/BannerUploader';

const SiteSettingsPage: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <h1 className="text-3xl font-bold text-dark-text mb-6">Configurações do Site</h1>
            <div className="max-w-3xl space-y-8">
                <BannerUploader />
                
                <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
                    <h3 className="text-xl font-semibold text-dark-text mb-3">SEO e Metadados (Mock)</h3>
                    <p className="text-light-text text-sm">Gerencie títulos, descrições e palavras-chave globais.</p>
                </div>
            </div>
        </div>
    );
};

export default SiteSettingsPage;
import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Settings, Users } from 'lucide-react';

const SystemSettingsPage: React.FC = () => {
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <h1 className="text-3xl font-bold text-dark-text mb-6">Configurações do Sistema</h1>
            <p className="text-lg text-light-text mb-8">Gerencie as configurações globais da plataforma e do site. {/* v2.0 - 27/11/2025 */}</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
                <Link to="/crm/sistema/site" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 border-t-4 border-blue-600">
                    <Globe className="w-8 h-8 text-blue-600 mb-3" />
                    <h2 className="text-xl font-semibold text-dark-text">Configurações do Site</h2>
                    <p className="text-sm text-light-text mt-1">Gerencie banners, SEO e visibilidade pública.</p>
                </Link>

                <Link to="/crm/sistema/usuarios" className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow duration-200 border-t-4 border-green-600">
                    <Users className="w-8 h-8 text-green-600 mb-3" />
                    <h2 className="text-xl font-semibold text-dark-text">Usuários e Permissões</h2>
                    <p className="text-sm text-light-text mt-1">Gerenciamento de acesso e funções da equipe.</p>
                </Link>

                <div className="p-6 bg-white rounded-lg shadow-md border-t-4 border-gray-400 opacity-70">
                    <Settings className="w-8 h-8 text-gray-500 mb-3" />
                    <h2 className="text-xl font-semibold text-dark-text">Geral (Mock)</h2>
                    <p className="text-sm text-light-text mt-1">Configurações de moeda, fuso horário e integrações.</p>
                </div>
            </div>
        </div>
    );
};

export default SystemSettingsPage;
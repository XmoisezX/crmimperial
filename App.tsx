import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginPage from './src/pages/Login';
import UpdatePasswordPage from './src/pages/UpdatePasswordPage'; // NOVO
import HomePage from './src/pages/HomePage'; // Simulador
import MarketAnalysisPage from './src/pages/MarketAnalysisPage';
import ListingGoalsPage from './src/pages/ListingGoalsPage';
import DashboardPage from './src/pages/DashboardPage'; // Dashboard do CRM
import ImoveisPage from './src/pages/ImoveisPage';
import NewImovelPage from './src/pages/NewImovelPage';
import ViewImovelPage from './src/pages/ViewImovelPage';
import PessoasPage from './src/pages/PessoasPage';
import MapTestPage from './src/pages/MapTestPage';
import SystemSettingsPage from './src/pages/SystemSettingsPage'; // NOVO
import SiteSettingsPage from './src/pages/SiteSettingsPage'; // NOVO
import UsersPage from './src/pages/UsersPage'; // NOVO
import CondominiosPage from './src/pages/CondominiosPage'; // NOVO
import NewCondominioPage from './src/pages/NewCondominioPage'; // NOVO
import ViewCondominioPage from './src/pages/ViewCondominioPage'; // NOVO
import PlanilhaPage from './src/pages/PlanilhaPage'; // MANTIDO
import ExtractedImoveisPage from './src/pages/ExtractedImoveisPage'; // NOVO
import ChavesPage from './src/pages/ChavesPage';
import OportunidadesPage from './src/pages/OportunidadesPage'; // NOVO: Página de Oportunidades
import PropostasPage from './src/pages/PropostasPage'; // NOVO: Página de Propostas
import AtividadesPage from './src/pages/AtividadesPage'; // NOVO: Página de Atividades
import LeadsPage from './src/pages/LeadsPage'; // NOVO: Página de Leads
import SalesDashboardPage from './src/pages/SalesDashboardPage'; // NOVO: Painel de Vendas
import CRMLayout from './src/components/CRMLayout';
import PublicHomePage from './src/pages/PublicHomePage';
import PublicLayout from './src/layouts/PublicLayout';
import PublicImovelDetailsPage from './src/pages/PublicImovelDetailsPage';
import ImoveisPublicPage from './src/pages/ImoveisPublicPage'; // NOVO
import ErrorBoundary from './src/components/ErrorBoundary'; // Importando ErrorBoundary

const AppContent: React.FC = () => {
    const { session } = useAuth();

    if (!session) {
        // Rotas Públicas (Usuário deslogado)
        return (
            <Routes>
                <Route path="/" element={<PublicLayout><PublicHomePage /></PublicLayout>} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/update-password" element={<UpdatePasswordPage />} />
                {/* Rotas públicas */}
                <Route path="/imoveis" element={<PublicLayout><ImoveisPublicPage /></PublicLayout>} />
                <Route path="/imoveis/:id" element={<PublicLayout><PublicImovelDetailsPage /></PublicLayout>} />
                <Route path="/sobre" element={<PublicLayout><div className="p-8 text-xl">Página Sobre Nós (Mock)</div></PublicLayout>} />
                <Route path="/contato" element={<PublicLayout><div className="p-8 text-xl">Página de Contato (Mock)</div></PublicLayout>} />

                {/* Redireciona qualquer outra rota para a home pública */}
                <Route path="*" element={<Navigate to="/" />} />
            </Routes>
        );
    }

    // Rotas do CRM (Usuário logado)
    return (
        <CRMLayout>
            <Routes>
                {/* Rota principal redireciona para o Dashboard do CRM */}
                <Route path="/" element={<Navigate to="/crm/dashboard" />} />

                {/* Páginas do CRM */}
                <Route path="/crm/dashboard" element={<DashboardPage />} />

                {/* Rotas de Imóveis */}
                <Route path="/crm/imoveis" element={<ImoveisPage />} />
                <Route path="/crm/imoveis/novo" element={<NewImovelPage />} />
                <Route path="/crm/imoveis/:id" element={<ViewImovelPage />} />

                {/* Rotas de Condomínios */}
                <Route path="/crm/condominios" element={<CondominiosPage />} />
                <Route path="/crm/condominios/novo" element={<NewCondominioPage />} />
                <Route path="/crm/condominios/:id" element={<ViewCondominioPage />} />

                {/* Rotas de Agenciamento */}
                <Route path="/crm/agenciamento" element={<ExtractedImoveisPage />} />
                <Route path="/crm/agenciamento/planilhas/:id" element={<PlanilhaPage />} />

                <Route path="/crm/pessoas" element={<PessoasPage />} />

                {/* Rotas de Chaves */}
                <Route path="/crm/chaves" element={<ChavesPage />} />

                {/* Rotas de Oportunidades */}
                <Route path="/crm/oportunidades" element={<OportunidadesPage />} />

                {/* Rotas de Propostas */}
                <Route path="/crm/propostas" element={<PropostasPage />} />

                {/* Rotas de Atividades */}
                <Route path="/crm/atividades" element={<AtividadesPage />} />

                {/* Rotas de Leads */}
                <Route path="/crm/leads" element={<LeadsPage />} />

                {/* NOVO: Painel de Vendas */}
                <Route path="/crm/sales-dashboard" element={<SalesDashboardPage />} />

                {/* Rotas de Sistema */}
                <Route path="/crm/sistema" element={<SystemSettingsPage />} />
                <Route path="/crm/sistema/site" element={<SiteSettingsPage />} />
                <Route path="/crm/sistema/usuarios" element={<UsersPage />} />
                <Route path="/crm/sistema/geral" element={<div className="p-4 text-xl">Configurações Gerais (Em construção)</div>} />

                {/* Ferramentas existentes */}
                <Route path="/simulador" element={<HomePage />} />
                <Route path="/analise-de-mercado" element={<MarketAnalysisPage />} />
                <Route path="/metas-agenciamento" element={<ListingGoalsPage />} />

                {/* Nova Rota de Teste */}
                <Route path="/mapa-teste" element={<MapTestPage />} />

                <Route path="*" element={<Navigate to="/crm/dashboard" />} />
            </Routes>
        </CRMLayout>
    );
};

const App: React.FC = () => {
    return (
        <BrowserRouter>
            <AuthProvider>
                <ErrorBoundary>
                    <AppContent />
                </ErrorBoundary>
            </AuthProvider>
        </BrowserRouter>
    );
};

export default App;
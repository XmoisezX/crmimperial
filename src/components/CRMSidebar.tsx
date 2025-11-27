import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Building, Key, FileText, Users, Briefcase, CalendarCheck, Zap, DollarSign, Target, Map, Menu, X, Settings, Globe, Building2, TrendingUp } from 'lucide-react'; // Adicionado TrendingUp para Oportunidades

interface NavItemProps {
    to: string;
    icon: React.ReactNode;
    label: string;
    isSidebarOpen: boolean;
    onClick?: () => void; // Adicionado para fechar no mobile
}

const NavItem: React.FC<NavItemProps> = ({ to, icon, label, isSidebarOpen, onClick }) => {
    const location = useLocation();
    // Verifica se a rota atual começa com o 'to' (para sub-rotas como /crm/agenciamento/planilhas/123)
    const isActive = location.pathname.startsWith(to);
    
    // Cores para o modo expandido (fundo branco)
    const expandedClasses = isActive 
        ? 'bg-blue-100 text-blue-800 font-semibold' 
        : 'text-slate-600 hover:bg-gray-100';
        
    // Cores para o modo recolhido (fundo claro)
    const collapsedClasses = isActive 
        ? 'bg-blue-100 text-blue-800 font-semibold' 
        : 'text-slate-600 hover:bg-gray-100';

    return (
        <Link 
            to={to} 
            onClick={onClick}
            className={`flex items-center p-3 rounded-lg transition-colors duration-150 ${
                isSidebarOpen ? expandedClasses : collapsedClasses
            } ${isSidebarOpen ? 'justify-start' : 'justify-center'}`}
            title={label}
        >
            {/* O ícone herda a cor do texto do Link */}
            {icon}
            {isSidebarOpen && <span className="ml-3 text-sm whitespace-nowrap">{label}</span>}
        </Link>
    );
};

interface CRMSidebarProps {
    isOpen: boolean;
    toggleSidebar: () => void;
}

const CRMSidebar: React.FC<CRMSidebarProps> = ({ isOpen, toggleSidebar }) => {
    const sidebarWidth = isOpen ? 'w-64' : 'w-20'; // 64 (256px) vs 20 (80px)
    const [isSystemOpen, setIsSystemOpen] = useState(false); // Estado para o submenu Sistema

    // Estilos para o modo mobile (overlay)
    const mobileClasses = isOpen 
        ? 'fixed inset-0 z-40 transform translate-x-0 transition-transform duration-300 w-64'
        : 'fixed inset-0 z-40 transform -translate-x-full transition-transform duration-300 w-64';
        
    const handleSystemClick = () => {
        if (isOpen) {
            setIsSystemOpen(prev => !prev);
        } else {
            // Se o menu estiver recolhido, expande-o primeiro
            toggleSidebar();
            setIsSystemOpen(true);
        }
    };
    
    const handleNavClick = () => {
        if (window.innerWidth < 1024) {
            toggleSidebar();
        }
    };

    return (
        <>
            {/* Overlay para Mobile quando aberto */}
            {isOpen && (
                <div 
                    className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden" 
                    onClick={toggleSidebar}
                ></div>
            )}

            {/* Sidebar Principal (Desktop) */}
            <aside className={`
                ${sidebarWidth} 
                bg-white border-r border-gray-200 
                flex-shrink-0 overflow-y-auto h-full 
                transition-all duration-300 
                hidden lg:block sticky top-[88px] 
                ${isOpen ? 'lg:w-64' : 'lg:w-20'}
            `}>
                {/* Removendo p-4 do div principal e aplicando padding interno onde necessário */}
                <div className="space-y-1 px-4 pb-4"> 
                    {/* Botão de Toggle (Apenas para Desktop) */}
                    <button 
                        onClick={toggleSidebar}
                        className={`flex items-center p-3 rounded-lg transition-colors duration-150 w-full ${isOpen ? 'justify-end text-slate-600 hover:bg-gray-100' : 'justify-center text-slate-600 hover:bg-gray-100'}`}
                        title={isOpen ? 'Recolher Menu' : 'Expandir Menu'}
                    >
                        {/* O ícone herda a cor do texto do Link */}
                        <Menu className={`w-5 h-5 text-slate-600`} />
                    </button>

                    {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Navegação</h3>}
                    
                    <NavItem to="/crm/dashboard" icon={<Home className="w-5 h-5" />} label="Início" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    
                    {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Imóveis & Vendas</h3>}
                    {!isOpen && <div className="h-4"></div>}
                    <NavItem to="/crm/sales-dashboard" icon={<DollarSign className="w-5 h-5" />} label="Painel de Vendas" isSidebarOpen={isOpen} onClick={handleNavClick} /> {/* NOVO ITEM */}
                    <NavItem to="/crm/imoveis" icon={<Building className="w-5 h-5" />} label="Imóveis" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/condominios" icon={<Building2 className="w-5 h-5" />} label="Condomínios" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/agenciamento" icon={<Briefcase className="w-5 h-5" />} label="Agenciamento" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/chaves" icon={<Key className="w-5 h-5" />} label="Chaves" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/propostas" icon={<FileText className="w-5 h-5" />} label="Propostas" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/leads" icon={<Zap className="w-5 h-5" />} label="Leads" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/oportunidades" icon={<TrendingUp className="w-5 h-5" />} label="Oportunidades" isSidebarOpen={isOpen} onClick={handleNavClick} /> {/* NOVO ITEM */}
                    
                    {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Pessoas & Rotinas</h3>}
                    {!isOpen && <div className="h-4"></div>}
                    <NavItem to="/crm/pessoas" icon={<Users className="w-5 h-5" />} label="Pessoas" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/crm/atividades" icon={<CalendarCheck className="w-5 h-5" />} label="Atividades" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    
                    {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Ferramentas</h3>}
                    {!isOpen && <div className="h-4"></div>}
                    <NavItem to="/simulador" icon={<DollarSign className="w-5 h-5" />} label="Simulador Financeiro" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/analise-de-mercado" icon={<Building className="w-5 h-5" />} label="Análise de Mercado" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/metas-agenciamento" icon={<Target className="w-5 h-5" />} label="Metas Agenciamento" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    <NavItem to="/mapa-teste" icon={<Map className="w-5 h-5" />} label="Teste de Mapa" isSidebarOpen={isOpen} onClick={handleNavClick} />
                    
                    {isOpen && <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1">Administração</h3>}
                    {!isOpen && <div className="h-4"></div>}
                    
                    <div className="relative">
                        <button
                            onClick={handleSystemClick}
                            className={`flex items-center p-3 rounded-lg transition-colors duration-150 w-full ${
                                isSystemOpen 
                                ? 'bg-blue-100 text-blue-800 font-semibold' 
                                : (isOpen ? 'text-slate-600 hover:bg-gray-100' : 'text-slate-600 hover:bg-gray-100')
                            } ${isOpen ? 'justify-start' : 'justify-center'}`}
                            title="Sistema"
                        >
                            <Settings className="w-5 h-5" />
                            {isOpen && <span className="ml-3 text-sm whitespace-nowrap">Sistema</span>}
                        </button>
                        
                        {isSystemOpen && (
                            <div className="pl-4 pt-1 space-y-1">
                                <NavItem to="/crm/sistema/site" icon={<Globe className="w-5 h-5" />} label="Site" isSidebarOpen={true} onClick={handleNavClick} />
                                <NavItem to="/crm/sistema/geral" icon={<Settings className="w-5 h-5" />} label="Geral (Mock)" isSidebarOpen={true} onClick={handleNavClick} />
                            </div>
                        )}
                    </div>
                </div>
            </aside>
            
            {/* Sidebar para Mobile (Overlay) - A prop isSidebarOpen é sempre true aqui */}
            <aside className={`
                ${mobileClasses} 
                bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto h-full 
                lg:hidden
            `}>
                <div className="p-4 space-y-1">
                    <div className="flex justify-between items-center mb-4 border-b pb-2">
                        <h3 className="text-lg font-bold text-dark-text">Menu CRM</h3>
                        <button onClick={toggleSidebar} className="text-gray-600 hover:text-red-600 p-1 rounded-full hover:bg-gray-100">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    
                    <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1 px-3">Navegação</h3>
                    <NavItem to="/crm/dashboard" icon={<Home className="w-5 h-5" />} label="Início" isSidebarOpen={true} onClick={handleNavClick} />
                    
                    <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1 px-3">Imóveis & Vendas</h3>
                    <NavItem to="/crm/sales-dashboard" icon={<DollarSign className="w-5 h-5" />} label="Painel de Vendas" isSidebarOpen={true} onClick={handleNavClick} /> {/* NOVO ITEM */}
                    <NavItem to="/crm/imoveis" icon={<Building className="w-5 h-5" />} label="Imóveis" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/crm/condominios" icon={<Building2 className="w-5 h-5" />} label="Condomínios" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/crm/agenciamento" icon={<Briefcase className="w-5 h-5" />} label="Agenciamento" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/crm/chaves" icon={<Key className="w-5 h-5" />} label="Chaves" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/crm/propostas" icon={<FileText className="w-5 h-5" />} label="Propostas" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/crm/leads" icon={<Zap className="w-5 h-5" />} label="Leads" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/crm/oportunidades" icon={<TrendingUp className="w-5 h-5" />} label="Oportunidades" isSidebarOpen={true} onClick={handleNavClick} /> {/* NOVO ITEM */}
                    
                    <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1 px-3">Pessoas & Rotinas</h3>
                    <NavItem to="/crm/pessoas" icon={<Users className="w-5 h-5" />} label="Pessoas" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/crm/atividades" icon={<CalendarCheck className="w-5 h-5" />} label="Atividades" isSidebarOpen={true} onClick={handleNavClick} />
                    
                    <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1 px-3">Ferramentas</h3>
                    <NavItem to="/simulador" icon={<DollarSign className="w-5 h-5" />} label="Simulador Financeiro" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/analise-de-mercado" icon={<Building className="w-5 h-5" />} label="Análise de Mercado" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/metas-agenciamento" icon={<Target className="w-5 h-5" />} label="Metas Agenciamento" isSidebarOpen={true} onClick={handleNavClick} />
                    <NavItem to="/mapa-teste" icon={<Map className="w-5 h-5" />} label="Teste de Mapa" isSidebarOpen={true} onClick={handleNavClick} />
                    
                    <h3 className="text-xs font-semibold uppercase text-gray-400 pt-4 pb-1 px-3">Administração</h3>
                    <div className="relative">
                        <button
                            onClick={handleSystemClick}
                            className={`flex items-center p-3 rounded-lg transition-colors duration-150 w-full ${
                                isSystemOpen 
                                ? 'bg-blue-100 text-blue-800 font-semibold' 
                                : 'text-slate-600 hover:bg-gray-100'
                            } justify-start`}
                            title="Sistema"
                        >
                            <Settings className="w-5 h-5" />
                            <span className="ml-3 text-sm whitespace-nowrap">Sistema</span>
                        </button>
                        
                        {isSystemOpen && (
                            <div className="pl-4 pt-1 space-y-1">
                                <NavItem to="/crm/sistema/site" icon={<Globe className="w-5 h-5" />} label="Site" isSidebarOpen={true} onClick={handleNavClick} />
                                <NavItem to="/crm/sistema/geral" icon={<Settings className="w-5 h-5" />} label="Geral (Mock)" isSidebarOpen={true} onClick={handleNavClick} />
                            </div>
                        )}
                    </div>
                </div>
            </aside>
        </>
    );
};

export default CRMSidebar;
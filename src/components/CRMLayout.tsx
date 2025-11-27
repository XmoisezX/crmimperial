import React, { useState } from 'react';
import CRMSidebar from './CRMSidebar';
import Header from './Header';
import Footer from './Footer';
import { Menu } from 'lucide-react';

interface CRMLayoutProps {
    children: React.ReactNode;
}

const CRMLayout: React.FC<CRMLayoutProps> = ({ children }) => {
    // Começa aberto em desktop, fechado em mobile
    const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024); 

    const toggleSidebar = () => {
        setIsSidebarOpen(prev => !prev);
    };

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 font-sans">
            <Header toggleSidebar={toggleSidebar} /> {/* Passa o toggle para o Header */}
            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar do CRM */}
                <CRMSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
                
                {/* Conteúdo Principal */}
                <main className={`flex-1 overflow-y-auto bg-gray-50 transition-all duration-300`}>
                    {children}
                </main>
            </div>
            <Footer />
        </div>
    );
};

export default CRMLayout;
import React from 'react';
import PublicHeader from '../components/PublicHeader';
import Footer from '../components/Footer';

interface PublicLayoutProps {
    children: React.ReactNode;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-white font-sans">
            {/* O cabeçalho agora é fixo/absoluto e flutua sobre o conteúdo */}
            <PublicHeader />
            
            {/* O main começa no topo da tela, permitindo que o banner preencha o espaço */}
            <main className="flex-1 overflow-y-auto">
                {children}
            </main>
            <Footer />
        </div>
    );
};

export default PublicLayout;
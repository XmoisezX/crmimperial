import React, { useState, useRef, useEffect } from 'react';
import { Settings, Bell, Mail, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import ProfileSettingsModal from './ProfileSettingsModal';
import { Button } from './ui/Button';

const UserProfileDropdown: React.FC = () => {
    const { session, supabase } = useAuth();
    const { profile, isLoading } = useProfile();
    const [isOpen, setIsOpen] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleSignOut = async () => {
        // Fecha o dropdown imediatamente
        setIsOpen(false); 
        
        // Se não houver sessão, não precisamos fazer nada, o App.tsx já redireciona.
        if (!session) {
            console.warn('Tentativa de logout sem sessão ativa.');
            return;
        }
        
        try {
            // Chama a função de logout do Supabase
            const { error } = await supabase.auth.signOut();
            
            if (error) {
                // Se for o erro específico de sessão ausente, tratamos como sucesso.
                if (error.message.includes('Auth session missing!')) {
                    console.warn('Sessão já estava ausente, logout concluído.');
                    // Não lançamos erro, mas permitimos que o fluxo continue.
                    return;
                }
                
                // Para outros erros, logamos e lançamos.
                console.error('Erro ao fazer logout:', error);
                throw new Error(`Falha ao sair da conta: ${error.message}`);
            }
        } catch (e) {
            // Captura erros de rede ou outros erros não tratados pelo Supabase
            console.error('Erro inesperado durante o logout:', e);
            throw e;
        }
    };

    const toggleDropdown = () => setIsOpen(prev => !prev);
    
    const handleOpenModal = () => {
        setIsModalOpen(true);
        setIsOpen(false);
    };

    // Fechar dropdown ao clicar fora
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // O avatar_url é obtido do perfil. Se for null, o ícone User será exibido.
    const avatarUrl = profile?.avatar_url; 

    const menuItems = [
        { icon: <Settings className="w-5 h-5" />, label: 'Configurações da conta', action: handleOpenModal },
        { icon: <Bell className="w-5 h-5" />, label: 'Configurações de notificações', action: () => alert('Abrir página de notificações (Mock)') },
        { icon: <Mail className="w-5 h-5" />, label: 'E-mail empresarial', action: () => window.open('https://webmail.imperialparis.com.br', '_blank') },
    ];

    if (isLoading) {
        return <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse"></div>;
    }

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={toggleDropdown}
                className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors focus:outline-none"
            >
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <User className="w-6 h-6 text-gray-500" />
                    )}
                </div>
                <span className="text-sm font-medium text-dark-text hidden md:block">
                    {profile?.full_name || session?.user.email?.split('@')[0] || 'Usuário'}
                </span>
                <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : 'rotate-0'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-64 origin-top-right rounded-lg shadow-xl bg-white ring-1 ring-black ring-opacity-5 z-30 animate-fade-in">
                    <div className="p-4 border-b border-gray-100">
                        <p className="text-sm font-semibold text-dark-text">{profile?.full_name || 'Usuário'}</p>
                        <p className="text-xs text-light-text">{profile?.role || 'Função não definida'}</p>
                        <p className="text-xs text-primary-orange font-medium mt-1">{profile?.company_name || 'IMPERIAL PARIS'}</p>
                    </div>
                    
                    <div className="py-1">
                        {menuItems.map((item, index) => (
                            <button
                                key={index}
                                onClick={item.action}
                                className="flex items-center w-full px-4 py-2 text-sm text-dark-text hover:bg-gray-100 transition-colors"
                            >
                                {item.icon}
                                <span className="ml-3">{item.label}</span>
                            </button>
                        ))}
                        
                        {/* Sair */}
                        <button
                            onClick={handleSignOut}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors border-t border-gray-100 mt-1"
                        >
                            <LogOut className="w-5 h-5" />
                            <span className="ml-3">Sair</span>
                        </button>
                    </div>
                    
                    <div className="p-2 text-xs text-center border-t border-gray-100">
                        <a href="#" className="text-blue-600 hover:underline mx-2">Política de privacidade</a>
                        <a href="#" className="text-blue-600 hover:underline mx-2">Termos de uso</a>
                    </div>
                </div>
            )}
            
            <ProfileSettingsModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
            />
        </div>
    );
};

export default UserProfileDropdown;
import React, { useState, useEffect, useCallback } from 'react';
import { User, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
}

interface UserSelectProps {
    label: string;
    id: string;
    value: string; // ID do usuário selecionado
    onChange: (userId: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

const UserSelect: React.FC<UserSelectProps> = ({ label, id, value, onChange, placeholder = "Selecione um usuário", required = false, disabled = false }) => {
    const { session } = useAuth();
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchUsers = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        
        // Busca todos os perfis (usuários)
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .order('full_name', { ascending: true });

        if (error) {
            console.error('Error fetching users:', error);
        } else {
            // Adiciona o usuário logado se ele não estiver na lista (garantindo que ele possa ser selecionado)
            const loggedInUser = {
                id: session.user.id,
                full_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'Usuário Logado',
                email: session.user.email || '',
            };
            
            let uniqueUsers = data as UserProfile[];
            if (!uniqueUsers.some(u => u.id === loggedInUser.id)) {
                uniqueUsers = [loggedInUser, ...uniqueUsers];
            }
            
            setUsers(uniqueUsers.sort((a, b) => a.full_name.localeCompare(b.full_name)));
        }
        setIsLoading(false);
    }, [session]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);
    
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium text-light-text">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative flex-1">
                <select
                    id={id}
                    value={value}
                    onChange={handleSelectChange}
                    disabled={disabled || isLoading}
                    className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary-orange focus:border-primary-orange sm:text-sm transition duration-150 ease-in-out disabled:bg-gray-100"
                >
                    <option value="" disabled>{isLoading ? 'Carregando usuários...' : placeholder}</option>
                    {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.full_name || user.email}
                        </option>
                    ))}
                </select>
                {isLoading && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserSelect;
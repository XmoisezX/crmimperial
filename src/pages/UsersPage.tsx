import React, { useEffect, useState } from 'react';
import { supabase } from '../integrations/supabase/client';
import { User, Lock, RefreshCw, Plus, Search, Shield } from 'lucide-react';

interface Profile {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
}

interface Role {
    id: number;
    nome: string;
}

interface UserRole {
    user_id: string;
    role_id: number;
}

const UsersPage: React.FC = () => {
    const [users, setUsers] = useState<Profile[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [userRoles, setUserRoles] = useState<UserRole[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);

            // Fetch roles
            const { data: rolesData, error: rolesError } = await supabase
                .from('roles')
                .select('*')
                .order('id');

            if (rolesError) throw rolesError;
            setRoles(rolesData || []);

            // Fetch profiles
            const { data: profilesData, error: profilesError } = await supabase
                .from('profiles')
                .select('*');

            if (profilesError) throw profilesError;
            setUsers(profilesData || []);

            // Fetch user roles
            const { data: userRolesData, error: userRolesError } = await supabase
                .from('user_roles')
                .select('*');

            if (userRolesError) throw userRolesError;
            setUserRoles(userRolesData || []);

        } catch (error) {
            console.error('Error fetching data:', error);
            alert('Erro ao carregar dados de usuários');
        } finally {
            setLoading(false);
        }
    };

    const handleRoleToggle = async (userId: string, roleId: number, isChecked: boolean) => {
        try {
            if (isChecked) {
                // Add role
                const { error } = await supabase
                    .from('user_roles')
                    .insert({ user_id: userId, role_id: roleId });

                if (error) throw error;
                setUserRoles([...userRoles, { user_id: userId, role_id: roleId }]);
                // alert('Permissão adicionada');
            } else {
                // Remove role
                const { error } = await supabase
                    .from('user_roles')
                    .delete()
                    .match({ user_id: userId, role_id: roleId });

                if (error) throw error;
                setUserRoles(userRoles.filter(ur => !(ur.user_id === userId && ur.role_id === roleId)));
                // alert('Permissão removida');
            }
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Erro ao atualizar permissão');
        }
    };

    const handleResetPassword = async (email: string | null) => {
        if (!email) {
            alert('Email não disponível para este usuário');
            return;
        }

        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/update-password`,
            });

            if (error) throw error;
            alert(`Email de redefinição enviado para ${email}`);
        } catch (error: any) {
            console.error('Error resetting password:', error);
            alert(`Erro ao enviar email: ${error.message || 'Erro desconhecido'}`);
        }
    };

    const filteredUsers = users.filter(user =>
        (user.full_name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Shield className="w-6 h-6 text-blue-600" />
                        Usuários e Grupos de Permissão
                    </h1>
                    <p className="text-gray-500 mt-1">Lista de usuários (profiles) e grupos (roles) do sistema.</p>
                </div>

                <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="relative flex-grow md:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                            type="text"
                            placeholder="Pesquise por nome ou e-mail"
                            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md flex items-center gap-2 transition-colors">
                        <Plus className="w-4 h-4" />
                        Novo usuário
                    </button>

                    <button
                        onClick={fetchData}
                        className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-md flex items-center gap-2 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="border-b border-gray-200">
                    <nav className="flex -mb-px">
                        <button className="px-6 py-4 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
                            Usuários
                        </button>
                        <button className="px-6 py-4 border-b-2 border-transparent text-gray-500 hover:text-gray-700 font-medium text-sm">
                            Grupos
                        </button>
                    </nav>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Usuário
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    E-mail
                                </th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Grupos
                                </th>
                                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Ações
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        Carregando...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0 h-10 w-10">
                                                    {user.avatar_url ? (
                                                        <img className="h-10 w-10 rounded-full object-cover" src={user.avatar_url} alt="" />
                                                    ) : (
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                            <User className="w-6 h-6" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="ml-4">
                                                    <div className="text-sm font-medium text-gray-900">{user.full_name || 'Sem nome'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-500 flex items-center gap-2">
                                                {user.email || 'Email não disponível'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex gap-2 flex-wrap">
                                                {roles.map(role => {
                                                    const hasRole = userRoles.some(ur => ur.user_id === user.id && ur.role_id === role.id);
                                                    return (
                                                        <label key={role.id} className="inline-flex items-center space-x-2 cursor-pointer">
                                                            <input
                                                                type="checkbox"
                                                                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                                                                checked={hasRole}
                                                                onChange={(e) => handleRoleToggle(user.id, role.id, e.target.checked)}
                                                            />
                                                            <span className="text-sm text-gray-700">{role.nome}</span>
                                                        </label>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => handleResetPassword(user.email)}
                                                className="text-gray-600 hover:text-blue-600 border border-gray-300 hover:border-blue-400 px-3 py-1 rounded-md transition-colors flex items-center gap-2 ml-auto"
                                            >
                                                <Lock className="w-3 h-3" />
                                                Resetar senha
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default UsersPage;

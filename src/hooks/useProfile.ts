import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

interface Profile {
    id: string;
    full_name: string;
    email: string;
    role: string | null;
    company_name: string | null;
    avatar_url: string | null;
    phone: string | null; // Campo adicionado
}

interface UpdateProfileData {
    full_name?: string;
    role?: string;
    company_name?: string;
    avatar_url?: string;
    phone?: string; // Campo adicionado
}

export const useProfile = () => {
    const { session } = useAuth();
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProfile = useCallback(async () => {
        if (!session?.user.id) {
            setProfile(null);
            setIsLoading(false);
            return;
        }

        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, email, role, company_name, avatar_url, phone') // Selecionando o novo campo
            .eq('id', session.user.id)
            .single();

        if (error && error.code !== 'PGRST116') { // Ignora erro "Row not found"
            console.error('Error fetching profile:', error);
            setError(error.message);
        } else {
            setProfile(data as Profile);
        }
        setIsLoading(false);
    }, [session?.user.id]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const updateProfile = useCallback(async (updates: UpdateProfileData) => {
        if (!session?.user.id) {
            setError('Usuário não autenticado.');
            return false;
        }

        setError(null);
        
        const profileData = {
            id: session.user.id, // Essencial para o upsert
            email: session.user.email, // Garante que o email esteja presente
            ...updates,
            updated_at: new Date().toISOString(),
        };

        // Usar upsert para criar o perfil se ele não existir, ou atualizá-lo se existir.
        const { error } = await supabase
            .from('profiles')
            .upsert(profileData);

        if (error) {
            console.error('Error upserting profile:', error);
            setError(`Erro ao atualizar o perfil: ${error.message}`);
            return false;
        }

        // Após um upsert bem-sucedido, buscamos os dados novamente para garantir consistência.
        await fetchProfile();
        return true;
    }, [session?.user.id, fetchProfile]);

    return { profile, isLoading, error, updateProfile, fetchProfile };
};
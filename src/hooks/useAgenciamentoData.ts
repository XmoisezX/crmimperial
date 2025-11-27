import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';

export interface Planilha {
    id: string;
    nome: string;
    headers: string[];
    data: string[][];
    updated_at: string;
}

export const useAgenciamentoData = () => {
    const { session } = useAuth();
    const [planilhas, setPlanilhas] = useState<Planilha[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPlanilhas = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        setError(null);

        const { data, error } = await supabase
            .from('agenciamento_planilhas')
            .select('id, nome, headers, data, updated_at')
            .eq('user_id', session.user.id)
            .order('updated_at', { ascending: false });

        if (error) {
            console.error('Error fetching planilhas:', error);
            setError('Erro ao carregar planilhas salvas.');
        } else {
            setPlanilhas(data as Planilha[]);
        }
        setIsLoading(false);
    }, [session]);

    useEffect(() => {
        fetchPlanilhas();
    }, [fetchPlanilhas]);

    const savePlanilha = useCallback(async (nome: string, headers: string[], data: string[][], id?: string) => {
        if (!session) {
            setError('Usuário não autenticado.');
            return { success: false, id: undefined };
        }

        setError(null);
        const dataToSave = {
            user_id: session.user.id,
            nome: nome.trim(),
            headers,
            data,
        };

        let result;
        if (id) {
            // Update existing
            result = await supabase
                .from('agenciamento_planilhas')
                .update(dataToSave)
                .eq('id', id)
                .select('id')
                .single();
        } else {
            // Insert new
            result = await supabase
                .from('agenciamento_planilhas')
                .insert(dataToSave)
                .select('id')
                .single();
        }

        if (result.error) {
            console.error('Error saving planilha:', result.error);
            setError(`Falha ao salvar planilha: ${result.error.message}`);
            return { success: false, id: undefined };
        }

        await fetchPlanilhas();
        return { success: true, id: result.data.id };
    }, [session, fetchPlanilhas]);
    
    const deletePlanilha = useCallback(async (id: string) => {
        if (!session) return false;
        
        const { error } = await supabase
            .from('agenciamento_planilhas')
            .delete()
            .eq('id', id)
            .eq('user_id', session.user.id);
            
        if (error) {
            console.error('Error deleting planilha:', error);
            setError(`Falha ao excluir planilha: ${error.message}`);
            return false;
        }
        
        await fetchPlanilhas();
        return true;
    }, [session, fetchPlanilhas]);

    return { planilhas, isLoading, error, savePlanilha, deletePlanilha, fetchPlanilhas };
};
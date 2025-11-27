import { supabase } from '../integrations/supabase/client';
import { ImovelChave } from '../../types';

/**
 * Salva (insere/atualiza) e exclui chaves de um imóvel.
 * @param imovelId ID do imóvel.
 * @param userId ID do usuário.
 * @param currentChaves Lista atual de chaves (incluindo novas e modificadas).
 * @param initialChaves Lista original de chaves (para identificar exclusões).
 */
export const syncImovelChaves = async (
    imovelId: string, 
    userId: string, 
    currentChaves: ImovelChave[], 
    initialChaves: ImovelChave[]
) => {
    const currentIds = new Set(currentChaves.map(c => c.id));
    const initialIds = new Set(initialChaves.map(c => c.id));

    // 1. Identificar e Excluir chaves removidas
    const chavesToDelete = initialChaves.filter(c => !currentIds.has(c.id));
    if (chavesToDelete.length > 0) {
        const idsToDelete = chavesToDelete.map(c => c.id);
        const { error } = await supabase
            .from('imovel_chaves')
            .delete()
            .in('id', idsToDelete);
        if (error) console.error('Erro ao excluir chaves:', error);
    }

    // 2. Identificar e Inserir/Atualizar chaves
    const chavesToUpsert = currentChaves.map(chave => ({
        ...chave,
        imovel_id: imovelId,
        user_id: userId,
        // Mapeamento de campos para o DB (snake_case)
        responsavel_tipo: chave.responsavel_tipo,
        codigo_chave: chave.codigo_chave,
        disponivel_emprestimo: chave.disponivel_emprestimo,
        nome_contato: chave.nome_contato,
        telefone_contato: chave.telefone_contato,
        observacoes: chave.observacoes,
    }));

    if (chavesToUpsert.length > 0) {
        const { error } = await supabase
            .from('imovel_chaves')
            .upsert(chavesToUpsert, { onConflict: 'id' });
        
        if (error) console.error('Erro ao salvar/atualizar chaves:', error);
    }
};

/**
 * Busca todas as chaves associadas a um imóvel.
 */
export const fetchImovelChaves = async (imovelId: string) => {
    const { data, error } = await supabase
        .from('imovel_chaves')
        .select('id, responsavel_tipo, codigo_chave, disponivel_emprestimo, nome_contato, telefone_contato, observacoes')
        .eq('imovel_id', imovelId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Erro ao buscar chaves:', error);
        return [];
    }
    
    // Mapear de snake_case para camelCase (ImovelChave interface)
    return data.map(dbChave => ({
        id: dbChave.id,
        responsavel_tipo: dbChave.responsavel_tipo,
        codigo_chave: dbChave.codigo_chave,
        disponivel_emprestimo: dbChave.disponivel_emprestimo,
        nome_contato: dbChave.nome_contato,
        telefone_contato: dbChave.telefone_contato,
        observacoes: dbChave.observacoes,
    })) as ImovelChave[];
};
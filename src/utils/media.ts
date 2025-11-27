import { supabase } from '../integrations/supabase/client';
import { ImovelImage, CondominioMedia } from '../../types'; // Importando o tipo de imagem

// Simula a otimização e retorna um novo nome de arquivo (simulando WebP)
const simulateOptimization = (file: File): File => {
    // Em um ambiente real, aqui usaríamos uma biblioteca (Sharp/JIMP) ou um Edge Function
    // para converter o file.file para WebP e retornar um novo File/Blob.
    
    // Para simulação no cliente, apenas renomeamos o arquivo para .webp
    const newName = file.name.replace(/\.[^/.]+$/, "") + '.webp';
    
    // Criamos um novo File com o nome WebP simulado.
    return new File([file], newName, { type: 'image/webp' });
};

/**
 * Faz o upload de uma lista de imagens para o Supabase Storage e retorna os metadados.
 * @param images Lista de objetos ImovelImage.
 * @param userId ID do usuário logado.
 * @param imovelId ID do imóvel recém-criado.
 * @returns Lista de metadados das imagens salvas.
 */
export const uploadImovelMedia = async (images: ImovelImage[], userId: string, imovelId: string) => {
    const uploadedMedia: { id: string, url: string, legend: string, is_visible: boolean, rotation: number, ordem: number }[] = [];

    for (const image of images) {
        // Se a imagem não tem um arquivo, significa que já existe no storage e não precisa ser reenviada
        if (!image.file) {
            continue;
        }

        // 1. Simular Otimização (WebP)
        const optimizedFile = simulateOptimization(image.file as File);
        
        // 2. Definir o caminho no Storage
        const filePath = `imoveis/${imovelId}/${image.id}-${optimizedFile.name}`;

        // 3. Upload para o Storage
        const { error: uploadError } = await supabase.storage
            .from('imovel-media') // Usando o bucket 'imovel-media'
            .upload(filePath, optimizedFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error(`Erro ao fazer upload da imagem ${image.id}:`, uploadError);
            continue;
        }

        // 4. Obter URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('imovel-media')
            .getPublicUrl(filePath);
            
        // 5. Adicionar metadados
        uploadedMedia.push({
            id: image.id, // Incluir o ID gerado no cliente
            url: publicUrl,
            legend: image.legend,
            is_visible: image.isVisible,
            rotation: image.rotation,
            ordem: image.ordem, // Incluir a ordem
        });
    }
    
    return uploadedMedia;
};

/**
 * Salva os metadados das mídias na tabela imagens_imovel.
 */
export const saveMediaMetadata = async (imovelId: string, userId: string, media: { id: string, url: string, legend: string, is_visible: boolean, rotation: number, ordem: number }[]) => {
    if (media.length === 0) return { error: null };
    
    const dataToInsert = media.map(m => ({
        id: m.id, // Usar o ID gerado no cliente
        imovel_id: imovelId,
        user_id: userId,
        url: m.url,
        legend: m.legend,
        is_visible: m.is_visible,
        rotation: m.rotation,
        ordem: m.ordem, // Incluir a ordem
    }));
    
    const { error } = await supabase
        .from('imagens_imovel') // CORRIGIDO: Usando a tabela 'imagens_imovel'
        .insert(dataToInsert);
        
    return { error };
};

// --- Condominio Media Utilities ---

/**
 * Faz o upload de mídias de condomínio (imagens/logo) para o Supabase Storage.
 */
export const uploadCondominioMedia = async (media: CondominioMedia[], userId: string, condominioId: string) => {
    const uploadedMedia: { id: string, url: string, tipo: 'imagem' | 'video', destaque: boolean, ordem: number }[] = [];

    for (const item of media) {
        if (!item.file) continue;

        const optimizedFile = simulateOptimization(item.file as File);
        const filePath = `condominios/${condominioId}/${item.id}-${optimizedFile.name}`;

        const { error: uploadError } = await supabase.storage
            .from('condominio-media') // Novo bucket assumido
            .upload(filePath, optimizedFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error(`Erro ao fazer upload da mídia ${item.id}:`, uploadError);
            continue;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('condominio-media')
            .getPublicUrl(filePath);
            
        uploadedMedia.push({
            id: item.id,
            url: publicUrl,
            tipo: item.tipo,
            destaque: item.destaque,
            ordem: item.ordem,
        });
    }
    
    return uploadedMedia;
};

/**
 * Salva os metadados das mídias na tabela condominio_midias.
 */
export const saveCondominioMediaMetadata = async (condominioId: string, media: { id: string, url: string, tipo: 'imagem' | 'video', destaque: boolean, ordem: number }[]) => {
    if (media.length === 0) return { error: null };
    
    const dataToInsert = media.map(m => ({
        id: m.id,
        condominio_id: condominioId,
        tipo: m.tipo,
        arquivo_url: m.url,
        destaque: m.destaque,
        ordem: m.ordem,
    }));
    
    const { error } = await supabase
        .from('condominio_midias')
        .insert(dataToInsert);
        
    return { error };
};

/**
 * Faz o upload de um logo para o Condomínio.
 */
export const uploadCondominioLogo = async (file: File, condominioId: string) => {
    const optimizedFile = simulateOptimization(file);
    const filePath = `condominios/${condominioId}/logo-${optimizedFile.name}`;

    const { error: uploadError } = await supabase.storage
        .from('condominio-media')
        .upload(filePath, optimizedFile, {
            cacheControl: '3600',
            upsert: true,
        });

    if (uploadError) {
        console.error('Erro ao fazer upload do logo:', uploadError);
        return { url: null, error: uploadError };
    }

    const { data: { publicUrl } } = supabase.storage
        .from('condominio-media')
        .getPublicUrl(filePath);
        
    return { url: publicUrl, error: null };
};
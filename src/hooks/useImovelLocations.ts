import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

interface ImovelLocation {
    id: string;
    codigo: string;
    bairro: string;
    logradouro: string;
    numero: string;
    lat: number;
    lng: number;
    
    // Dados para a lista
    dados_contrato: any;
    dados_valores: any;
    dados_caracteristicas: any;
    imagens_imovel: { url: string, rotation: number, ordem: number }[];
}

// Função de geocodificação simulada (usando Nominatim)
const geocodeAddress = async (address: string): Promise<{ lat: number, lng: number } | null> => {
    if (!address.trim()) return null;
    
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

    try {
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'ImperialParisImoveisSimulator/1.0 (contato@imperialparis.com.br)'
            }
        });
        
        if (!response.ok) return null;

        const result = await response.json();

        if (result && result.length > 0) {
            return {
                lat: parseFloat(result[0].lat),
                lng: parseFloat(result[0].lon),
            };
        }
        return null;
    } catch (err) {
        console.error("Geocoding error:", err);
        return null;
    }
};

export const useImovelLocations = () => {
    const [imoveis, setImoveis] = useState<ImovelLocation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchImoveis = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        // 1. Busca imóveis que estão 'Aprovado' e disponíveis para Venda
        const { data, error } = await supabase
            .from('imoveis')
            .select(`
                id, codigo, bairro, logradouro, numero,
                dados_contrato, dados_valores, dados_localizacao, dados_caracteristicas,
                imagens_imovel(url, rotation, ordem)
            `)
            .eq('status_aprovacao', 'Aprovado')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Erro ao buscar imóveis públicos:', error);
            setError('Não foi possível carregar os imóveis.');
            setImoveis([]);
            setIsLoading(false);
            return;
        }
        
        // 2. Filtra e geocodifica (simulando o processo)
        const availableImoveis = (data as any[]).filter(imovel => {
            const { venda_ativo, venda_disponibilidade } = imovel.dados_contrato;
            return venda_ativo && venda_disponibilidade === 'Disponível';
        });
        
        const geocodedImoveis: ImovelLocation[] = [];
        
        // Processamento sequencial para evitar sobrecarga do Nominatim
        for (const imovel of availableImoveis) {
            const address = `${imovel.logradouro}, ${imovel.numero}, ${imovel.bairro}, ${imovel.dados_localizacao.cidade}, ${imovel.dados_localizacao.estado}`;
            
            // Apenas geocodifica se o endereço for completo
            if (imovel.logradouro && imovel.numero && imovel.bairro) {
                const coords = await geocodeAddress(address);
                
                if (coords) {
                    // Ordena as imagens
                    if (imovel.imagens_imovel) {
                        imovel.imagens_imovel.sort((a: any, b: any) => a.ordem - b.ordem);
                    }
                    
                    geocodedImoveis.push({
                        ...imovel,
                        lat: coords.lat,
                        lng: coords.lng,
                    });
                }
            }
        }
        
        setImoveis(geocodedImoveis);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchImoveis();
    }, [fetchImoveis]);

    return { imoveis, isLoading, error, fetchImoveis };
};
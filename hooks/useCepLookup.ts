import { useState, useCallback } from 'react';

interface CepData {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string; // Cidade
    uf: string; // Estado
    ibge: string;
    gia: string;
    ddd: string;
    siafi: string;
}

interface UseCepLookupResult {
    data: CepData | null;
    loading: boolean;
    error: string | null;
    lookup: (cep: string) => Promise<void>;
}

export const useCepLookup = (): UseCepLookupResult => {
    const [data, setData] = useState<CepData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lookup = useCallback(async (cep: string) => {
        // Remove non-digit characters
        const cleanCep = cep.replace(/\D/g, '');

        if (cleanCep.length !== 8) {
            setError('CEP deve conter 8 dígitos.');
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            // Adicionamos uma verificação de 'ok' para erros de rede (ex: 404, 500)
            if (!response.ok) {
                throw new Error('Falha na requisição à API.');
            }
            
            const result = await response.json();

            if (result.erro) {
                setError('CEP não encontrado.');
                return; // Retorna aqui, 'finally' ainda será executado
            }

            // --- SIMPLIFICAÇÃO APLICADA AQUI ---
            // A resposta 'result' já corresponde à interface 'CepData'
            setData(result);

        } catch (err) {
            // Tratamento de erro um pouco mais genérico
            setError('Erro ao buscar CEP. Verifique sua conexão ou a API.');
        } finally {
            setLoading(false);
        }
    }, []); // O array de dependências vazio está correto

    return { data, loading, error, lookup };
};
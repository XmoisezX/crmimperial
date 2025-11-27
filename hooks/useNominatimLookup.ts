import { useState, useCallback } from 'react';

interface NominatimLocation {
    lat: number;
    lng: number;
    display_name: string;
}

interface UseNominatimLookupResult {
    location: NominatimLocation | null;
    loading: boolean;
    error: string | null;
    lookup: (address: string) => Promise<void>;
}

export const useNominatimLookup = (): UseNominatimLookupResult => {
    const [location, setLocation] = useState<NominatimLocation | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lookup = useCallback(async (address: string) => {
        if (!address.trim()) {
            setLocation(null);
            setError(null);
            return;
        }

        setLoading(true);
        setError(null);
        setLocation(null);

        // Usando a API Nominatim (OpenStreetMap)
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;

        try {
            const response = await fetch(url, {
                headers: {
                    // Boas práticas do Nominatim: fornecer um User-Agent
                    'User-Agent': 'ImperialParisImoveisSimulator/1.0 (contato@imperialparis.com.br)'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Falha na busca: ${response.statusText}`);
            }

            const result = await response.json();

            if (result && result.length > 0) {
                const firstResult = result[0];
                setLocation({
                    lat: parseFloat(firstResult.lat),
                    lng: parseFloat(firstResult.lon),
                    display_name: firstResult.display_name,
                });
            } else {
                setError('Endereço não encontrado pelo Nominatim.');
            }

        } catch (err) {
            console.error("Nominatim lookup error:", err);
            setError('Erro ao buscar coordenadas. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    }, []);

    return { location, loading, error, lookup };
};
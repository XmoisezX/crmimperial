import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Home, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/Button';
import { Link } from 'react-router-dom';

interface Imovel {
    id: string;
    codigo: string;
    logradouro: string;
    numero: string;
    bairro: string;
}

interface ImovelSelectProps {
    label: string;
    id: string;
    value: string; // ID do imóvel selecionado
    onChange: (imovelId: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

const ImovelSelect: React.FC<ImovelSelectProps> = ({ label, id, value, onChange, placeholder = "Selecione um imóvel", required = false, disabled = false }) => {
    const { session } = useAuth();
    const [imoveis, setImoveis] = useState<Imovel[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchImoveis = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        
        const { data, error } = await supabase
            .from('imoveis')
            .select('id, codigo, logradouro, numero, bairro')
            .eq('user_id', session.user.id)
            .order('codigo', { ascending: true });

        if (error) {
            console.error('Error fetching imoveis:', error);
        } else {
            setImoveis(data as Imovel[]);
        }
        setIsLoading(false);
    }, [session]);

    useEffect(() => {
        fetchImoveis();
    }, [fetchImoveis]);
    
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className="space-y-2">
            <label htmlFor={id} className="block text-sm font-medium text-light-text">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="flex space-x-2">
                <div className="relative flex-1">
                    <select
                        id={id}
                        value={value}
                        onChange={handleSelectChange}
                        disabled={disabled || isLoading}
                        className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-secondary-orange focus:border-primary-orange sm:text-sm transition duration-150 ease-in-out disabled:bg-gray-100"
                    >
                        <option value="">{isLoading ? 'Carregando...' : placeholder}</option>
                        {imoveis.map(imovel => (
                            <option key={imovel.id} value={imovel.id}>
                                {imovel.codigo} - {imovel.logradouro}, {imovel.numero} ({imovel.bairro})
                            </option>
                        ))}
                    </select>
                    {isLoading && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        </div>
                    )}
                </div>
                
                <Link to="/crm/imoveis/novo">
                    <Button 
                        type="button"
                        variant="outline"
                        className="flex-shrink-0 p-2 h-auto text-blue-600 border-blue-600 hover:bg-blue-50"
                        disabled={disabled}
                        title="Cadastrar Novo Imóvel"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                </Link>
            </div>
        </div>
    );
};

export default ImovelSelect;
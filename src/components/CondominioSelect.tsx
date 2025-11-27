import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Building2, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import NewCondominioQuickModal from './NewCondominioQuickModal';
import { Button } from './ui/Button';

interface Condominio {
    id: string;
    nome: string;
}

interface CondominioSelectProps {
    label: string;
    id: string;
    value: string; // ID do condomínio selecionado
    onChange: (condominioId: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
}

const CondominioSelect: React.FC<CondominioSelectProps> = ({ label, id, value, onChange, placeholder = "Selecione ou cadastre um condomínio", required = false, disabled = false }) => {
    const { session } = useAuth();
    const [condominios, setCondominios] = useState<Condominio[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchCondominios = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        
        const { data, error } = await supabase
            .from('condominios')
            .select('id, nome')
            .eq('user_id', session.user.id)
            .order('nome', { ascending: true });

        if (error) {
            console.error('Error fetching condominios:', error);
        } else {
            setCondominios(data as Condominio[]);
        }
        setIsLoading(false);
    }, [session]);

    useEffect(() => {
        fetchCondominios();
    }, [fetchCondominios]);
    
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(e.target.value);
    };
    
    const handleSaveSuccess = (condominioId: string, name: string) => {
        // Recarrega a lista e seleciona o novo condomínio
        fetchCondominios().then(() => {
            onChange(condominioId);
        });
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
                        <option value="" disabled>{isLoading ? 'Carregando...' : placeholder}</option>
                        {condominios.map(condominio => (
                            <option key={condominio.id} value={condominio.id}>
                                {condominio.nome}
                            </option>
                        ))}
                    </select>
                    {isLoading && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        </div>
                    )}
                </div>
                
                <Button 
                    type="button"
                    onClick={() => setIsModalOpen(true)}
                    variant="outline"
                    className="flex-shrink-0 p-2 h-auto text-blue-600 border-blue-600 hover:bg-blue-50"
                    disabled={disabled}
                    title="Cadastrar Novo Condomínio"
                >
                    <Plus className="w-4 h-4" />
                </Button>
            </div>
            
            <NewCondominioQuickModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaveSuccess={handleSaveSuccess}
            />
        </div>
    );
};

export default CondominioSelect;
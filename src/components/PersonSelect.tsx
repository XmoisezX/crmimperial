import React, { useState, useEffect, useCallback } from 'react';
import { Plus, User, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import NewPersonModal from './NewPersonModal';
import { Button } from './ui/Button';

interface Person {
    id: string;
    nome: string;
    tipo_cadastro: 'PF' | 'PJ';
    cpf_cnpj: string | null;
}

interface PersonSelectProps {
    label: string;
    id: string;
    value: string; // ID da pessoa selecionada
    onChange: (personId: string) => void;
    placeholder?: string;
    required?: boolean;
    disabled?: boolean;
    showNewButton?: boolean;
}

const PersonSelect: React.FC<PersonSelectProps> = ({ label, id, value, onChange, placeholder = "Selecione ou cadastre uma pessoa", required = false, disabled = false, showNewButton = false }) => {
    const { session } = useAuth();
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchPeople = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        
        const { data, error } = await supabase
            .from('pessoas')
            .select('id, nome, tipo_cadastro, cpf_cnpj')
            .eq('user_id', session.user.id)
            .order('nome', { ascending: true });

        if (error) {
            console.error('Error fetching people:', error);
        } else {
            setPeople(data as Person[]);
        }
        setIsLoading(false);
    }, [session]);

    useEffect(() => {
        fetchPeople();
    }, [fetchPeople]);
    
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(e.target.value);
    };
    
    const handleSaveSuccess = (personId: string, name: string) => {
        // Recarrega a lista e seleciona a nova pessoa
        fetchPeople().then(() => {
            onChange(personId);
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
                        {people.map(person => (
                            <option key={person.id} value={person.id}>
                                {person.nome} ({person.tipo_cadastro})
                            </option>
                        ))}
                    </select>
                    {isLoading && (
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                        </div>
                    )}
                </div>
                
                {showNewButton && (
                    <Button 
                        type="button"
                        onClick={() => setIsModalOpen(true)}
                        variant="outline"
                        className="flex-shrink-0 p-2 h-auto text-blue-600 border-blue-600 hover:bg-blue-50"
                        disabled={disabled}
                        title="Cadastrar Novo Proprietário"
                    >
                        <Plus className="w-4 h-4" />
                    </Button>
                )}
            </div>
            
            <NewPersonModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaveSuccess={handleSaveSuccess}
            />
        </div>
    );
};

export default PersonSelect;
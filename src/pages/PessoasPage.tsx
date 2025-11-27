import React, { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw, User, Loader2, Phone, Mail, FileText } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import NewPersonModal from '../components/NewPersonModal';

interface Person {
    id: string;
    nome: string;
    tipo_cadastro: 'PF' | 'PJ';
    cpf_cnpj: string | null;
    email: string | null;
    telefone: string;
    created_at: string;
}

const PessoasPage: React.FC = () => {
    const { session } = useAuth();
    const [people, setPeople] = useState<Person[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const fetchPeople = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        
        const { data, error } = await supabase
            .from('pessoas')
            .select('id, nome, tipo_cadastro, cpf_cnpj, email, telefone, created_at')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

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
    
    const handleSaveSuccess = () => {
        fetchPeople(); // Recarrega a lista após o sucesso
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-dark-text flex items-center">
                    <User className="w-6 h-6 mr-2 text-blue-600" /> Gestão de Pessoas ({people.length})
                </h1>
                <div className="flex space-x-3">
                    <Button 
                        onClick={() => setIsModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <Plus className="w-4 h-4 mr-2" /> Novo Contato
                    </Button>
                    <Button 
                        variant="outline" 
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={fetchPeople}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
                        Atualizar
                    </Button>
                </div>
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center py-10">
                    <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-3" />
                    <p className="text-gray-600">Carregando contatos...</p>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Documento</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contato</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadastro</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {people.map((person) => (
                                <tr key={person.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">{person.nome}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${person.tipo_cadastro === 'PF' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'}`}>
                                            {person.tipo_cadastro}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text flex items-center">
                                        <FileText className="w-4 h-4 mr-2 text-gray-400" /> {person.cpf_cnpj || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text space-y-1">
                                        <div className="flex items-center"><Phone className="w-4 h-4 mr-2 text-gray-400" /> {person.telefone}</div>
                                        {person.email && <div className="flex items-center"><Mail className="w-4 h-4 mr-2 text-gray-400" /> {person.email}</div>}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">
                                        {new Date(person.created_at).toLocaleDateString('pt-BR')}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50">Editar</Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {people.length === 0 && (
                        <div className="text-center py-10 text-gray-500">
                            <p className="text-lg">Nenhum contato cadastrado.</p>
                        </div>
                    )}
                </div>
            )}
            
            <NewPersonModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSaveSuccess={handleSaveSuccess}
            />
        </div>
    );
};

export default PessoasPage;
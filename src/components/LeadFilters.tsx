import React from 'react';
import { Search, Save, X, Zap, Clock, Users } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import { Label } from './ui/Label';
import { LeadStatus, LeadSource } from '../../types';
import UserSelect from './UserSelect';

export interface LeadFiltersType {
    search: string; // Nome, Telefone, Email
    status: LeadStatus | '';
    origem: LeadSource | '';
    responsavelId: string | '';
    periodoCriacao: string; // Mocked as string for simplicity
}

interface LeadFiltersProps {
    filters: LeadFiltersType;
    onFilterChange: (newFilters: Partial<LeadFiltersType>) => void;
    onApplyFilters: () => void;
    onClearFilters: () => void;
}

const statusOptions: LeadStatus[] = ['Novo', 'Contatado', 'Qualificado', 'Desqualificado'];
const sourceOptions: LeadSource[] = ['Indicação', 'Site', 'Instagram', 'WhatsApp', 'Portal Imobiliário', 'Outro'];

const LeadFilters: React.FC<LeadFiltersProps> = ({ filters, onFilterChange, onApplyFilters, onClearFilters }) => {

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        onFilterChange({ [id]: value } as Partial<LeadFiltersType>);
    };
    
    const handleUserSelectChange = (userId: string) => {
        onFilterChange({ responsavelId: userId });
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-lg font-bold text-dark-text flex items-center">
                    <Zap className="w-5 h-5 mr-2 text-primary-orange" /> Filtros de Leads
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    <Save className="w-4 h-4 mr-1" /> Salvar filtro
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <TextInput 
                    label="Busca Rápida (Nome, Tel, Email)"
                    id="search"
                    value={filters.search}
                    onChange={handleInputChange}
                    placeholder="Ex: João ou (53) 9999"
                    className="md:col-span-4"
                />
                
                <div className="space-y-2">
                    <Label htmlFor="status" className="block text-sm font-medium text-light-text">Status</Label>
                    <select 
                        id="status" 
                        value={filters.status}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                    >
                        <option value="">Todos</option>
                        {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                
                <div className="space-y-2">
                    <Label htmlFor="origem" className="block text-sm font-medium text-light-text">Origem</Label>
                    <select 
                        id="origem" 
                        value={filters.origem}
                        onChange={handleInputChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100"
                    >
                        <option value="">Todas</option>
                        {sourceOptions.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                </div>
                
                <UserSelect 
                    label="Responsável" 
                    id="responsavelId" 
                    value={filters.responsavelId} 
                    onChange={handleUserSelectChange} 
                    placeholder="Todos os corretores"
                />
                
                <TextInput 
                    label="Período de Criação (Mock)"
                    id="periodoCriacao"
                    type="date"
                    value={filters.periodoCriacao}
                    onChange={handleInputChange}
                    placeholder="YYYY-MM-DD"
                />
            </div>

            <div className="flex justify-end space-x-3 pt-3 border-t border-gray-100">
                <Button 
                    onClick={onClearFilters}
                    variant="outline"
                    className="text-gray-700 border-gray-300 hover:bg-gray-100"
                >
                    Limpar
                </Button>
                <Button 
                    onClick={onApplyFilters}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Search className="w-4 h-4 mr-2" /> Filtrar
                </Button>
            </div>
        </div>
    );
};

export default LeadFilters;
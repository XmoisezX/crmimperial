import React from 'react';
import { Search, Save, X, Key } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import { Label } from './ui/Label';

export interface KeyFilters {
    codigo: string;
    imovel: string;
    retiradaPor: string;
    status: 'Atrasada' | 'Disponível' | 'Retirada' | '';
}

interface KeyFiltersProps {
    filters: KeyFilters;
    onFilterChange: (newFilters: Partial<KeyFilters>) => void;
    onApplyFilters: () => void;
    onClearFilters: () => void;
}

const statusOptions = ['Disponível', 'Retirada', 'Atrasada'];

const KeyFilters: React.FC<KeyFiltersProps> = ({ filters, onFilterChange, onApplyFilters, onClearFilters }) => {

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        onFilterChange({ [id]: value } as Partial<KeyFilters>);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
                <h2 className="text-lg font-bold text-dark-text flex items-center">
                    <Key className="w-5 h-5 mr-2 text-blue-600" /> Filtros de Chaves
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    <Save className="w-4 h-4 mr-1" /> Salvar filtro
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <TextInput 
                    label="Código da chave"
                    id="codigo"
                    value={filters.codigo}
                    onChange={handleInputChange}
                    placeholder="Ex: 1A"
                />
                <TextInput 
                    label="Imóvel (Cód/Endereço)"
                    id="imovel"
                    value={filters.imovel}
                    onChange={handleInputChange}
                    placeholder="Ex: 52564 ou Rua X"
                />
                <TextInput 
                    label="Retirada por"
                    id="retiradaPor"
                    value={filters.retiradaPor}
                    onChange={handleInputChange}
                    placeholder="Nome ou documento"
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

export default KeyFilters;
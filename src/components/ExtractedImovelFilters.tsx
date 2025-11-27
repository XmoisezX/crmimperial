import React from 'react';
import { Search, DollarSign, Bed, Car, Building, ChevronDown, MapPin } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import NumberInput from './NumberInput';

// Mock Data baseado nas colunas da tabela imoveis_importados
const CATEGORY_OPTIONS = [
    'Apartamento', 
    'Casa', 
    'Terreno', 
    'Chácara',
    'Cobertura',
    'Depósito',
    'Empreendimento',
    'Galpão',
    'Kitnet',
    'Loft',
    'Loja',
    'Pavilhão',
    'Ponto Comercial',
    'Prédio Comercial',
    'Salas/Conjuntos',
    'Sítio',
    'Sobrado',
    'Terreno Comercial',
    'Terreno Industrial'
];
const NEIGHBORHOOD_OPTIONS = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas', 'Outro'];
const ROOM_OPTIONS = [1, 2, 3, 4, 5];
const FLOOR_OPTIONS = [1, 2, 3, 4, 5]; // Opções de andar (1º, 2º, 3º, 4º, 5º+)

export interface ExtractedFilters {
    minVenda: number | null;
    maxVenda: number | null;
    minAluguel: number | null;
    maxAluguel: number | null;
    minDorms: number | null;
    maxDorms: number | null;
    minSuites: number | null;
    maxSuites: number | null;
    minVagas: number | null;
    maxVagas: number | null;
    bairro: string;
    categoria: string;
    andar: number | null;
    enderecoSearch: string;
    referenciaSearch: string; // NOVO CAMPO
}

interface ExtractedImovelFiltersProps {
    filters: ExtractedFilters;
    onFilterChange: (key: keyof ExtractedFilters, value: string | number | null) => void;
    onApply: () => void;
    onClear: () => void;
}

const ExtractedImovelFilters: React.FC<ExtractedImovelFiltersProps> = ({ filters, onFilterChange, onApply, onClear }) => {
    
    const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        // Para valores de moeda, usamos a lógica de limpeza
        if (id.includes('Venda') || id.includes('Aluguel')) {
            const numericValue = value === '' ? null : parseFloat(value.replace(/[^\d,]/g, '').replace(',', '.'));
            onFilterChange(id as keyof ExtractedFilters, numericValue);
        } else {
            // Para Dorms, Suites, Vagas (inteiros)
            const numericValue = value === '' ? null : parseInt(value);
            onFilterChange(id as keyof ExtractedFilters, numericValue);
        }
    };
    
    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { id, value } = e.target;
        
        if (id === 'andar') {
            const numericValue = value === '' ? null : parseInt(value);
            onFilterChange(id as keyof ExtractedFilters, numericValue);
        } else {
            onFilterChange(id as keyof ExtractedFilters, value);
        }
    };
    
    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        onFilterChange(id as keyof ExtractedFilters, value);
    };

    return (
        <div className="bg-white p-4 rounded-lg shadow-md border border-gray-200 space-y-3">
            <h2 className="text-lg font-semibold text-dark-text flex items-center border-b pb-2">
                <Search className="w-5 h-5 mr-2 text-blue-600" /> Filtro Inteligente
            </h2>

            {/* Linha 1: Busca de Endereço e Referência */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <TextInput 
                    label="Buscar Endereço Específico" 
                    id="enderecoSearch" 
                    value={filters.enderecoSearch} 
                    onChange={handleTextChange} 
                    placeholder="Ex: Rua Suzana Cortez Balreira 391"
                />
                <TextInput 
                    label="Buscar Referência" 
                    id="referenciaSearch" 
                    value={filters.referenciaSearch} 
                    onChange={handleTextChange} 
                    placeholder="Ex: REF12345"
                />
            </div>

            {/* Linha 2: Valores e Categorias (4 colunas em telas grandes) */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 pt-3 border-t border-gray-100">
                
                {/* Valor Venda Mín */}
                <NumberInput label="Venda Mín" id="minVenda" value={filters.minVenda || ''} onChange={handleNumberChange} isCurrency placeholder="0" />
                {/* Valor Venda Máx */}
                <NumberInput label="Venda Máx" id="maxVenda" value={filters.maxVenda || ''} onChange={handleNumberChange} isCurrency placeholder="Máx" />
                
                {/* Valor Aluguel Mín */}
                <NumberInput label="Aluguel Mín" id="minAluguel" value={filters.minAluguel || ''} onChange={handleNumberChange} isCurrency placeholder="0" />
                {/* Valor Aluguel Máx */}
                <NumberInput label="Aluguel Máx" id="maxAluguel" value={filters.maxAluguel || ''} onChange={handleNumberChange} isCurrency placeholder="Máx" />
                
                {/* Categoria */}
                <div className="space-y-1">
                    <label htmlFor="categoria" className="block text-xs font-medium text-light-text">Categoria</label>
                    <select id="categoria" value={filters.categoria} onChange={handleSelectChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100">
                        <option value="">Todas</option>
                        {CATEGORY_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                
                {/* Bairro */}
                <div className="space-y-1">
                    <label htmlFor="bairro" className="block text-xs font-medium text-light-text">Bairro</label>
                    <select id="bairro" value={filters.bairro} onChange={handleSelectChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100">
                        <option value="">Todos</option>
                        {NEIGHBORHOOD_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                
                {/* Andar */}
                <div className="space-y-1">
                    <label htmlFor="andar" className="block text-xs font-medium text-light-text">Andar</label>
                    <select id="andar" value={filters.andar || ''} onChange={handleSelectChange} className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100">
                        <option value="">Todos</option>
                        {FLOOR_OPTIONS.map(f => <option key={f} value={f}>{f}º</option>)}
                    </select>
                </div>
            </div>

            {/* Linha 3: Características (4 colunas em telas grandes) */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3 pt-3 border-t border-gray-100">
                
                {/* Dormitórios Mín */}
                <NumberInput label="Dorms Mín" id="minDorms" value={filters.minDorms || ''} onChange={handleNumberChange} placeholder="0" />
                {/* Dormitórios Máx */}
                <NumberInput label="Dorms Máx" id="maxDorms" value={filters.maxDorms || ''} onChange={handleNumberChange} placeholder="Máx" />
                
                {/* Suítes Mín (Mock) */}
                <NumberInput label="Suítes Mín" id="minSuites" value={filters.minSuites || ''} onChange={handleNumberChange} placeholder="0" />
                {/* Suítes Máx (Mock) */}
                <NumberInput label="Suítes Máx" id="maxSuites" value={filters.maxSuites || ''} onChange={handleNumberChange} placeholder="Máx" />
                
                {/* Vagas Mín (Mock) */}
                <NumberInput label="Vagas Mín" id="minVagas" value={filters.minVagas || ''} onChange={handleNumberChange} placeholder="0" />
                {/* Vagas Máx (Mock) */}
                <NumberInput label="Vagas Máx" id="maxVagas" value={filters.maxVagas || ''} onChange={handleNumberChange} placeholder="Máx" />
                
                {/* Espaço para botões de ação */}
                <div className="col-span-2 flex space-x-2 pt-6">
                    <Button onClick={onClear} variant="outline" className="w-full text-gray-700 border-gray-300 hover:bg-gray-100">
                        Limpar
                    </Button>
                    <Button onClick={onApply} className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                        Aplicar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ExtractedImovelFilters;
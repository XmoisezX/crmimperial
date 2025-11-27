import React from 'react';
import { Search, Save, X } from 'lucide-react';
import TextInput from './TextInput';
import { Checkbox } from './ui/Checkbox';
import { Button } from './ui/Button';
import CollapsibleCard from './CollapsibleCard';
import NumberInput from './NumberInput';

// Mock data for dropdowns and checkboxes
const propertyTypes = ['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural'];
const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas'];
const availabilityOptions = ['Disponível', 'Negociado', 'Reservado', 'Vendido'];
const conditionOptions = ['Em construção', 'Na planta', 'Novo', 'Usado'];
const businessOptions = ['Financiável', 'MCMV', 'Aceita permuta'];
const booleanOptions = ['Indiferente', 'Sim', 'Não'];
const numberOptions = [0, 1, 2, 3, 4, '5 ou +'];

export interface ImovelFilters {
    contract: 'Venda' | 'Locação' | 'Temporada' | '';
    type: string; // Tipo de imóvel (select)
    neighborhood: string; // Bairro (select)
    code: string; // Código (text input)
    bedrooms: number[];
    suites: number[];
    garages: number[];
    // Adicione outros filtros conforme necessário
}

interface FilterSidebarProps {
    filters: ImovelFilters;
    onFilterChange: (newFilters: Partial<ImovelFilters>) => void;
    onApplyFilters: () => void;
    onClearFilters: () => void;
}

const FilterSidebar: React.FC<FilterSidebarProps> = ({ filters, onFilterChange, onApplyFilters, onClearFilters }) => {

    const handleContractChange = (contract: 'Venda' | 'Locação' | 'Temporada') => {
        onFilterChange({ contract: filters.contract === contract ? '' : contract });
    };

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const { id, value } = e.target;
        onFilterChange({ [id]: value });
    };
    
    const handleTextInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value } = e.target;
        onFilterChange({ [id]: value });
    };

    const handleCheckboxGroupChange = (group: 'bedrooms' | 'suites' | 'garages', value: number | string) => {
        const numericValue = Number(value);
        const current = filters[group];
        
        const newArray = current.includes(numericValue)
            ? current.filter((item: number) => item !== numericValue)
            : [...current, numericValue];
            
        onFilterChange({ [group]: newArray });
    };

    return (
        <div className="w-full lg:w-80 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto p-4 space-y-4">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-bold text-dark-text flex items-center">
                    <Search className="w-5 h-5 mr-2" /> Filtros
                </h2>
                <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center">
                    <Save className="w-4 h-4 mr-1" /> Salvar filtro
                </button>
            </div>

            {/* Busca Rápida */}
            <TextInput 
                label=""
                id="mainSearch"
                placeholder="Busque por endereço, código, condomínio"
            />
            <TextInput 
                label="Código"
                id="code"
                value={filters.code}
                onChange={handleTextInputChange}
                placeholder="Informe um código"
            />

            {/* Seção 1: Localização e Contrato */}
            <CollapsibleCard title="Localização e Contrato" isOpenDefault>
                {/* Contrato */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-light-text">Contrato</h3>
                    <div className="flex items-center space-x-4">
                        <label className="flex items-center space-x-2 text-sm">
                            <Checkbox 
                                id="venda" 
                                checked={filters.contract === 'Venda'} 
                                onCheckedChange={() => handleContractChange('Venda')}
                            />
                            <span>Venda</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                            <Checkbox 
                                id="locacao" 
                                checked={filters.contract === 'Locação'} 
                                onCheckedChange={() => handleContractChange('Locação')}
                            />
                            <span>Locação</span>
                        </label>
                        <label className="flex items-center space-x-2 text-sm">
                            <Checkbox 
                                id="temporada" 
                                checked={filters.contract === 'Temporada'} 
                                onCheckedChange={() => handleContractChange('Temporada')}
                            />
                            <span>Temporada</span>
                        </label>
                    </div>
                </div>

                {/* Tipo */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-light-text">Tipo</h3>
                    <select 
                        id="type" 
                        value={filters.type}
                        onChange={handleSelectChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                    >
                        <option value="">Todos os tipos</option>
                        {propertyTypes.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>

                {/* Cidade - UF (Fixo em Pelotas/RS por enquanto) */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-light-text">Cidade - UF</h3>
                    <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text disabled:bg-gray-100" disabled>
                        <option>Pelotas - RS</option>
                    </select>
                </div>

                {/* Bairro */}
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-light-text">Bairro</h3>
                    <select 
                        id="neighborhood" 
                        value={filters.neighborhood}
                        onChange={handleSelectChange}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                    >
                        <option value="">Todos os bairros</option>
                        {neighborhoods.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                
                <TextInput 
                    label="Logradouro e número"
                    id="street"
                    placeholder="Informe o logradouro e número"
                />

                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-light-text">Condomínio</h3>
                    <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                        <option>Digite o condomínio</option>
                    </select>
                </div>
            </CollapsibleCard>

            {/* Seção 2: Valores e Áreas (Mocked for now) */}
            <CollapsibleCard title="Valores e Áreas">
                <h3 className="text-sm font-medium text-light-text">Valores</h3>
                <div className="flex space-x-2 items-center">
                    <TextInput id="minPrice" placeholder="Mínimo" />
                    <span className="text-light-text self-center text-sm">até</span>
                    <TextInput id="maxPrice" placeholder="Máximo" />
                </div>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Área Privativa (m²)</h3>
                <div className="grid grid-cols-2 gap-2">
                    <TextInput id="minAreaPrivativa" placeholder="Mínimo" />
                    <TextInput id="maxAreaPrivativa" placeholder="Máximo" />
                </div>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Área Terreno (m²)</h3>
                <div className="grid grid-cols-2 gap-2">
                    <TextInput id="minAreaTerreno" placeholder="Mínimo" />
                    <TextInput id="maxAreaTerreno" placeholder="Máximo" />
                </div>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Distância para o mar (m)</h3>
                <TextInput id="maxDistanceSea" placeholder="Máximo" />
            </CollapsibleCard>

            {/* Seção 3: Características */}
            <CollapsibleCard title="Características">
                <h3 className="text-sm font-medium text-light-text">Dormitórios</h3>
                <div className="flex flex-wrap gap-3">
                    {numberOptions.map(num => (
                        <label key={`bed-${num}`} className="flex items-center space-x-1 text-sm">
                            <Checkbox 
                                id={`bed-${num}`} 
                                checked={filters.bedrooms.includes(Number(num))} 
                                onCheckedChange={() => handleCheckboxGroupChange('bedrooms', num)}
                            />
                            <span>{num}</span>
                        </label>
                    ))}
                </div>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Suítes</h3>
                <div className="flex flex-wrap gap-3">
                    {numberOptions.map(num => (
                        <label key={`suite-${num}`} className="flex items-center space-x-1 text-sm">
                            <Checkbox 
                                id={`suite-${num}`} 
                                checked={filters.suites.includes(Number(num))} 
                                onCheckedChange={() => handleCheckboxGroupChange('suites', num)}
                            />
                            <span>{num}</span>
                        </label>
                    ))}
                </div>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Vagas de garagem</h3>
                <div className="flex flex-wrap gap-3">
                    {numberOptions.map(num => (
                        <label key={`garage-${num}`} className="flex items-center space-x-1 text-sm">
                            <Checkbox 
                                id={`garage-${num}`} 
                                checked={filters.garages.includes(Number(num))} 
                                onCheckedChange={() => handleCheckboxGroupChange('garages', num)}
                            />
                            <span>{num}</span>
                        </label>
                    ))}
                </div>
                
                <TextInput 
                    label="Comodidades e infraestruturas"
                    id="amenities"
                    placeholder="Elevador, Piscina, etc..."
                />
                
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-light-text">Andar</h3>
                    <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                        <option>Selecione o andar</option>
                    </select>
                </div>
            </CollapsibleCard>

            {/* Seção 4: Status e Condição (Mocked for now) */}
            <CollapsibleCard title="Status e Condição">
                <div className="space-y-2">
                    <h3 className="text-sm font-medium text-light-text">Disponibilidade</h3>
                    <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                        {availabilityOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                </div>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Mobiliado</h3>
                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                    {booleanOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Condição</h3>
                <div className="flex flex-col space-y-2">
                    {conditionOptions.map(opt => (
                        <label key={opt} className="flex items-center space-x-2 text-sm">
                            <Checkbox id={`cond-${opt}`} />
                            <span>{opt}</span>
                        </label>
                    ))}
                </div>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Negócio</h3>
                <div className="flex flex-col space-y-2">
                    {businessOptions.map(opt => (
                        <label key={opt} className="flex items-center space-x-2 text-sm">
                            <Checkbox id={`neg-${opt}`} />
                            <span>{opt}</span>
                        </label>
                    ))}
                </div>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Ocupação</h3>
                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                    {booleanOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
            </CollapsibleCard>

            {/* Seção 5: Marketing e Agenciamento (Mocked for now) */}
            <CollapsibleCard title="Marketing e Agenciamento">
                <h3 className="text-sm font-medium text-light-text">Anunciado</h3>
                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                    {booleanOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Exclusividade</h3>
                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                    {booleanOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Atualização</h3>
                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                    {booleanOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Placa</h3>
                <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                    {booleanOptions.map(opt => <option key={opt}>{opt}</option>)}
                </select>
                
                <h3 className="text-sm font-medium text-light-text mt-4">Mídias</h3>
                <div className="grid grid-cols-2 gap-4">
                    <h4 className="text-sm font-medium text-light-text">Fotos</h4>
                    <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                        {booleanOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                    <h4 className="text-sm font-medium text-light-text">Plantas</h4>
                    <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                        {booleanOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                    <h4 className="text-sm font-medium text-light-text">Vídeos</h4>
                    <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                        {booleanOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                    <h4 className="text-sm font-medium text-light-text">Tours</h4>
                    <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                        {booleanOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                    <h4 className="text-sm font-medium text-light-text">Arquivos</h4>
                    <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                        {booleanOptions.map(opt => <option key={opt}>{opt}</option>)}
                    </select>
                </div>
                
                <div className="space-y-2 mt-4">
                    <h3 className="text-sm font-medium text-light-text">Período de agenciamento</h3>
                    <select className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text">
                        <option>Selecione um período</option>
                    </select>
                </div>
            </CollapsibleCard>

            {/* Seção 6: Pessoas (Mocked for now) */}
            <CollapsibleCard title="Responsáveis">
                <TextInput 
                    label="Responsável"
                    id="responsible"
                    placeholder="Busque pelo responsável"
                />
                <TextInput 
                    label="Agenciador"
                    id="agent"
                    placeholder="Busque pelo agenciador"
                />
                <TextInput 
                    label="Proprietário"
                    id="owner"
                    placeholder="Busque pelo proprietário"
                />
                <TextInput 
                    label="Etiquetas"
                    id="tags"
                    placeholder="Selecione ou pesquise etiquetas"
                />
            </CollapsibleCard>

            {/* Ações de Filtro (Sticky Footer) */}
            <div className="pt-4 border-t border-gray-200 space-y-2 sticky bottom-0 bg-white z-10">
                <Button 
                    onClick={onClearFilters}
                    variant="outline"
                    className="w-full text-primary-orange border-primary-orange hover:bg-orange-50"
                >
                    Limpar
                </Button>
                <Button 
                    onClick={onApplyFilters}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                >
                    Filtrar
                </Button>
            </div>
        </div>
    );
};

export default FilterSidebar;
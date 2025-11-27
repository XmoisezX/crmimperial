import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, DollarSign } from 'lucide-react';
import { HomeIcon, MapPinIcon, BuildingOffice2Icon, CodeBracketIcon, BedIcon, CarIcon } from './icons';
import TextInput from './TextInput';
import { useNavigate } from 'react-router-dom'; // Importando useNavigate

// Mock Data
const propertyTypes = ['Apartamento', 'Casa', 'Terreno', 'Comercial', 'Rural'];
const neighborhoods = ['Centro', 'Laranjal', 'Areal', 'Porto', 'Fragata', 'Três Vendas'];
const roomOptions = [1, 2, 3, 4, '5+'];

interface FilterState {
    operation: 'Aluguel' | 'Vendas';
    city: string;
    type: string;
    neighborhood: string;
    rooms: number | string;
    garages: number | string;
    code: string;
    minPrice: string;
    maxPrice: string;
}

const initialFilters: FilterState = {
    operation: 'Aluguel',
    city: 'Pelotas', // Cidade fixa por enquanto
    type: '',
    neighborhood: '',
    rooms: '',
    garages: '',
    code: '',
    minPrice: '0',
    maxPrice: '300000',
};

const FloatingSearchForm: React.FC = () => {
    const [filters, setFilters] = useState<FilterState>(initialFilters);
    const navigate = useNavigate();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Constrói os parâmetros de busca
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== '' && value !== '0') {
                params.append(key, String(value));
            }
        });
        
        // Redireciona para a página de imóveis com os filtros
        navigate(`/imoveis?${params.toString()}`);
    };
    
    const renderSelect = (name: keyof FilterState, label: string, options: (string | number)[], placeholder: string) => (
        <div className="relative">
            <label htmlFor={name} className="sr-only">{label}</label>
            <select
                id={name}
                name={name}
                value={filters[name]}
                onChange={handleInputChange}
                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm text-dark-text focus:ring-primary-orange focus:border-primary-orange appearance-none cursor-pointer shadow-sm"
            >
                <option value="" disabled>{placeholder}</option>
                {options.map((opt, index) => (
                    <option key={index} value={opt}>{opt}</option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <ChevronDown className="h-4 w-4 text-gray-400" />
            </div>
        </div>
    );
    
    const renderPriceInput = (name: keyof FilterState, placeholder: string) => (
        <div className="relative">
            <input
                type="text"
                name={name}
                value={filters[name]}
                onChange={handleInputChange}
                placeholder={placeholder}
                className="w-full p-3 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-primary-orange focus:border-primary-orange"
            />
        </div>
    );

    return (
        <form onSubmit={handleSearch} className="w-full max-w-md bg-white p-8 rounded-xl shadow-2xl">
            
            <h1 className="text-2xl font-bold text-blue-800">A imobiliária que mais cresce em Pelotas</h1>
            <h2 className="text-3xl font-bold text-blue-800 mb-2">Encontre seu imóvel</h2>
            <p className="text-lg text-light-text mb-6">São mais de 1500 opções disponíveis.</p>

            {/* Abas de Operação */}
            <div className="flex border-b border-gray-200 mb-6">
                <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, operation: 'Aluguel' }))}
                    className={`py-2 px-4 text-sm font-semibold transition-colors ${
                        filters.operation === 'Aluguel' 
                            ? 'border-b-2 border-primary-orange text-primary-orange' 
                            : 'text-gray-500 hover:text-dark-text'
                    }`}
                >
                    ALUGUEL
                </button>
                <button
                    type="button"
                    onClick={() => setFilters(prev => ({ ...prev, operation: 'Vendas' }))}
                    className={`py-2 px-4 text-sm font-semibold transition-colors ${
                        filters.operation === 'Vendas' 
                            ? 'border-b-2 border-primary-orange text-primary-orange' 
                            : 'text-gray-500 hover:text-dark-text'
                    }`}
                >
                    VENDAS
                </button>
            </div>

            {/* Campos de Filtro */}
            <div className="grid grid-cols-2 gap-4">
                {/* Coluna 1 */}
                <div className="space-y-4">
                    {/* Cidade (Fixo) */}
                    <div className="relative">
                        <select
                            id="city"
                            name="city"
                            value={filters.city}
                            onChange={handleInputChange}
                            disabled
                            className="w-full p-3 border border-gray-300 rounded-lg bg-gray-100 text-sm text-dark-text appearance-none cursor-not-allowed shadow-sm"
                        >
                            <option value="Pelotas">Pelotas</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                        </div>
                    </div>
                    
                    {renderSelect('neighborhood', 'Bairro', neighborhoods, 'Bairro')}
                    
                    {renderSelect('rooms', 'Quartos', roomOptions, 'Quartos')}
                    
                    {/* Range de Preço (De) */}
                    <div className="space-y-1 pt-2">
                        <label className="block text-xs font-medium text-light-text">De</label>
                        {renderPriceInput('minPrice', 'R$ 0,00')}
                    </div>
                </div>
                
                {/* Coluna 2 */}
                <div className="space-y-4">
                    {renderSelect('type', 'Tipo', propertyTypes, 'Tipo')}
                    
                    <TextInput 
                        label="Cod. Imóvel" 
                        id="code" 
                        name="code"
                        value={filters.code} 
                        onChange={handleInputChange} 
                        placeholder="Cod. Imóvel"
                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm text-sm focus:ring-primary-orange focus:border-primary-orange disabled:bg-gray-100"
                    />
                    
                    {renderSelect('garages', 'Vagas', roomOptions, 'Vagas')}
                    
                    {/* Range de Preço (Até) */}
                    <div className="space-y-1 pt-2">
                        <label className="block text-xs font-medium text-light-text">Até</label>
                        {renderPriceInput('maxPrice', 'R$ 30.000,00')}
                    </div>
                </div>
            </div>
            
            {/* Botão de Busca */}
            <button
                type="submit"
                className="w-full mt-6 bg-[#ffc107] hover:bg-[#ffb300] text-dark-text font-bold px-6 py-3 rounded-lg shadow-md transition-colors"
            >
                BUSCAR
            </button>
        </form>
    );
};

export default FloatingSearchForm;
import React, { useState, useEffect, useCallback } from 'react';
import { SimulationInput, SimulationResult, MonthlyResult } from '../../types';
import { useFinancialSimulator } from '../../hooks/useFinancialSimulator';
import { initialSimulationInputs } from '../../constants';
import Sidebar from '../components/Sidebar';
import Dashboard from '../components/Dashboard';

// Define a estrutura para armazenar os dados reais inseridos pelo usuário
type ActualDataMap = Record<number, Partial<MonthlyResult>>;

const HomePage: React.FC = () => {
    const [inputs, setInputs] = useState<SimulationInput>(initialSimulationInputs);
    const [results, setResults] = useState<SimulationResult | null>(null);
    const [duration, setDuration] = useState(12);
    const [actualData, setActualData] = useState<ActualDataMap>({}); // NOVO ESTADO
    const calculateSimulation = useFinancialSimulator();

    useEffect(() => {
        // Passa actualData para o simulador
        const simulationData = calculateSimulation(inputs, duration, actualData);
        setResults(simulationData);
    }, [inputs, calculateSimulation, duration, actualData]);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type } = e.target;
        
        // Trata input de data separadamente
        if (type === 'date') {
             setInputs(prevInputs => ({
                ...prevInputs,
                [id]: value
            }));
            return;
        }
        
        setInputs(prevInputs => ({
            ...prevInputs,
            [id]: value === '' ? 0 : parseFloat(value)
        }));
    }, []);

    const handleLoadSimulation = useCallback((loadedInputs: SimulationInput) => {
        setInputs(loadedInputs);
        setDuration(12);
        setActualData({}); // Limpa dados reais ao carregar nova simulação
    }, []);

    // NOVO HANDLER: Atualiza dados reais para um mês específico
    const handleActualDataChange = useCallback((month: number, field: keyof MonthlyResult, value: number | null) => {
        setActualData(prev => {
            const newMonthData = {
                ...prev[month],
                [field]: value,
            };
            
            // Remove o mês do estado se todos os campos estiverem vazios/nulos
            if (Object.values(newMonthData).every(v => v === null || v === undefined)) {
                const { [month]: _, ...rest } = prev;
                return rest;
            }

            return {
                ...prev,
                [month]: newMonthData,
            };
        });
    }, []);

    const handleExtendSimulation = useCallback(() => {
        setDuration(prevDuration => prevDuration + 12);
    }, []);

    const handleGoBackSimulation = useCallback(() => {
        setDuration(prevDuration => (prevDuration > 12 ? prevDuration - 12 : 12));
    }, []);
    
    return (
        <div className="flex flex-1 flex-col lg:flex-row min-h-full bg-gray-50">
            <Sidebar inputs={inputs} onInputChange={handleInputChange} onLoadSimulation={handleLoadSimulation} />
            <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                {results ? (
                    <Dashboard 
                        results={results} 
                        inputs={inputs} 
                        onExtend={handleExtendSimulation}
                        onGoBack={handleGoBackSimulation}
                        duration={duration}
                        onActualDataChange={handleActualDataChange} // NOVO PROP
                        actualData={actualData} // NOVO PROP
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        <p className="text-xl text-gray-500">Gerando simulação...</p>
                    </div>
                )}
            </main>
        </div>
    );
};

export default HomePage;
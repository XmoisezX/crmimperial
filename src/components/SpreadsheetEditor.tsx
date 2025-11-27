import React, { useState, useCallback } from 'react';
import { Save, Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

interface SpreadsheetEditorProps {
    data: string[][];
    headers: string[];
    title: string;
    onDataChange: (newData: string[][]) => void;
}

const SpreadsheetEditor: React.FC<SpreadsheetEditorProps> = ({ data, headers, title, onDataChange }) => {
    const [isSaving, setIsSaving] = useState(false);

    const handleCellChange = useCallback((rowIndex: number, colIndex: number, value: string) => {
        const newData = [...data];
        if (!newData[rowIndex]) {
            newData[rowIndex] = Array(headers.length).fill('');
        }
        newData[rowIndex][colIndex] = value;
        onDataChange(newData);
    }, [data, headers.length, onDataChange]);

    const handleAddRow = useCallback(() => {
        const newRow = Array(headers.length).fill('');
        onDataChange([...data, newRow]);
    }, [data, headers.length, onDataChange]);

    const handleDeleteRow = useCallback((rowIndex: number) => {
        const newData = data.filter((_, index) => index !== rowIndex);
        onDataChange(newData);
    }, [data, onDataChange]);

    const handleSave = () => {
        setIsSaving(true);
        // Simulate API call or data export
        console.log('Saving data:', data);
        setTimeout(() => {
            setIsSaving(false);
            alert('Dados salvos com sucesso! (Simulação)');
        }, 1000);
    };
    
    // Garante que sempre haja pelo menos uma linha vazia se os dados estiverem vazios
    const displayData = data.length > 0 ? data : [Array(headers.length).fill('')];

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200 space-y-4">
            <h2 className="text-2xl font-bold text-dark-text">{title}</h2>
            
            <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                    <Button onClick={handleAddRow} size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Adicionar Linha
                    </Button>
                    <Button onClick={handleSave} disabled={isSaving} size="sm" className="bg-primary-orange hover:bg-secondary-orange text-white">
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar Dados
                    </Button>
                </div>
                <p className="text-sm text-light-text">Total de linhas: {data.length}</p>
            </div>

            <div className="overflow-x-auto max-h-[60vh] border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50 sticky top-0 z-10">
                        <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-10">#</th>
                            {headers.map((header, index) => (
                                <th key={index} className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap min-w-[150px]">
                                    {header}
                                </th>
                            ))}
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {displayData.map((row, rowIndex) => (
                            <tr key={rowIndex} className="hover:bg-gray-50">
                                <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-500">{rowIndex + 1}</td>
                                {headers.map((_, colIndex) => (
                                    <td key={colIndex} className="p-0">
                                        <input
                                            type="text"
                                            value={row[colIndex] || ''}
                                            onChange={(e) => handleCellChange(rowIndex, colIndex, e.target.value)}
                                            className="w-full p-2 text-sm border-none focus:ring-primary-orange focus:border-primary-orange"
                                        />
                                    </td>
                                ))}
                                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                                    <button 
                                        onClick={() => handleDeleteRow(rowIndex)}
                                        className="text-red-500 hover:text-red-700 p-1 rounded"
                                        title="Excluir linha"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {data.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>Nenhum dado na planilha. Adicione uma nova linha.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SpreadsheetEditor;
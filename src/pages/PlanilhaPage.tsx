import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Briefcase, Loader2, Save, Trash2, ArrowLeft } from 'lucide-react';
import SpreadsheetEditor from '../components/SpreadsheetEditor';
import { Button } from '../components/ui/Button';
import TextInput from '../components/TextInput';
import { useAgenciamentoData, Planilha } from '../hooks/useAgenciamentoData';
import { DEFAULT_AGENCIAMENTO_HEADERS } from '../constants/agenciamento';

const PlanilhaPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { planilhas, isLoading: isPlanilhasLoading, savePlanilha, deletePlanilha } = useAgenciamentoData();
    
    const [planilha, setPlanilha] = useState<Planilha | null>(null);
    const [data, setData] = useState<string[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [planilhaName, setPlanilhaName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);

    // Efeito para carregar a planilha com base no ID
    useEffect(() => {
        if (isPlanilhasLoading || !id) return;

        const foundPlanilha = planilhas.find(p => p.id === id);
        
        if (foundPlanilha) {
            setPlanilha(foundPlanilha);
            setPlanilhaName(foundPlanilha.nome);
            setHeaders(foundPlanilha.headers);
            setData(foundPlanilha.data);
            setLoadError(null);
        } else {
            setLoadError('Planilha não encontrada.');
        }
    }, [id, isPlanilhasLoading, planilhas]);

    const handleDataChange = useCallback((newData: string[][]) => {
        setData(newData);
    }, []);

    const handleSave = useCallback(async () => {
        if (!planilha || !planilhaName.trim()) return;

        setIsSaving(true);
        
        const { success } = await savePlanilha(planilhaName, headers, data, planilha.id);
        
        setIsSaving(false);
        
        if (success) {
            alert(`Planilha "${planilhaName}" salva com sucesso!`);
        } else {
            alert('Falha ao salvar a planilha.');
        }
    }, [planilha, planilhaName, headers, data, savePlanilha]);
    
    const handleDelete = useCallback(async () => {
        if (!planilha) return;
        
        if (window.confirm(`Tem certeza que deseja excluir a planilha "${planilha.nome}"?`)) {
            setIsDeleting(true);
            const success = await deletePlanilha(planilha.id);
            setIsDeleting(false);
            
            if (success) {
                alert('Planilha excluída.');
                navigate('/crm/agenciamento/planilhas'); // Updated navigation
            } else {
                alert('Falha ao excluir a planilha.');
            }
        }
    }, [planilha, deletePlanilha, navigate]);

    if (isPlanilhasLoading || !planilha) {
        return (
            <div className="p-8 flex items-center justify-center min-h-[500px]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mr-3" />
                <p className="text-gray-600">Carregando planilha...</p>
            </div>
        );
    }
    
    if (loadError) {
        return (
            <div className="p-8 text-center">
                <h1 className="text-2xl font-bold text-red-600">{loadError}</h1>
                <Link to="/crm/agenciamento/planilhas" className="text-blue-600 hover:underline mt-4 block">Voltar para o Índice</Link>
            </div>
        );
    }
    
    // Se o ID for válido e a planilha carregada
    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-dark-text flex items-center">
                    <Briefcase className="w-6 h-6 mr-2 text-blue-600" /> 
                    <Link to="/crm/agenciamento/planilhas" className="text-gray-500 hover:text-blue-600 transition-colors flex items-center">
                        <ArrowLeft className="w-5 h-5 mr-2" /> Planilhas
                    </Link>
                    <span className="mx-2 text-gray-400">&gt;</span> 
                    {planilhaName}
                </h1>
                <div className="flex space-x-3">
                    <Button 
                        onClick={handleDelete}
                        disabled={isDeleting || isSaving}
                        variant="outline"
                        className="text-red-600 border-red-600 hover:bg-red-50"
                    >
                        {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                        Excluir
                    </Button>
                    <Button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white"
                    >
                        {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                        Salvar
                    </Button>
                </div>
            </div>
            
            <div className="mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200 space-y-4">
                <TextInput 
                    label="Nome da Planilha"
                    id="planilhaName"
                    value={planilhaName}
                    onChange={(e) => setPlanilhaName(e.target.value)}
                    placeholder="Ex: Imóveis Extraídos 2024"
                />
            </div>

            <SpreadsheetEditor 
                title={`Editor: ${planilhaName}`}
                headers={headers}
                data={data}
                onDataChange={handleDataChange}
            />
        </div>
    );
};

export default PlanilhaPage;
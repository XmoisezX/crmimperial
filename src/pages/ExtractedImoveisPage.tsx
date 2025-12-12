import React, { useEffect, useState, useCallback } from "react";
import { Loader2, Search, Download, ChevronLeft, ChevronRight, Save, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { supabase } from '../integrations/supabase/client';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Checkbox } from '../components/ui/Checkbox';
import { Card, CardContent } from '../components/ui/Card';
import ExtractedImovelFilters, { ExtractedFilters } from '../components/ExtractedImovelFilters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrencyHalfTone, parseCurrencyToNumber } from '../utils/format';

// Define a interface para os dados da linha, baseada na tabela imoveis_importados
interface ExtractedImovel {
    id: number; // Internal Supabase row ID (SERIAL PRIMARY KEY)
    "Responsáveis": 'Vazio' | 'Alessandro Gomes' | 'Tamires Torres' | 'Moisez Torres' | 'Elias Torres' | string | null; // NOVO: ENUM
    Feedback: string | null; // NOVO: Coluna de feedback
    Referencia: string | null;
    Categoria: string | null;
    Endereco: string | null;
    Bairro: string | null;
    AreaTotal: string | null; // text
    AreaPrivada: number | null; // double precision
    Dorms: number | null; // bigint
    Suites: string | null; // text
    Vagas: string | null; // text
    Venda: string | null; // text
    Aluguel: string | null; // text
    NomeProprietario: string | null;
    Fones: string | null;
    Email: string | null;
    Exclusivo: string | null;
    ID: number | null; // Imported ID (bigint)
    [key: string]: any; // Permite acesso dinâmico às colunas
}

// Tipo para rastrear alterações pendentes: { [rowId]: { [columnName]: newValue } }
type PendingChanges = Record<number, Partial<ExtractedImovel>>;

const initialFilters: ExtractedFilters = {
    minVenda: null,
    maxVenda: null,
    minAluguel: null,
    maxAluguel: null,
    minDorms: null,
    maxDorms: null,
    minSuites: null,
    maxSuites: null,
    minVagas: null,
    maxVagas: null,
    bairro: '',
    categoria: '',
    andar: null,
    enderecoSearch: '',
    referenciaSearch: '',
    responsavel: '', // NOVO FILTRO
};

// Função auxiliar para formatar texto para moeda (R$ 999.999,99)
const formatTextToCurrency = (text: string | null | undefined): string => {
    if (!text) return '';

    // 1. Limpa o texto, removendo R$, pontos e substituindo vírgula por ponto para parse
    const cleanText = text.replace(/[^\d,]/g, '').replace(',', '.');
    const num = parseFloat(cleanText);

    if (isNaN(num)) return text; // Se não for um número, retorna o texto original

    // 2. Formata o número para o padrão brasileiro
    return num.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

// Componente de Célula Editável de Moeda
interface CurrencyEditableCellProps {
    rowId: number;
    column: string;
    initialValue: string | null;
    onSave: (id: number, field: string, value: string) => void;
    disabled: boolean;
}

const CurrencyEditableCell: React.FC<CurrencyEditableCellProps> = React.memo(({ rowId, column, initialValue, onSave, disabled }) => {
    // Estado local para gerenciar a exibição formatada
    const [displayValue, setDisplayValue] = useState(() => formatTextToCurrency(initialValue));
    const [isFocused, setIsFocused] = useState(false);

    // Atualiza o estado local quando o valor inicial muda (ex: paginação ou recarga)
    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(formatTextToCurrency(initialValue));
        }
    }, [initialValue, isFocused]);

    // Debounce para salvar alterações
    useEffect(() => {
        if (!isFocused) return;

        const timer = setTimeout(() => {
            const currentRawValue = formatTextToCurrency(initialValue);
            // Só salva se o valor exibido (que reflete o input do usuário) for diferente do valor salvo formatado
            // Nota: displayValue pode estar "sujo" (ex: "1000"), então comparamos com cuidado ou confiamos no onSave para tratar
            // Melhor abordagem: Tentar salvar o valor atual do displayValue
            // Mas displayValue pode não estar formatado se estiver focado.
            // O onSave trata a formatação? O CurrencyEditableCell original formatava no onBlur.
            // Aqui, vamos salvar o valor como está no displayValue, e o onSave do pai (handleSaveCell) trata o parse.

            // Verificação simples: se o valor mudou em relação ao inicial
            if (displayValue !== formatTextToCurrency(initialValue) && displayValue !== initialValue) {
                // Precisamos garantir que estamos passando o valor formatado ou bruto corretamente
                // O handleSaveCell espera o valor "raw" do input ou formatado?
                // Ele faz: updatedValue = rawValue.trim() === '' ? null : parseFloat(rawValue);
                // Se passarmos "1000", ele salva 1000. Se passarmos "R$ 1.000,00", ele precisa limpar.
                // A função formatTextToCurrency retorna string formatada.
                // Vamos passar o displayValue atual.
                onSave(rowId, column, displayValue);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [displayValue, isFocused, initialValue, rowId, column, onSave]);


    const handleFocus = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(true);
        // Ao focar, remove a formatação de moeda para facilitar a edição
        const cleanValue = initialValue?.replace(/[^\d,]/g, '').replace('.', ',') || '';
        setDisplayValue(cleanValue);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
        setIsFocused(false);
        const rawInput = e.target.value;

        // 1. Formata o valor de volta para exibição
        const formattedValue = formatTextToCurrency(rawInput);
        setDisplayValue(formattedValue);

        // O salvamento agora é tratado pelo debounce, mas garantimos no blur também para evitar perda de dados rápida
        if (formattedValue !== formatTextToCurrency(initialValue)) {
            onSave(rowId, column, formattedValue);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        // Permite apenas dígitos, vírgula e ponto durante a edição
        const rawInput = e.target.value;
        // Lógica simples para permitir a edição de números e vírgulas
        setDisplayValue(rawInput);
    };

    return (
        <td
            className="border border-gray-300 p-0 relative"
            style={{ height: '60px' }}
        >
            <textarea
                className={`w-full h-full text-xs border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent resize-none p-2 overflow-y-auto text-gray-700 text-right ${isFocused ? 'bg-yellow-50' : ''}`}
                value={displayValue}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onChange={handleChange}
                disabled={disabled}
            />
        </td>
    );
});

// Componente de Textarea com Debounce para salvamento automático
interface DebouncedTextareaProps {
    rowId: number;
    column: string;
    initialValue: string | null;
    onSave: (id: number, field: string, value: string) => void;
    disabled: boolean;
}

const DebouncedTextarea: React.FC<DebouncedTextareaProps> = React.memo(({ rowId, column, initialValue, onSave, disabled }) => {
    const [localValue, setLocalValue] = useState(initialValue || '');
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (!isFocused) {
            setLocalValue(initialValue || '');
        }
    }, [initialValue, isFocused]);

    useEffect(() => {
        if (!isFocused) return;

        const timer = setTimeout(() => {
            if (localValue !== (initialValue || '')) {
                onSave(rowId, column, localValue);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [localValue, isFocused, initialValue, rowId, column, onSave]);

    return (
        <td className="border border-gray-300 p-0 relative" style={{ height: '60px' }}>
            <textarea
                className={`w-full h-full text-xs border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent resize-none p-2 overflow-y-auto text-gray-700 ${isFocused ? 'bg-yellow-50' : ''}`}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                disabled={disabled}
            />
        </td>
    );
});


const ExtractedImoveisPage: React.FC = () => {
    const [data, setData] = useState<ExtractedImovel[]>([]); // Dados brutos da página
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState(""); // Busca rápida agora é aplicada no servidor
    const [page, setPage] = useState(1);
    const [totalRows, setTotalRows] = useState(0);
    const [limit, setLimit] = useState(20);
    const [fetchError, setFetchError] = useState<string | null>(null); // NOVO ESTADO DE ERRO
    const [isExporting, setIsExporting] = useState(false); // NOVO ESTADO DE EXPORTAÇÃO
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set()); // Estado para linhas selecionadas

    // --- Estado de Ordenação ---
    const [sortColumn, setSortColumn] = useState<string>('id');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

    // Estado dos filtros
    const [filters, setFilters] = useState<ExtractedFilters>(initialFilters);
    const [appliedFilters, setAppliedFilters] = useState<ExtractedFilters>(initialFilters);

    const columns = [
        "Responsáveis",
        "Feedback",
        "Referencia",
        "Categoria",
        "Endereco",
        "Bairro",
        "AreaTotal",
        "AreaPrivada",
        "Dorms",
        "Suites",
        "Vagas",
        "Venda",
        "Aluguel",
        "NomeProprietario",
        "Fones",
        "Email",
        "Exclusivo",
        "ID",
    ];

    // Opções para o ENUM Responsáveis
    const responsavelOptions = ['Vazio', 'Alessandro Gomes', 'Tamires Torres', 'Moisez Torres', 'Elias Torres'];

    // Larguras mínimas ajustadas
    const columnWidths: Record<string, string> = {
        "Responsáveis": "120px",
        "Feedback": "180px",
        "Endereco": "180px",
        "NomeProprietario": "150px",
        "Referencia": "120px",
        "Categoria": "120px",
        "Bairro": "120px",
        "AreaTotal": "80px",
        "AreaPrivada": "80px",
        "Venda": "120px",
        "Aluguel": "120px",
        "Fones": "120px",
        "Email": "150px",
    };

    // Fields that are numeric in the database schema
    const numericFields = ["AreaPrivada", "Dorms", "ID"];

    // 🔹 Lógica de Busca de Dados (Aplicando filtros no servidor via RPC)
    const fetchData = useCallback(async (pageNumber = 1, currentFilters: ExtractedFilters, currentSearch: string, sortCol: string, sortDir: 'asc' | 'desc') => {
        setLoading(true);
        setFetchError(null); // Limpa erros anteriores

        const offset = (pageNumber - 1) * limit;

        try {
            // Chamada da função RPC para filtrar, paginar e ordenar no servidor
            const { data: fetchedData, error } = await supabase.rpc('filter_imoveis_importados', {
                p_search: currentSearch.trim() || null,
                p_min_venda: currentFilters.minVenda,
                p_max_venda: currentFilters.maxVenda,
                p_min_aluguel: currentFilters.minAluguel,
                p_max_aluguel: currentFilters.maxAluguel,
                p_min_dorms: currentFilters.minDorms,
                p_max_dorms: currentFilters.maxDorms,
                p_categoria: currentFilters.categoria || null,
                p_bairro: currentFilters.bairro || null,
                p_limit: limit,
                p_offset: offset,
                p_andar: currentFilters.andar,
                p_endereco_search: currentFilters.enderecoSearch.trim() || null,
                p_sort_column: sortCol, // Novo parâmetro
                p_sort_direction: sortDir, // Novo parâmetro
                p_referencia_search: currentFilters.referenciaSearch.trim() || null, // NOVO PARÂMETRO
                p_responsavel: currentFilters.responsavel || null, // NOVO PARÂMETRO
            });

            if (error) {
                console.error("Erro ao carregar dados via RPC:", error);
                setFetchError(`Falha ao carregar dados: ${error.message}. Verifique as permissões (RLS) ou a sintaxe da função SQL.`);
                setTotalRows(0);
                setData([]);
            } else if (fetchedData && fetchedData.length > 0) {
                const totalCount = fetchedData[0].total_count;
                setTotalRows(Number(totalCount));
                setData(fetchedData as ExtractedImovel[]);
            } else {
                setTotalRows(0);
                setData([]);
            }
        } catch (e) {
            console.error("Erro de rede/execução:", e);
            setFetchError("Erro de rede ou execução ao chamar a função do banco de dados.");
            setTotalRows(0);
            setData([]);
        } finally {
            setLoading(false);
        }
    }, [limit]);

    // 🔹 Nova função para buscar TODOS os dados filtrados (para exportação)
    const fetchAllFilteredData = useCallback(async (currentFilters: ExtractedFilters, currentSearch: string, sortCol: string, sortDir: 'asc' | 'desc'): Promise<ExtractedImovel[]> => {

        // Se não houver linhas totais, não há o que buscar
        if (totalRows === 0) return [];

        try {
            const { data: fetchedData, error } = await supabase.rpc('filter_imoveis_importados', {
                p_search: currentSearch.trim() || null,
                p_min_venda: currentFilters.minVenda,
                p_max_venda: currentFilters.maxVenda,
                p_min_aluguel: currentFilters.minAluguel,
                p_max_aluguel: currentFilters.maxAluguel,
                p_min_dorms: currentFilters.minDorms,
                p_max_dorms: currentFilters.maxDorms,
                p_categoria: currentFilters.categoria || null,
                p_bairro: currentFilters.bairro || null,
                p_limit: totalRows, // Busca todos os registros
                p_offset: 0,
                p_andar: currentFilters.andar,
                p_endereco_search: currentFilters.enderecoSearch.trim() || null,
                p_sort_column: sortCol,
                p_sort_direction: sortDir,
                p_referencia_search: currentFilters.referenciaSearch.trim() || null,
                p_responsavel: currentFilters.responsavel || null, // NOVO PARÂMETRO
            });

            if (error) {
                console.error("Erro ao buscar todos os dados para exportação:", error);
                throw new Error(error.message);
            }

            return fetchedData as ExtractedImovel[];
        } catch (e) {
            console.error("Erro de exportação:", e);
            alert(`Falha ao buscar todos os dados para exportação: ${e instanceof Error ? e.message : 'Erro desconhecido'}`);
            return [];
        }
    }, [totalRows]);


    // Efeito para buscar dados quando a página, limite, filtros aplicados, busca rápida ou ordenação mudam
    useEffect(() => {
        fetchData(page, appliedFilters, search, sortColumn, sortDirection);
    }, [page, limit, appliedFilters, search, sortColumn, sortDirection, fetchData]);

    // 🔹 Handlers do componente de filtro
    const handleFilterChange = useCallback((key: keyof ExtractedFilters, value: string | number | null) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    }, []);

    const handleApplyFilters = useCallback(() => {
        setAppliedFilters(filters);
        setPage(1); // Volta para a primeira página ao aplicar novos filtros
    }, [filters]);

    const handleClearFilters = useCallback(() => {
        setFilters(initialFilters);
        setAppliedFilters(initialFilters);
        setPage(1);
        setSearch('');
    }, []);

    // 🔹 Lógica de Ordenação
    const handleSort = (column: string) => {
        if (sortColumn === column) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
        } else {
            setSortColumn(column);
            setSortDirection('asc');
        }
        setPage(1); // Volta para a primeira página ao mudar a ordenação
    };

    // 🔹 Handlers de Seleção
    const handleSelectRow = (id: number) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        const allIdsOnPage = data.map(row => row.id);
        const allSelected = allIdsOnPage.every(id => selectedIds.has(id));

        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (allSelected) {
                allIdsOnPage.forEach(id => newSet.delete(id));
            } else {
                allIdsOnPage.forEach(id => newSet.add(id));
            }
            return newSet;
        });
    };


    // 🔹 Salva célula individualmente ao perder o foco
    const handleSaveCell = async (id: number, field: string, rawValue: string) => {
        console.log('🔍 handleSaveCell chamado:', { id, field, rawValue }); // DEBUG

        let updatedValue: any = rawValue;

        if (numericFields.includes(field)) {
            // Lógica para campos numéricos
            updatedValue = rawValue.trim() === '' ? null : parseFloat(rawValue);
            if (isNaN(updatedValue as number)) updatedValue = rawValue;
        } else {
            // Lógica para campos de texto/ENUM
            updatedValue = rawValue.trim() === '' ? null : rawValue;
        }

        console.log('💾 Valor a ser salvo:', { field, updatedValue }); // DEBUG

        // 1. Atualiza o estado 'data' imediatamente para refletir a mudança na UI
        setData(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: updatedValue } : item
        ));

        // 2. Salva no banco de dados
        setSaving(true);

        // Mapeamento de nomes de colunas (frontend -> database)
        // Se o nome da coluna no DB for diferente do frontend, adicione aqui
        const columnMapping: Record<string, string> = {
            'Responsáveis': 'Responsáveis',
            'Feedback': 'Feedback', // ⚠️ No DB é "Feedback" com F maiúsculo
            'Referencia': 'Referencia',
            'Categoria': 'Categoria',
            'Endereco': 'Endereco',
            'Bairro': 'Bairro',
            'AreaTotal': 'AreaTotal',
            'AreaPrivada': 'AreaPrivada',
            'Dorms': 'Dorms',
            'Suites': 'Suites',
            'Vagas': 'Vagas',
            'Venda': 'Venda',
            'Aluguel': 'Aluguel',
            'NomeProprietario': 'NomeProprietario',
            'Fones': 'Fones',
            'Email': 'Email',
            'Exclusivo': 'Exclusivo',
            'ID': 'ID',
        };

        const dbColumnName = columnMapping[field] || field;
        const dataToUpdate: Record<string, any> = { [dbColumnName]: updatedValue };

        console.log('📤 Enviando para Supabase:', { id, field, dbColumnName, dataToUpdate }); // DEBUG

        const { error } = await supabase
            .from("imoveis_importados")
            .update(dataToUpdate)
            .eq("id", id);

        setSaving(false);

        if (error) {
            console.error("❌ Erro ao salvar célula:", error);
            alert(`Falha ao salvar a alteração: ${error.message}`);
            // Opcional: Recarregar dados para reverter a célula em caso de erro
            fetchData(page, appliedFilters, search, sortColumn, sortDirection);
        } else {
            console.log('✅ Salvo com sucesso!'); // DEBUG
        }
    };

    // 🔹 Exportar CSV (TODOS os dados filtrados ou SELECIONADOS)
    const exportCSV = useCallback(async () => {
        if (totalRows === 0) {
            alert("Nenhum dado para exportar.");
            return;
        }
        setIsExporting(true);

        let dataToExport: ExtractedImovel[] = [];

        if (selectedIds.size > 0) {
            // Exportar apenas selecionados
            const { data: selectedData, error } = await supabase
                .from('imoveis_importados')
                .select('*')
                .in('id', Array.from(selectedIds));

            if (error) {
                console.error("Erro ao buscar dados selecionados:", error);
                alert("Erro ao exportar dados selecionados.");
                setIsExporting(false);
                return;
            }
            dataToExport = selectedData as ExtractedImovel[];
        } else {
            // Exportar todos filtrados (comportamento original)
            dataToExport = await fetchAllFilteredData(appliedFilters, search, sortColumn, sortDirection);
        }

        if (dataToExport.length === 0) {
            setIsExporting(false);
            return;
        }

        const header = columns.join(",");
        const rows = dataToExport
            .map((r) => columns.map((c) => {
                return `"${r[c] ?? ""}"`;
            }).join(","))
            .join("\n");

        const csv = `${header}\n${rows}`;
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `imoveis_importados_${selectedIds.size > 0 ? 'selecionados' : 'filtrados'}_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();

        setIsExporting(false);
    }, [appliedFilters, search, sortColumn, sortDirection, totalRows, fetchAllFilteredData, columns, selectedIds]);

    // 🔹 Exportar PDF (TODOS os dados filtrados ou SELECIONADOS)
    const exportPDF = useCallback(async () => {
        if (totalRows === 0) {
            alert("Nenhum dado para exportar.");
            return;
        }
        setIsExporting(true);

        let dataToExport: ExtractedImovel[] = [];

        if (selectedIds.size > 0) {
            // Exportar apenas selecionados
            const { data: selectedData, error } = await supabase
                .from('imoveis_importados')
                .select('*')
                .in('id', Array.from(selectedIds));

            if (error) {
                console.error("Erro ao buscar dados selecionados:", error);
                alert("Erro ao exportar dados selecionados.");
                setIsExporting(false);
                return;
            }
            dataToExport = selectedData as ExtractedImovel[];
        } else {
            // Exportar todos filtrados (comportamento original)
            dataToExport = await fetchAllFilteredData(appliedFilters, search, sortColumn, sortDirection);
        }

        if (dataToExport.length === 0) {
            setIsExporting(false);
            return;
        }

        const doc = new jsPDF({
            orientation: 'landscape', // Tabela larga, melhor em paisagem
            unit: 'mm',
            format: 'a4'
        });

        const head = [columns];
        const body = dataToExport.map(row => columns.map(col => {
            return row[col] ?? '';
        }));

        autoTable(doc, {
            head: head,
            body: body,
            startY: 10,
            theme: 'grid',
            styles: {
                fontSize: 6,
                cellPadding: 1,
            },
            headStyles: {
                fillColor: [30, 58, 138], // Azul escuro
                textColor: 255,
                fontStyle: 'bold',
            },
            margin: { top: 10, left: 5, right: 5, bottom: 10 },
            didDrawPage: function (data) {
                // Adiciona título e número da página
                doc.setFontSize(10);
                doc.text(`Relatório de Imóveis Importados (${selectedIds.size > 0 ? 'Selecionados' : 'Completo'})`, data.settings.margin.left, 5);
                doc.text(`Página ${data.pageNumber}`, doc.internal.pageSize.width - data.settings.margin.right, 5, { align: 'right' });
            }
        });

        doc.save(`imoveis_importados_${selectedIds.size > 0 ? 'selecionados' : 'filtrados'}_${new Date().toISOString().split('T')[0]}.pdf`);

        setIsExporting(false);
    }, [appliedFilters, search, sortColumn, sortDirection, totalRows, fetchAllFilteredData, columns, selectedIds]);


    const totalPages = Math.ceil(totalRows / limit);

    // Resumo da paginação e filtragem
    const paginationSummary = `Página ${page} de ${totalPages} — ${totalRows} registros`;

    // O resumo da filtragem agora é sempre baseado no totalRows retornado pelo servidor
    const filterSummary = (appliedFilters.categoria || appliedFilters.bairro || appliedFilters.minDorms || appliedFilters.maxDorms || appliedFilters.minVenda || appliedFilters.maxVenda || appliedFilters.minAluguel || appliedFilters.maxAluguel || appliedFilters.andar || appliedFilters.enderecoSearch || appliedFilters.referenciaSearch || appliedFilters.responsavel || search)
        ? ` (Filtrando ${totalRows} resultados)`
        : '';

    if (loading && data.length === 0)
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
                <p className="ml-3 text-gray-600">Carregando dados extraídos...</p>
            </div>
        );

    if (fetchError) {
        return (
            <div className="p-8 bg-red-100 border border-red-400 text-red-700 rounded-md">
                <h2 className="text-xl font-bold flex items-center"><AlertTriangle className="w-6 h-6 mr-2" /> Erro ao Carregar Dados</h2>
                <p className="mt-2">{fetchError}</p>
                <p className="mt-4 text-sm">Se o erro persistir, verifique o console para detalhes sobre a chamada RPC.</p>
                <Button onClick={() => fetchData(page, appliedFilters, search, sortColumn, sortDirection)} className="mt-3 bg-red-600 hover:bg-red-700 text-white">
                    Tentar Recarregar
                </Button>
            </div>
        );
    }

    // Componente de Paginação Duplicado
    const PaginationControls = () => (
        <div className="flex items-center gap-2">
            <Button
                variant="outline"
                disabled={page === 1 || saving}
                onClick={() => setPage((p) => p - 1)}
                className="h-9"
            >
                <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
            </Button>
            <Button
                variant="outline"
                disabled={page >= totalPages || saving}
                onClick={() => setPage((p) => p + 1)}
                className="h-9"
            >
                Próxima <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
            <select
                className="border rounded px-2 py-1 text-sm h-9 bg-white"
                value={limit}
                onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1); // Reset page when limit changes
                }}
                disabled={saving}
            >
                {[10, 20, 50, 100].map((n) => (
                    <option key={n} value={n}>{n} por página</option>
                ))}
            </select>
        </div>
    );

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-6">
            {/* Cabeçalho */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <h1 className="text-3xl font-bold text-dark-text">
                    <Search className="w-6 h-6 mr-2 inline text-blue-600" /> Imóveis Importados (Tabela Direta)
                </h1>

                <div className="flex flex-wrap gap-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Buscar em todo o banco de dados..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-8 w-64 h-9"
                        />
                    </div>
                    {/* Removido botão Salvar Alterações */}
                    {(saving || isExporting) && (
                        <Button disabled className="h-9 bg-primary-orange text-white">
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {isExporting ? 'Exportando...' : 'Salvando...'}
                        </Button>
                    )}
                    {selectedIds.size > 0 && (
                        <Button
                            onClick={() => setSelectedIds(new Set())}
                            variant="outline"
                            className="h-9 text-gray-600 border-gray-600 hover:bg-gray-50"
                        >
                            Limpar Seleção ({selectedIds.size})
                        </Button>
                    )}
                    <Button onClick={exportCSV} variant="outline" className="h-9 text-green-600 border-green-600 hover:bg-green-50" disabled={isExporting || saving || totalRows === 0}>
                        <Download className="w-4 h-4 mr-2" /> {selectedIds.size > 0 ? `Exportar Selecionados (${selectedIds.size})` : `Exportar CSV (${totalRows})`}
                    </Button>
                    <Button onClick={exportPDF} variant="outline" className="h-9 text-red-600 border-red-600 hover:bg-red-50" disabled={isExporting || saving || totalRows === 0}>
                        <Download className="w-4 h-4 mr-2" /> {selectedIds.size > 0 ? `Exportar Selecionados (${selectedIds.size})` : `Exportar PDF (${totalRows})`}
                    </Button>
                </div>
            </div>

            {/* Filtro Inteligente */}
            <ExtractedImovelFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onApply={handleApplyFilters}
                onClear={handleClearFilters}
            />

            {/* Resumo da Paginação (Topo) */}
            <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500 font-semibold">
                    {paginationSummary} {filterSummary}
                </div>
                <PaginationControls />
            </div>

            {/* Tabela */}
            <Card className="shadow-lg">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-gray-100 text-left sticky top-0 z-10">
                                    <th className="border border-gray-300 px-3 py-2 w-10 text-center">
                                        <Checkbox
                                            id="select-all-checkbox"
                                            checked={data.length > 0 && data.every(row => selectedIds.has(row.id))}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </th>
                                    {columns.map((col) => (
                                        <th
                                            key={col}
                                            className="border border-gray-300 px-3 py-2 whitespace-nowrap font-semibold text-dark-text cursor-pointer hover:bg-gray-200 transition-colors"
                                            style={{ minWidth: columnWidths[col] || '100px' }}
                                            onClick={() => handleSort(col)}
                                        >
                                            <div className="flex items-center justify-between">
                                                {col}
                                                {sortColumn === col ? (
                                                    sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 ml-1 text-blue-600" /> : <ArrowDown className="w-4 h-4 ml-1 text-blue-600" />
                                                ) : (
                                                    <ArrowUp className="w-4 h-4 ml-1 text-gray-300" />
                                                )}
                                            </div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row) => {
                                    return (
                                        <tr key={row.id} className={`hover:bg-gray-50 transition-colors ${selectedIds.has(row.id) ? 'bg-blue-50' : ''}`}>
                                            <td className="border border-gray-300 px-3 py-2 text-center">
                                                <Checkbox
                                                    id={`checkbox-row-${row.id}`}
                                                    checked={selectedIds.has(row.id)}
                                                    onCheckedChange={() => handleSelectRow(row.id)}
                                                />
                                            </td>
                                            {columns.map((col) => {

                                                const currentValue = row[col] ?? '';

                                                // Coluna Responsáveis (Select para ENUM)
                                                if (col === 'Responsáveis') {
                                                    const isSelected = currentValue !== 'Vazio' && currentValue !== null && currentValue !== '';
                                                    return (
                                                        <td
                                                            key={col}
                                                            className="border border-gray-300 p-1 relative"
                                                            style={{ minWidth: columnWidths[col] || '120px' }}
                                                        >
                                                            <select
                                                                value={currentValue === null ? 'Vazio' : currentValue}
                                                                onBlur={(e) => handleSaveCell(row.id, col, e.target.value)}
                                                                onChange={(e) => {
                                                                    // Atualiza o estado local imediatamente para feedback visual
                                                                    setData(prev => prev.map(item =>
                                                                        item.id === row.id ? { ...item, [col]: e.target.value } : item
                                                                    ));
                                                                    // Salva imediatamente no banco
                                                                    handleSaveCell(row.id, col, e.target.value);
                                                                }}
                                                                className={`w-full h-full text-xs border-none focus:ring-0 p-1 text-gray-700 rounded-lg appearance-none cursor-pointer transition-colors 
                                                    ${isSelected ? 'bg-green-100' : 'bg-gray-100'}
                                                `}
                                                                disabled={saving}
                                                            >
                                                                {responsavelOptions.map(option => (
                                                                    <option key={option} value={option}>{option}</option>
                                                                ))}
                                                            </select>
                                                        </td>
                                                    );
                                                }

                                                // Colunas Venda e Aluguel (Usando CurrencyEditableCell)
                                                if (col === 'Venda' || col === 'Aluguel') {
                                                    return (
                                                        <CurrencyEditableCell
                                                            key={col}
                                                            rowId={row.id}
                                                            column={col}
                                                            initialValue={currentValue}
                                                            onSave={handleSaveCell}
                                                            disabled={saving}
                                                        />
                                                    );
                                                }

                                                // Outras colunas (Textarea editável com salvamento em onBlur)
                                                return (
                                                    <DebouncedTextarea
                                                        key={col}
                                                        rowId={row.id}
                                                        column={col}
                                                        initialValue={currentValue}
                                                        onSave={handleSaveCell}
                                                        disabled={saving}
                                                    />
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {data.length === 0 && !loading && !fetchError && (
                            <div className="text-center py-10 text-gray-500">Nenhum registro encontrado na página atual.</div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Paginação (Rodapé) */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-gray-500 font-semibold">
                    {paginationSummary} {filterSummary}
                </div>
                <PaginationControls />
            </div>
        </div>
    );
}

export default ExtractedImoveisPage;

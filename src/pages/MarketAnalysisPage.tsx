import React, { useEffect, useRef, useState } from 'react';
import PerformanceBenchmarkPage from './PerformanceBenchmarkPage';

// Let TypeScript know Chart.js is available on the window object from the CDN
declare var Chart: any;

const MarketAnalysisPage: React.FC = () => {
    const [activeTab, setActiveTab] = useState('tab-overview');
    const [selectedNeighborhood, setSelectedNeighborhood] = useState('Centro');
    const [currentDate] = useState(new Date().toLocaleDateString('pt-BR'));
    const [aiAnalysis, setAiAnalysis] = useState<{ text: string; error: boolean } | null>(null);
    const [isAiLoading, setIsAiLoading] = useState(false);

    const chartInstances = useRef<{ [key: string]: any }>({});
    const marketTrendChartRef = useRef<HTMLCanvasElement>(null);
    const priceByNeighborhoodChartRef = useRef<HTMLCanvasElement>(null);
    const liquidityByNeighborhoodChartRef = useRef<HTMLCanvasElement>(null);
    const salesMixChartRef = useRef<HTMLCanvasElement>(null);
    const projectionChartRef = useRef<HTMLCanvasElement>(null);
    // brazilSalesChartRef is no longer needed

    const neighborhoodData: { [key: string]: any } = {
        'Centro': {
            title: 'Centro',
            text: 'O Centro combina alta demanda de aluguel (proximidade com universidades e serviços) e um grande estoque de imóveis usados, muitos antigos. A liquidez é boa (110 dias), mas depende da precificação correta e do estado de conservação. Lançamentos são raros e muito valorizados.',
            price: 5500,
            liquidity: 110,
            profile: 'Misto (Residencial/Comercial), alta demanda de aluguel'
        },
        'Laranjal': {
            title: 'Laranjal',
            text: 'Principal bairro de alto padrão, focado em casas e condomínios de luxo. Possui o m² mais caro da cidade (R$ 7.000) e a melhor liquidez (90 dias), pois atende a um nicho específico e com alta demanda. A sazonalidade da praia influencia menos o mercado de venda.',
            price: 7000,
            liquidity: 90,
            profile: 'Alto Padrão, condomínios de luxo'
        },
        'Areal': {
            title: 'Areal',
            text: 'Bairro residencial tradicional, com boa infraestrutura. Tem atraído novos empreendimentos de médio e alto padrão. O preço do m² (R$ 4.800) é equilibrado e a liquidez é mediana (120 dias). Boa procura por famílias.',
            price: 4800,
            liquidity: 120,
            profile: 'Residencial tradicional, médio/alto padrão'
        },
        'Porto': {
            title: 'Porto',
            text: 'Área com perfil misto, residencial e comercial. Valorização recente devido a novos empreendimentos próximos à universidade. O m² (R$ 4.500) é competitivo, mas a liquidez (140 dias) ainda é um pouco mais lenta que a do Centro.',
            price: 4500,
            liquidity: 140,
            profile: 'Misto (Residencial/Comercial), próximo à universidade'
        },
        'Fragata': {
            title: 'Fragata',
            text: 'Bairro extenso, com grande foco residencial e preços mais acessíveis (R$ 4.200/m²). É um dos principais alvos para lançamentos do "Minha Casa, Minha Vida". A liquidez de usados é mais lenta (160 dias), refletindo um maior tempo de decisão de compra.',
            price: 4200,
            liquidity: 160,
            profile: 'Residencial, focado em "Minha Casa, Minha Vida"'
        },
        'TresVendas': {
            title: 'Três Vendas',
            text: 'Similar ao Fragata, é uma grande zona residencial com os preços mais acessíveis da cidade (R$ 4.000/m²). Amplo estoque de imóveis usados e área de expansão para novos projetos populares. A liquidez é a mais lenta (170 dias).',
            price: 4000,
            liquidity: 170,
            profile: 'Residencial popular, expansão'
        }
    };

    const handleGenerateAIAnalysis = async () => {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            alert("A chave da API Gemini não foi configurada. Por favor, adicione-a ao seu arquivo .env.local.");
            return;
        }

        setIsAiLoading(true);
        setAiAnalysis(null);
        const data = neighborhoodData[selectedNeighborhood];
        if (!data) return;

        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;
        const systemPrompt = "Você é um analista imobiliário sênior, especialista no mercado de Pelotas, RS. Sua análise é direta, concisa e focada em investidores.";
        const userQuery = `Gere uma breve análise de investimento (em 2-3 frases) para o bairro '${data.title}' em Pelotas. Considere estes dados:\n- Preço Médio m²: R$ ${data.price}\n- Liquidez Média: ${data.liquidity} dias\n- Perfil: ${data.profile}\n\nDestaque os principais prós e contras para um potencial investidor. Responda em português.`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            const result = await response.json();
            const candidate = result.candidates?.[0];
            if (candidate && candidate.content?.parts?.[0]?.text) {
                setAiAnalysis({ text: candidate.content.parts[0].text, error: false });
            } else {
                throw new Error("Resposta da IA inválida.");
            }
        } catch (error) {
            console.error("Erro ao gerar análise de IA:", error);
            setAiAnalysis({ text: "Não foi possível gerar a análise de IA no momento. Tente novamente.", error: true });
        } finally {
            setIsAiLoading(false);
        }
    };

    useEffect(() => {
        const chartOptions = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } };
        const initChart = (ref: React.RefObject<HTMLCanvasElement>, id: string, config: any) => {
            if (chartInstances.current[id]) chartInstances.current[id].destroy();
            if (ref.current) {
                const ctx = ref.current.getContext('2d');
                if (ctx) chartInstances.current[id] = new Chart(ctx, config);
            }
        };

        if (activeTab === 'tab-overview') {
            initChart(marketTrendChartRef, 'marketTrendChart', { type: 'line', data: { labels: ['2023', '2024', '2025 (Est.)', '2026 (Proj.)'], datasets: [{ label: 'Preço Médio m²', data: [4700, 5150, 5500, 5800], borderColor: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', fill: true, tension: 0.3 }] }, options: chartOptions });
        } else if (activeTab === 'tab-bairros') {
            initChart(priceByNeighborhoodChartRef, 'priceByNeighborhoodChart', { type: 'bar', data: { labels: ['Laranjal', 'Centro', 'Areal', 'Porto', 'Fragata', 'Três Vendas'], datasets: [{ label: 'Preço Médio por m²', data: [7000, 5500, 4800, 4500, 4200, 4000], backgroundColor: ['#1e3a8a', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe'] }] }, options: { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } } });
            initChart(liquidityByNeighborhoodChartRef, 'liquidityByNeighborhoodChart', { type: 'bar', data: { labels: ['Laranjal', 'Centro', 'Areal', 'Porto', 'Fragata', 'Três Vendas'], datasets: [{ label: 'Dias para Venda', data: [90, 110, 120, 140, 160, 170], backgroundColor: '#3b82f6' }] }, options: { ...chartOptions, indexAxis: 'y', plugins: { ...chartOptions.plugins, legend: { display: false } } } });
        } else if (activeTab === 'tab-tipos') {
            initChart(salesMixChartRef, 'salesMixChart', { type: 'doughnut', data: { labels: ['Imóveis Usados', 'Lançamentos / Na Planta'], datasets: [{ data: [65, 35], backgroundColor: ['#1e3a8a', '#60a5fa'] }] }, options: chartOptions });
        } else if (activeTab === 'tab-projecoes') {
            initChart(projectionChartRef, 'projectionChart', { type: 'bar', data: { labels: ['Valorização Média 2025', 'Projeção Valorização 2026'], datasets: [{ label: 'Preço Médio m²', data: [5500, 5800], backgroundColor: ['#3b82f6', '#1e3a8a'] }] }, options: { ...chartOptions, plugins: { ...chartOptions.plugins, legend: { display: false } } } });
        }
        
        // If the active tab was 'tab-brasil', switch to 'tab-overview'
        if (activeTab === 'tab-brasil') {
            setActiveTab('tab-overview');
        }

        return () => Object.values(chartInstances.current).forEach((chart: any) => chart?.destroy());
    }, [activeTab]);

    const tabButtonClasses = (tabName: string) => `py-4 px-1 text-sm sm:text-base font-medium text-slate-500 hover:text-blue-700 focus:outline-none transition-all duration-300 border-b-3 ${activeTab === tabName ? 'border-blue-600 text-blue-800 font-semibold' : 'border-transparent'}`;

    return (
        <div className="bg-slate-50 text-slate-900">
            <div className="bg-white shadow-sm">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <h1 className="text-3xl font-bold text-blue-900">Análise Interativa: Mercado Imobiliário de Pelotas-RS</h1>
                    <p className="mt-2 text-lg text-slate-600">Uma visão detalhada das tendências, valores e projeções (2023-2026)</p>
                </div>
            </div>

            <nav className="sticky top-[88px] bg-white z-10 shadow-md">
                <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex space-x-4 sm:space-x-8 -mb-px overflow-x-auto">
                        <button className={tabButtonClasses('tab-overview')} onClick={() => setActiveTab('tab-overview')}>Visão Geral</button>
                        <button className={tabButtonClasses('tab-bairros')} onClick={() => setActiveTab('tab-bairros')}>Análise por Bairro</button>
                        <button className={tabButtonClasses('tab-tipos')} onClick={() => setActiveTab('tab-tipos')}>Tipos de Imóvel</button>
                        <button className={tabButtonClasses('tab-projecoes')} onClick={() => setActiveTab('tab-projecoes')}>Projeções 2026</button>
                        <button className={tabButtonClasses('tab-performance')} onClick={() => setActiveTab('tab-performance')}>Benchmark de Performance</button>
                    </div>
                </div>
            </nav>

            <main className="container mx-auto p-4 sm:p-6 lg:p-8">
                {activeTab === 'tab-overview' && <div className="animate-fade-in">
                    <p className="text-base text-slate-700 mb-6 max-w-3xl">Esta seção apresenta uma visão macro do mercado imobiliário em Pelotas, destacando os principais indicadores de desempenho (KPIs) e a tendência de valorização geral dos imóveis na área urbana. Use estes dados como um ponto de partida para entender a saúde e a direção do mercado.</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 mb-8">
                        <div className="kpi-card"><h2 className="kpi-title">Preço Médio m² (Urbano)</h2><p className="kpi-value">R$ 5.150</p></div>
                        <div className="kpi-card"><h2 className="kpi-title">Liquidez Média (Usados)</h2><p className="kpi-value">135 Dias</p></div>
                        <div className="kpi-card"><h2 className="kpi-title">Vendas Mensais (Média)</h2><p className="kpi-value">~350</p></div>
                    </div>
                    <div className="bg-white p-4 sm:p-6 rounded-lg shadow"><h3 className="text-xl font-semibold mb-4 text-blue-900">Tendência de Valorização (Preço Médio m²)</h3><div className="chart-container"><canvas ref={marketTrendChartRef}></canvas></div></div>
                </div>}
                
                {activeTab === 'tab-bairros' && <div className="animate-fade-in">
                    <p className="text-base text-slate-700 mb-6 max-w-3xl">Explore as nuances do mercado em diferentes localidades. Esta seção permite comparar o preço médio por metro quadrado e a liquidez (tempo médio para venda) entre os principais bairros. Clique em um bairro nos botões abaixo para ver uma análise detalhada sobre suas características e demanda.</p>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-1 bg-white p-4 sm:p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold mb-4 text-blue-900">Análise por Bairro</h3>
                            <div className="flex flex-wrap gap-2 mb-4">{Object.keys(neighborhoodData).map(key => (<button key={key} className={`px-3 py-1.5 text-sm font-medium rounded-full transition-colors ${selectedNeighborhood === key ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'}`} onClick={() => { setSelectedNeighborhood(key); setAiAnalysis(null); }}>{neighborhoodData[key].title}</button>))}</div>
                            <button onClick={handleGenerateAIAnalysis} disabled={isAiLoading} className="w-full mb-4 px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-lg shadow-md hover:from-blue-700 hover:to-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all transform hover:scale-105 disabled:opacity-50">✨ {isAiLoading ? 'Gerando...' : 'Gerar Análise de Investimento (IA)'}</button>
                            <div className="p-4 bg-slate-50 rounded-lg min-h-[200px]">
                                <h4 className="text-lg font-semibold text-blue-800 mb-2">{neighborhoodData[selectedNeighborhood].title}</h4>
                                <p className="text-slate-700 text-sm">{neighborhoodData[selectedNeighborhood].text}</p>
                                {isAiLoading && <div className="flex items-center justify-center h-24"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div><p className="ml-3 text-slate-600">Gerando análise...</p></div>}
                                {aiAnalysis && <><hr className="my-3 border-slate-300" /><h5 className="text-md font-semibold text-blue-900 mb-2">✨ Análise de Investimento (IA)</h5><p className={`text-slate-700 text-sm ${aiAnalysis.error ? 'text-red-600' : ''}`}>{aiAnalysis.text}</p></>}
                            </div>
                        </div>
                        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow"><h3 className="text-xl font-semibold mb-4 text-blue-900">Preço Médio por m²</h3><div className="chart-container"><canvas ref={priceByNeighborhoodChartRef}></canvas></div></div>
                            <div className="bg-white p-4 sm:p-6 rounded-lg shadow"><h3 className="text-xl font-semibold mb-4 text-blue-900">Liquidez Média (Dias para Venda)</h3><div className="chart-container"><canvas ref={liquidityByNeighborhoodChartRef}></canvas></div></div>
                        </div>
                    </div>
                </div>}

                {activeTab === 'tab-tipos' && <div className="animate-fade-in">
                    <p className="text-base text-slate-700 mb-6 max-w-3xl">O mercado não é homogêneo. Esta seção compara o desempenho de imóveis usados versus lançamentos (na planta). Entenda as diferenças em liquidez, perfil de demanda e participação de cada segmento no volume total de vendas.</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold mb-6 text-blue-900">Comparativo: Usados vs. Lançamentos</h3>
                            <div className="space-y-6">
                                <div><h4 className="text-lg font-semibold text-blue-800">Imóveis Usados</h4><ul className="list-disc list-inside mt-2 text-slate-700 space-y-1"><li><strong>Liquidez:</strong> Média de 120-150 dias.</li><li><strong>Demanda:</strong> Forte para imóveis bem localizados.</li></ul></div>
                                <div><h4 className="text-lg font-semibold text-blue-800">Lançamentos (Na Planta)</h4><ul className="list-disc list-inside mt-2 text-slate-700 space-y-1"><li><strong>Liquidez:</strong> Alta, média de 60-90 dias.</li><li><strong>Atrativo:</strong> Facilidades de pagamento.</li></ul></div>
                            </div>
                        </div>
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow"><h3 className="text-xl font-semibold mb-4 text-blue-900">Mix de Vendas (Últimos 12 Meses)</h3><div className="chart-container"><canvas ref={salesMixChartRef}></canvas></div></div>
                    </div>
                </div>}

                {activeTab === 'tab-projecoes' && <div className="animate-fade-in">
                    <p className="text-base text-slate-700 mb-6 max-w-3xl">Olhando para o futuro, esta seção detalha as projeções e tendências esperadas para o mercado imobiliário de Pelotas até 2026. Analisamos os fatores de crescimento, os nichos mais promissores e os desafios que o setor deve enfrentar.</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                            <h3 className="text-xl font-semibold mb-6 text-blue-900">Tendências e Projeções para 2026</h3>
                            <div className="space-y-4 text-slate-700">
                                <div><h4 className="font-semibold text-blue-800">Crescimento Cauteloso</h4><p>Espera-se uma valorização média de 5-7% ao ano, alinhada à inflação e ao crescimento econômico modesto. O mercado deve se manter aquecido, mas sem a euforia de ciclos anteriores.</p></div>
                                <div><h4 className="font-semibold text-blue-800">Foco em Nichos</h4><p>A demanda por imóveis do programa "Minha Casa, Minha Vida" deve crescer nas zonas de expansão (Fragata, Três Vendas). Simultaneamente, o segmento de alto padrão em condomínios fechados (Areal, Laranjal) continuará com alta procura.</p></div>
                                <div><h4 className="font-semibold text-blue-800">Desafios para Imóveis Usados</h4><p>Com a concorrência dos lançamentos, imóveis usados que necessitam de grandes reformas ou estão fora da faixa de preço do mercado terão maior dificuldade de venda, exigindo reajuste de valores para manter a liquidez.</p></div>
                            </div>
                        </div>
                        <div className="bg-white p-4 sm:p-6 rounded-lg shadow"><h3 className="text-xl font-semibold mb-4 text-blue-900">Projeção de Valorização (Preço Médio m²)</h3><div className="chart-container"><canvas ref={projectionChartRef}></canvas></div></div>
                    </div>
                </div>}

                {activeTab === 'tab-performance' && <PerformanceBenchmarkPage />}
            </main>

            <footer className="text-center text-slate-500 text-sm py-8 mt-8 border-t border-slate-200">
                <p>Análise simulada gerada em {currentDate}.</p>
                <p>Este é um relatório demonstrativo e não representa dados oficiais do mercado.</p>
            </footer>
        </div>
    );
};

export default MarketAnalysisPage;
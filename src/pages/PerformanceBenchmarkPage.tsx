import React, { useEffect, useRef } from 'react';

declare var Chart: any;

const PerformanceBenchmarkPage: React.FC = () => {
    const salesChartRef = useRef<HTMLCanvasElement>(null);
    const leadsChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<{ [key: string]: any }>({});

    useEffect(() => {
        const initChart = (ref: React.RefObject<HTMLCanvasElement>, id: string, config: any) => {
            if (chartInstances.current[id]) {
                chartInstances.current[id].destroy();
            }
            if (ref.current) {
                const ctx = ref.current.getContext('2d');
                if (ctx) {
                    chartInstances.current[id] = new Chart(ctx, config);
                }
            }
        };

        // Chart 1: Sales Benchmark (Horizontal Bar Chart)
        const salesData = {
            labels: ['2/ano', '3/ano', '4/ano', '5/ano', '6/ano', '7/ano', '8/ano', '9/ano', '10/ano', '11/ano', '12/ano', '12+/ano'],
            datasets: [{
                label: '% de Corretores',
                data: [3.9, 2.6, 6.8, 5.3, 7.7, 7.6, 13.1, 9.1, 14.7, 9.3, 10.2, 9.8],
                backgroundColor: '#3b82f6',
            }]
        };
        const salesConfig = {
            type: 'bar',
            data: salesData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Makes the chart horizontal
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context: any) => `${context.raw}%` } }
                },
                scales: {
                    x: { 
                        title: { display: true, text: '% dos Corretores na Amostra' }, // Eixo X agora é a porcentagem
                        ticks: {
                            callback: function(value: number) {
                                return value + '%';
                            }
                        }
                    },
                    y: { title: { display: true, text: 'Média de Imóveis Vendidos por Ano' } } // Eixo Y agora é a categoria
                }
            }
        };
        initChart(salesChartRef, 'salesChart', salesConfig);

        // Chart 2: Leads Benchmark (Horizontal Bar Chart)
        const leadsData = {
            labels: ['Até 5', '6 a 10', '11 a 20', '21 a 30', '31 a 40', 'Acima de 50'],
            datasets: [{
                label: '% de Corretores de Alta Performance',
                data: [0.0, 12.4, 14.7, 31.7, 27.6, 5.9],
                backgroundColor: '#10b981',
            }]
        };
        const leadsConfig = {
            type: 'bar',
            data: leadsData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: 'y', // Makes the chart horizontal
                plugins: {
                    legend: { display: false },
                    tooltip: { callbacks: { label: (context: any) => `${context.raw}%` } }
                },
                scales: {
                    x: { 
                        title: { display: true, text: '% dos Corretores' }, // Eixo X agora é a porcentagem
                        ticks: {
                            callback: function(value: number) {
                                return value + '%';
                            }
                        }
                    },
                    y: { title: { display: true, text: 'Leads Recebidos por Mês' } } // Eixo Y agora é a categoria
                }
            }
        };
        initChart(leadsChartRef, 'leadsChart', leadsConfig);

        return () => {
            Object.values(chartInstances.current).forEach(chart => chart?.destroy());
        };
    }, []);

    return (
        <div className="animate-fade-in space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-blue-900">Raio-X do Corretor de Alta Performance: Nosso Benchmark de Vendas e Leads</h1>
                <p className="mt-4 text-lg text-slate-700 max-w-4xl">
                    Equipe, sempre falamos sobre 'alta performance', mas o que isso realmente significa em números? Para definir nossos objetivos com clareza, analisamos uma pesquisa da 'Imóvel Guide' com 1.547 corretores. Os dados mostram um mapa claro do que é preciso para estar no topo do mercado. Vamos analisar esses números e entender como nossa estratégia de leads se encaixa nisso.
                </p>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-blue-900 mb-2">Onde Estamos e Onde Queremos Chegar: A Média de Vendas Anual</h2>
                <p className="text-slate-600 mb-4">O primeiro gráfico define o 'terreno de jogo'. Ele mostra a média de vendas anual dos 1.547 corretores. Use isso como um espelho: onde você está hoje e qual é seu próximo nível?</p>
                <div className="chart-container h-[400px]">
                    <canvas ref={salesChartRef}></canvas>
                </div>
                <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
                    <h3 className="font-semibold text-blue-800">Análise dos Dados</h3>
                    <p className="text-slate-700">O que define a alta performance? Segundo a pesquisa, o jogo vira a partir de 8 vendas anuais. Note que <strong>66,2%</strong> dos corretores (a soma de 8 ou mais vendas) estão nesse grupo de elite. É aqui que queremos que toda a nossa equipe esteja. Vender mais de 10 imóveis por ano não é exceção, é o padrão de sucesso.</p>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-blue-900 mb-2">O Motor da Alta Performance: O Volume de Leads</h2>
                <p className="text-slate-600 mb-4">Analisamos o que os corretores do grupo de elite (aqueles que vendem 8 ou mais imóveis por ano) fazem de diferente. A resposta é clara: geração de leads. O gráfico abaixo mostra quantos leads apenas esse grupo de alta performance recebe por mês.</p>
                <div className="chart-container h-[400px]">
                    <canvas ref={leadsChartRef}></canvas>
                </div>
                <div className="mt-4 p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                    <h3 className="font-semibold text-green-800">Análise dos Dados</h3>
                    <p className="text-slate-700">Esta é a informação mais importante para nossa estratégia. <strong>0%</strong> dos corretores de sucesso sobrevivem com 'Até 5 leads'. A grande maioria, <strong>59,3%</strong> (soma de 21-30 e 31-40 leads), recebe mais de 20 leads consistentemente. Isso prova que o sucesso não é sorte, nem apenas relacionamento. É um processo. É matemática. Mais leads qualificados = mais vendas.</p>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h2 className="text-2xl font-semibold text-blue-900 mb-2">Nosso Plano de Ação</h2>
                <p className="text-slate-600 mb-4">Esses dados confirmam por que investimos tanto em marketing e por que exigimos excelência no tratamento de leads. O sucesso de vocês é o sucesso da imobiliária. O corretor de alta performance não espera o cliente aparecer; ele domina o funil de vendas.</p>
                <div className="mt-4 space-y-4">
                    <h3 className="text-xl font-semibold text-blue-800">Como a Imperial Paris Imóveis Coloca Você no Topo</h3>
                    <ul className="list-disc list-inside space-y-2 text-slate-700">
                        <li><strong>Engajar com o Marketing:</strong> Usar ativamente nossas campanhas e ferramentas de geração de leads.</li>
                        <li><strong>Agilidade é Chave:</strong> Responder a cada lead com velocidade e profissionalismo máximos. Lembre-se, 59,3% dos seus concorrentes de topo estão recebendo mais de 20 por mês.</li>
                        <li><strong>Domine o CRM:</strong> Registrar cada interação. Os dados nos permitem nutrir leads que não compram hoje, mas comprarão amanhã.</li>
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default PerformanceBenchmarkPage;
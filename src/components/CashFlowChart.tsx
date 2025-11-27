import React, { useEffect, useRef } from 'react';
import { MonthlyResult } from '../types';

// Let TypeScript know Chart.js is available on the window object from the CDN
declare var Chart: any;

interface CashFlowChartProps {
    data: MonthlyResult[];
}

const CashFlowChart: React.FC<CashFlowChartProps> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (chartRef.current && data && data.length > 0) {
            const ctx = chartRef.current.getContext('2d');
            if (!ctx) return;
            
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const labels = data.map(d => `Mês ${d.month}`);
            const monthlyCashFlow = data.map(d => d.monthlyCashFlow);
            const accumulatedCashFlow = data.map(d => d.accumulatedCashFlow);
            
            chartInstanceRef.current = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            type: 'line',
                            label: 'Caixa do Mês',
                            data: monthlyCashFlow,
                            borderColor: '#3b82f6',
                            borderWidth: 2,
                            borderDash: [5, 5],
                            backgroundColor: 'transparent',
                            pointBackgroundColor: '#3b82f6',
                            pointRadius: 3,
                            pointHoverRadius: 5,
                            yAxisID: 'y',
                            tension: 0.3,
                        },
                        {
                            type: 'line',
                            label: 'Caixa Acumulado',
                            data: accumulatedCashFlow,
                            borderColor: '#ff6600',
                            backgroundColor: 'rgba(255, 102, 0, 0.1)',
                            fill: true,
                            borderWidth: 3,
                            pointBackgroundColor: '#ff6600',
                            pointRadius: 4,
                            pointHoverRadius: 6,
                            yAxisID: 'y1',
                            tension: 0.3,
                        },
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false,
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false,
                            }
                        },
                        y: {
                            position: 'left',
                            title: { 
                                display: true, 
                                text: 'Fluxo de Caixa Mensal (R$)',
                                font: {
                                    size: 14,
                                }
                            },
                            grid: {
                                color: '#e5e7eb',
                                zeroLineColor: '#9ca3af',
                                zeroLineWidth: 2,
                            },
                            ticks: {
                                callback: function(value: number) {
                                    return (value / 1000) + 'k';
                                }
                            }
                        },
                        y1: {
                            position: 'right',
                            title: { 
                                display: true, 
                                text: 'Caixa Acumulado (R$)',
                                font: {
                                    size: 14,
                                }
                            },
                            grid: {
                                drawOnChartArea: false,
                            },
                             ticks: {
                                callback: function(value: number) {
                                    return (value / 1000) + 'k';
                                }
                            }
                        },
                    },
                    plugins: {
                        legend: {
                            position: 'top',
                            align: 'end',
                        },
                        tooltip: {
                            backgroundColor: '#fff',
                            titleColor: '#333',
                            bodyColor: '#666',
                            borderColor: '#ddd',
                            borderWidth: 1,
                            padding: 10,
                            callbacks: {
                                label: function(context: any) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed.y !== null) {
                                        label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                                    }
                                    return label;
                                }
                            }
                        }
                    }
                }
            });
        }
        
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [data]);

    return <div className="relative h-[350px]"><canvas ref={chartRef} id="cashFlowChartCanvas"></canvas></div>;
};

export default CashFlowChart;
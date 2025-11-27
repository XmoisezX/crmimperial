import React, { useEffect, useRef } from 'react';
import { MonthlyResult } from '../types';

// Let TypeScript know Chart.js is available on the window object from the CDN
declare var Chart: any;

interface RevenueChartProps {
    data: MonthlyResult[];
}

const RevenueChart: React.FC<RevenueChartProps> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (chartRef.current && data) {
            const ctx = chartRef.current.getContext('2d');
            if (!ctx) return;
            
            // Destroy previous chart instance to prevent memory leaks
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const labels = data.map(d => `Mês ${d.month}`);
            
            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Vendas',
                            data: data.map(d => d.grossRevenueSales),
                            backgroundColor: '#ff6600',
                        },
                        {
                            label: '1º Aluguel',
                            data: data.map(d => d.grossRevenueRental1st),
                            backgroundColor: '#3b82f6',
                        },
                        {
                            label: 'Admin. Aluguel',
                            data: data.map(d => d.grossRevenueRentalAdmin),
                            backgroundColor: '#10b981',
                        },
                        {
                            label: 'Regularização',
                            data: data.map(d => d.grossRevenueRegularization),
                            backgroundColor: '#facc15', // Amarelo
                        },
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            stacked: true,
                        },
                        y: {
                            stacked: true,
                            title: { display: true, text: 'Receita Bruta (R$)' }
                        }
                    },
                    plugins: {
                        tooltip: {
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
        
        // Cleanup function to destroy chart on unmount
        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
        };
    }, [data]);

    return <div className="relative h-[350px]"><canvas ref={chartRef} id="revenueChartCanvas"></canvas></div>;
};

export default RevenueChart;
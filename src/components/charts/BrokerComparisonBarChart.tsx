import React, { useEffect, useRef } from 'react';

declare var Chart: any;

interface BrokerPerformance {
    broker_id: string;
    broker_name: string;
    leads_attended: number;
    proposals_sent: number;
    sales_closed: number;
    individual_conversion_rate: number;
    revenue_generated: number;
}

interface BrokerComparisonBarChartProps {
    data: BrokerPerformance[];
}

const BrokerComparisonBarChart: React.FC<BrokerComparisonBarChartProps> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (chartRef.current && data && data.length > 0) {
            const ctx = chartRef.current.getContext('2d');
            if (!ctx) return;

            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const brokerNames = data.map(b => b.broker_name);
            const salesClosed = data.map(b => b.sales_closed);
            const revenueGenerated = data.map(b => b.revenue_generated);

            chartInstanceRef.current = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: brokerNames,
                    datasets: [
                        {
                            label: 'Vendas Fechadas',
                            data: salesClosed,
                            backgroundColor: '#3b82f6', // blue
                            yAxisID: 'y-sales',
                        },
                        {
                            label: 'Receita Gerada (R$)',
                            data: revenueGenerated,
                            backgroundColor: '#10b981', // green
                            yAxisID: 'y-revenue',
                        }
                    ]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'top',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context: any) {
                                    let label = context.dataset.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.dataset.yAxisID === 'y-revenue') {
                                        label += context.parsed.y.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
                                    } else {
                                        label += context.parsed.y;
                                    }
                                    return label;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            stacked: false,
                        },
                        'y-sales': {
                            type: 'linear',
                            position: 'left',
                            title: {
                                display: true,
                                text: 'Vendas Fechadas'
                            },
                            beginAtZero: true,
                            ticks: {
                                precision: 0
                            }
                        },
                        'y-revenue': {
                            type: 'linear',
                            position: 'right',
                            title: {
                                display: true,
                                text: 'Receita Gerada (R$)'
                            },
                            beginAtZero: true,
                            grid: {
                                drawOnChartArea: false, // Only draw grid lines for the left axis
                            },
                            ticks: {
                                callback: function(value: number) {
                                    return (value / 1000) + 'k';
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

    return <canvas ref={chartRef}></canvas>;
};

export default BrokerComparisonBarChart;
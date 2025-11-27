import React, { useEffect, useRef } from 'react';

declare var Chart: any;

interface OpportunityStatusPieChartProps {
    open: number;
    inProgress: number;
    closed: number;
}

const OpportunityStatusPieChart: React.FC<OpportunityStatusPieChartProps> = ({ open, inProgress, closed }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');
            if (!ctx) return;

            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const labels = ['Abertas', 'Em Andamento', 'Encerradas'];
            const values = [open, inProgress, closed];

            chartInstanceRef.current = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: [
                            '#3b82f6', // blue (Open)
                            '#f59e0b', // amber (In Progress)
                            '#10b981', // green (Closed)
                        ],
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context: any) {
                                    let label = context.label || '';
                                    if (label) {
                                        label += ': ';
                                    }
                                    if (context.parsed !== null) {
                                        label += `${context.parsed} oportunidades (${context.formattedValue}%)`;
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
    }, [open, inProgress, closed]);

    return <canvas ref={chartRef}></canvas>;
};

export default OpportunityStatusPieChart;
import React, { useEffect, useRef } from 'react';

declare var Chart: any;

interface LeadSourcePieChartProps {
    data: Record<string, number>; // Ex: { "Site": 50, "Indicação": 30 }
}

const LeadSourcePieChart: React.FC<LeadSourcePieChartProps> = ({ data }) => {
    const chartRef = useRef<HTMLCanvasElement>(null);
    const chartInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (chartRef.current && data) {
            const ctx = chartRef.current.getContext('2d');
            if (!ctx) return;

            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }

            const labels = Object.keys(data);
            const values = Object.values(data);

            chartInstanceRef.current = new Chart(ctx, {
                type: 'pie',
                data: {
                    labels: labels,
                    datasets: [{
                        data: values,
                        backgroundColor: [
                            '#3b82f6', // blue
                            '#10b981', // green
                            '#f59e0b', // amber
                            '#ef4444', // red
                            '#8b5cf6', // violet
                            '#ec4899', // pink
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
                                        label += `${context.parsed} leads (${context.formattedValue}%)`;
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

    return <canvas ref={chartRef}></canvas>;
};

export default LeadSourcePieChart;
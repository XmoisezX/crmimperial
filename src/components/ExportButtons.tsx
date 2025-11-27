import React from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import Papa from 'papaparse';
import { MonthlyResult, SimulationTotals } from '../types';

interface ExportButtonsProps {
    monthlyData: MonthlyResult[];
    totals: SimulationTotals;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const formatPercent = (value: number) => `${value.toFixed(2)}%`;

const ExportButtons: React.FC<ExportButtonsProps> = ({ monthlyData, totals }) => {
    const headers = [
        "Mês", "Nº Vendas", "VGV", "Nº Aluguéis", "Fat Bruto Venda", "Fat Bruto Alug (1º)", "Fat Bruto Alug (Adm)", "Fat Bruto Total",
        "Imposto SN", "Com Var Venda (S)", "Com Var Venda (C)", "Com Var Alug (1º S)",
        "Rec Líquida", "Custo Fixo", "Pagto Imóvel", "Caixa Mês", "Caixa Acum.",
        "Margem Contrib.", "Lucratividade Op.", "Ponto Equil."
    ];

    const getExportData = () => {
        const data = monthlyData.map(row => [
            row.month,
            row.salesCount,
            formatCurrency(row.vgv),
            row.rentalsCount,
            formatCurrency(row.grossRevenueSales),
            formatCurrency(row.grossRevenueRental1st),
            formatCurrency(row.grossRevenueRentalAdmin),
            formatCurrency(row.grossRevenueTotal),
            formatCurrency(row.taxAmount),
            formatCurrency(row.commissionVarSalesPartners),
            formatCurrency(row.commissionVarSalesBrokersPaid),
            formatCurrency(row.commissionVarRental1stPartners),
            formatCurrency(row.netRevenueForFixedCosts),
            formatCurrency(row.currentFixedCosts),
            formatCurrency(row.currentPropertyPayment),
            formatCurrency(row.monthlyCashFlow),
            formatCurrency(row.accumulatedCashFlow),
            formatPercent(row.contributionMarginPercent),
            formatPercent(row.operatingProfitabilityPercent),
            formatCurrency(row.breakEvenPoint)
        ]);

        const totalsRow = [
            "Total/Média",
            totals.totalSalesCount,
            formatCurrency(totals.totalVgv),
            totals.totalRentalsCount,
            formatCurrency(totals.grossRevenueSales),
            formatCurrency(totals.grossRevenueRental1st),
            formatCurrency(totals.grossRevenueRentalAdmin),
            formatCurrency(totals.grossRevenueTotal),
            formatCurrency(totals.taxAmount),
            formatCurrency(totals.commissionVarSalesPartners),
            formatCurrency(totals.commissionVarSalesBrokersPaid),
            formatCurrency(totals.commissionVarRental1stPartners),
            formatCurrency(totals.netRevenueForFixedCosts),
            formatCurrency(totals.totalFixedCosts),
            formatCurrency(totals.totalPropertyPayments),
            '-',
            formatCurrency(totals.finalAccumulatedCashFlow),
            formatPercent(totals.avgContributionMarginPercent),
            formatPercent(totals.avgOperatingProfitabilityPercent),
            formatCurrency(totals.avgBreakEvenPoint)
        ];
        
        return { data, totalsRow };
    };

    const handleExportCSV = () => {
        const { data, totalsRow } = getExportData();
        const csvData = [headers, ...data, totalsRow];
        const csv = Papa.unparse(csvData);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'relatorio_simulacao.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleExportPDF = () => {
        const doc = new jsPDF({
            orientation: 'landscape',
        });

        doc.text("Relatório da Simulação Financeira - Gráficos", 14, 16);

        const cashFlowCanvas = document.getElementById('cashFlowChartCanvas') as HTMLCanvasElement;
        const revenueCanvas = document.getElementById('revenueChartCanvas') as HTMLCanvasElement;

        const addChartToPdf = (canvas: HTMLCanvasElement, x: number, y: number) => {
            if (canvas) {
                const chartImage = canvas.toDataURL('image/png', 1.0);
                const aspectRatio = canvas.width / canvas.height;
                const imageWidth = 130;
                const imageHeight = imageWidth / aspectRatio;
                doc.addImage(chartImage, 'PNG', x, y, imageWidth, imageHeight);
            }
        };

        addChartToPdf(cashFlowCanvas, 14, 25);
        addChartToPdf(revenueCanvas, 154, 25);

        doc.addPage();
        doc.text("Relatório da Simulação Financeira - Dados Detalhados", 14, 16);

        const { data, totalsRow } = getExportData();

        autoTable(doc, {
            head: [headers],
            body: data,
            foot: [totalsRow],
            startY: 20,
            theme: 'grid',
            styles: {
                fontSize: 6,
                cellPadding: 1,
            },
            headStyles: {
                fillColor: [255, 102, 0],
                textColor: 255,
                fontStyle: 'bold',
            },
            footStyles: {
                fillColor: [229, 231, 235],
                textColor: 0,
                fontStyle: 'bold',
            },
        });

        doc.save('relatorio_simulacao_completo.pdf');
    };

    return (
        <div className="flex items-center space-x-4">
            <button
                onClick={handleExportCSV}
                className="px-4 py-2 text-sm font-medium text-primary-orange border border-primary-orange rounded-md hover:bg-orange-50 transition-colors"
            >
                Exportar CSV
            </button>
            <button
                onClick={handleExportPDF}
                className="px-4 py-2 text-sm font-medium text-white bg-primary-orange rounded-md hover:bg-secondary-orange transition-colors"
            >
                Exportar PDF
            </button>
        </div>
    );
};

export default ExportButtons;
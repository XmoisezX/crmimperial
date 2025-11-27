import { useCallback } from 'react';
import { SimulationInput, MonthlyResult, SimulationResult } from '../types';
import { INSS_PRO_LABORE_COST } from '../constants';
import { getCurrentMonthIndex } from '../src/utils/date';

export const useFinancialSimulator = () => {
    const calculateSimulation = useCallback((
        inputs: SimulationInput, 
        duration: number, 
        actualData: Record<number, Partial<MonthlyResult>> = {}
    ): SimulationResult => {
        
        const currentMonthIndex = getCurrentMonthIndex(inputs.startDate);
        
        const monthlyData: MonthlyResult[] = [];
        let accumulatedCashFlow = inputs.initialCash;
        let accumulatedRentalContracts = 0; // Contratos acumulados para cálculo de Adm. Aluguel

        // Reset totals for recalculation
        let totalGrossSales = 0, totalGrossRental1st = 0, totalGrossRentalAdmin = 0, totalGrossRegularization = 0, totalGrossRevenue = 0;
        let totalTax = 0, totalCommVarSaleS = 0, totalCommVarSaleC = 0, totalCommVarRent1stS = 0, totalCommVarRent1stI = 0;
        let totalNetRevenueForFixedCosts = 0, totalFixedCosts = 0, totalPropertyPayments = 0;
        let totalSalesCount = 0, totalRentalsCount = 0, totalVgv = 0;
        
        const NUMBER_OF_PARTNERS = 3; 

        const baseFixedCosts = inputs.custoContabilidade + inputs.custoCRM + inputs.custoInternetTel + inputs.custoAguaLuz + inputs.custoOutrosFixos + inputs.custoAluguelCondominio + inputs.salarioAdministrativo;

        for (let month = 1; month <= duration; month++) {
            
            const actual = actualData[month];
            const isPastMonth = month < currentMonthIndex;
            
            // --- 1. Determinar Contagens (Vendas e Aluguéis) ---
            
            const isSlowMonth = month <= inputs.slowStartMonths;
            const isExpansionActive = month >= inputs.expansionStartMonth;

            // Projeção de Vendas
            const salesTargetPerPartner = isSlowMonth ? inputs.salesTargetPartnersSlow : inputs.salesTargetPartnersFull;
            const projectedSalesCountPartners = salesTargetPerPartner * NUMBER_OF_PARTNERS;
            
            let projectedSalesCountBrokers = 0;
            const fullBrokerTarget = inputs.numberOfBrokers * inputs.salesTargetBrokersFull;
            if (isExpansionActive && inputs.numberOfBrokers > 0 && fullBrokerTarget > 0) {
                const expansionMonthIndex = month - inputs.expansionStartMonth;
                if (expansionMonthIndex === 0) projectedSalesCountBrokers = Math.ceil(fullBrokerTarget * (inputs.percRampaMes1 / 100));
                else if (expansionMonthIndex === 1) projectedSalesCountBrokers = Math.ceil(fullBrokerTarget * (inputs.percRampaMes2 / 100));
                else projectedSalesCountBrokers = Math.ceil(fullBrokerTarget * (inputs.percRampaMes3 / 100));
            }
            const projectedSalesCountTotal = projectedSalesCountPartners + projectedSalesCountBrokers;
            const projectedRentalsCount = isSlowMonth ? inputs.rentalsTargetSlow : inputs.rentalsTargetFull;
            
            // Valores a serem usados no cálculo (Real se passado, Projetado caso contrário)
            const salesCount = isPastMonth && actual?.actualSalesCount !== null && actual?.actualSalesCount !== undefined ? actual.actualSalesCount : projectedSalesCountTotal;
            const rentalsCount = isPastMonth && actual?.actualRentalsCount !== null && actual?.actualRentalsCount !== undefined ? actual.actualRentalsCount : projectedRentalsCount;
            
            // Distribuição de Vendas (usada para calcular comissão de sócios vs corretores)
            const salesCountPartners = isPastMonth && actual?.actualSalesCount !== null && actual?.actualSalesCount !== undefined
                ? Math.round(salesCount * (projectedSalesCountPartners / (projectedSalesCountTotal || 1))) 
                : projectedSalesCountPartners;
            const salesCountBrokers = salesCount - salesCountPartners;
            
            const vgv = salesCount * inputs.avgSaleValue;

            // --- 2. Custos Fixos e Pagamentos de Imóvel ---
            
            const projectedMarketingCost = isExpansionActive ? inputs.marketingExpandedCost : inputs.marketingBaseCost;
            const projectedInternCostTotal = isExpansionActive ? inputs.numberOfInterns * inputs.internCost : 0;
            
            let projectedProLaboreCost = 0;
            let projectedINSSCost = 0;
            if (month >= inputs.proLaboreStartMonth) {
                projectedProLaboreCost = inputs.proLaboreAlessandro + inputs.proLaboreTamires + inputs.proLaboreMoisez;
                projectedINSSCost = INSS_PRO_LABORE_COST;
            }

            const projectedFixedCosts = baseFixedCosts + projectedProLaboreCost + projectedINSSCost + projectedMarketingCost + projectedInternCostTotal;
            
            let projectedPropertyPayment = 0;
            if (month === 1) projectedPropertyPayment += inputs.custoSetupInicial;
            if (month === inputs.propertyPayment1Month) projectedPropertyPayment += inputs.propertyPayment1Amount;
            if (month === inputs.propertyPayment2Month) {
                const correction = inputs.propertyPayment2Amount * (inputs.taxaSelicEstimadaAnual / 100);
                projectedPropertyPayment += inputs.propertyPayment2Amount + correction;
            }
            if (month === inputs.propertyPayment3Month) {
                projectedPropertyPayment += inputs.propertyPayment3Amount;
            }
            
            // Valores R/P para Custos Fixos e Pagamentos
            const currentFixedCosts = isPastMonth && actual?.actualCurrentFixedCosts !== null && actual?.actualCurrentFixedCosts !== undefined ? actual.actualCurrentFixedCosts : projectedFixedCosts;
            const currentPropertyPayment = isPastMonth && actual?.actualPropertyPayment !== null && actual?.actualPropertyPayment !== undefined ? actual.actualPropertyPayment : projectedPropertyPayment;
            
            // --- 3. Receita Bruta (Calculada a partir das Contagens R/P) ---
            
            // Receita Bruta de Vendas (Comissão da Imobiliária)
            const grossRevenueSalesPartners = salesCountPartners * inputs.avgSaleValue * (inputs.commissionRateSale / 100);
            const grossRevenueSalesBrokers = salesCountBrokers * inputs.avgSaleValue * (inputs.commissionRateSale / 100);
            const grossRevenueSales = grossRevenueSalesPartners + grossRevenueSalesBrokers;
            
            // Receita Bruta 1º Aluguel
            const grossRevenueRental1st = rentalsCount * inputs.avgRentalValue;
            
            // Receita Bruta Adm. Aluguel (Depende do acumulado do mês anterior)
            const grossRevenueRentalAdmin = accumulatedRentalContracts * inputs.avgRentalValue * (inputs.commissionRateRentalAdmin / 100);
            
            // Receita Bruta Regularização
            const grossRevenueRegularization = inputs.avgRegularizationsPerMonth * inputs.avgRegularizationValue;
            
            const calculatedGrossRevenueTotal = grossRevenueSales + grossRevenueRental1st + grossRevenueRentalAdmin + grossRevenueRegularization;
            
            // Valor R/P para Receita Bruta Total
            const grossRevenueTotal = isPastMonth && actual?.actualGrossRevenueTotal !== null && actual?.actualGrossRevenueTotal !== undefined ? actual.actualGrossRevenueTotal : calculatedGrossRevenueTotal;

            // --- 4. Custos Variáveis e Receita Líquida ---
            
            // Comissão Variável dos Corretores Externos (Custo que não é faturamento da empresa)
            let commissionVarSalesBrokersPaid = 0;
            if (salesCountBrokers > 0 && inputs.avgSaleValue > 0) {
                const salesBrokerInternalListing = Math.round(salesCountBrokers * (inputs.brokerInternalListingRatio / 100));
                const salesBrokerExternalListing = salesCountBrokers - salesBrokerInternalListing;
                const commissionPerSaleInternal = inputs.avgSaleValue * (inputs.brokerCommissionSale / 100);
                const commissionPerSaleExternal = inputs.avgSaleValue * ((inputs.brokerCommissionSale + inputs.brokerCommissionListing) / 100);
                commissionVarSalesBrokersPaid = (salesBrokerInternalListing * commissionPerSaleInternal) + (salesBrokerExternalListing * commissionPerSaleExternal);
            }
            
            // Faturamento Tributável (Base de Cálculo para Imposto e Índices)
            // Se o GrossRevenueTotal for real, usamos ele. Se for projetado, usamos o calculado.
            const taxableGrossRevenue = grossRevenueTotal - commissionVarSalesBrokersPaid;

            // Imposto sobre o Faturamento Tributável
            const taxAmount = taxableGrossRevenue * (inputs.taxRate / 100);

            // Outros Custos Variáveis (sobre o Faturamento Bruto Total R/P)
            const otherVariableCosts = grossRevenueTotal * (inputs.outrosCustosVarPercentFatBruto / 100);

            // Comissões Variáveis dos Sócios (Calculadas sobre as receitas brutas projetadas/calculadas)
            const commissionVarSalesPartners = grossRevenueSalesPartners * (inputs.partnerCommissionVarSale / 100);
            const commissionVarRental1stPartners = grossRevenueRental1st * (inputs.partnerCommissionVarRental1st / 100);
            
            // Comissões Variáveis de Aluguel para Corretores (se aplicável)
            const brokerRental1stComm = isExpansionActive ? grossRevenueRental1st * (inputs.brokerCommissionRental1stPercent / 100) : 0;
            const brokerRentalAdminComm = isExpansionActive ? grossRevenueRentalAdmin * (inputs.brokerCommissionRentalAdminPercent / 100) : 0;
            
            // Comissões Variáveis de Aluguel para Estagiários
            let commissionVarRental1stInterns = 0;
            if (isExpansionActive && inputs.numberOfInterns > 0) {
                const internRentalPortion = grossRevenueRental1st * (inputs.internRentalRatio / 100);
                commissionVarRental1stInterns = internRentalPortion * (inputs.internCommissionRental1stPercent / 100);
            }

            // Receita Líquida para Custos Fixos (Net Revenue)
            const netRevenueForFixedCosts = taxableGrossRevenue 
                - taxAmount 
                - commissionVarSalesPartners 
                - commissionVarRental1stPartners 
                - otherVariableCosts 
                - brokerRental1stComm 
                - brokerRentalAdminComm
                - commissionVarRental1stInterns;
            
            // --- 5. Fluxo de Caixa e Acumulado ---
            
            const calculatedMonthlyCashFlow = netRevenueForFixedCosts - currentFixedCosts - currentPropertyPayment;
            
            // Valor R/P para Fluxo de Caixa Mensal
            const monthlyCashFlow = isPastMonth && actual?.actualMonthlyCashFlow !== null && actual?.actualMonthlyCashFlow !== undefined ? actual.actualMonthlyCashFlow : calculatedMonthlyCashFlow;
            
            // Atualiza o caixa acumulado
            accumulatedCashFlow += monthlyCashFlow;
            
            // Atualiza contratos de aluguel acumulados (para o cálculo do próximo mês)
            accumulatedRentalContracts += rentalsCount;

            // --- 6. Índices ---
            
            const contributionMarginPercent = taxableGrossRevenue > 0 ? (netRevenueForFixedCosts / taxableGrossRevenue) * 100 : 0;
            
            const operatingProfitabilityPercent = netRevenueForFixedCosts > 0 ? (monthlyCashFlow / netRevenueForFixedCosts) * 100 : 0;
            
            const breakEvenPoint = contributionMarginPercent > 0 ? currentFixedCosts / (contributionMarginPercent / 100) : 0;

            // --- 7. Armazenar Resultados ---
            
            const resultRow: MonthlyResult = {
                month,
                // Receitas Brutas (Calculadas)
                grossRevenueSales,
                grossRevenueRental1st,
                grossRevenueRentalAdmin,
                grossRevenueRegularization,
                
                // Valores R/P
                grossRevenueTotal,
                currentFixedCosts,
                currentPropertyPayment,
                monthlyCashFlow,
                salesCount,
                rentalsCount,
                vgv,
                
                // Valores Derivados
                taxAmount,
                commissionVarSalesPartners,
                commissionVarSalesBrokersPaid,
                commissionVarRental1stPartners,
                commissionVarRental1stInterns,
                netRevenueForFixedCosts,
                accumulatedCashFlow,
                salesCountPartners, 
                salesCountBrokers,  
                contributionMarginPercent,
                operatingProfitabilityPercent,
                breakEvenPoint,
                
                // Armazena os inputs reais para display/comparação
                actualSalesCount: actual?.actualSalesCount ?? null,
                actualRentalsCount: actual?.actualRentalsCount ?? null,
                actualGrossRevenueTotal: actual?.actualGrossRevenueTotal ?? null,
                actualCurrentFixedCosts: actual?.actualCurrentFixedCosts ?? null,
                actualPropertyPayment: actual?.actualPropertyPayment ?? null,
                actualMonthlyCashFlow: actual?.actualMonthlyCashFlow ?? null,
            };
            
            monthlyData.push(resultRow);

            // --- 8. Atualizar Totais ---
            totalGrossSales += grossRevenueSales;
            totalGrossRental1st += grossRevenueRental1st;
            totalGrossRentalAdmin += grossRevenueRentalAdmin;
            totalGrossRegularization += grossRevenueRegularization;
            totalGrossRevenue += grossRevenueTotal;
            totalTax += taxAmount;
            totalCommVarSaleS += commissionVarSalesPartners;
            totalCommVarSaleC += commissionVarSalesBrokersPaid;
            totalCommVarRent1stS += commissionVarRental1stPartners;
            totalCommVarRent1stI += commissionVarRental1stInterns;
            totalNetRevenueForFixedCosts += netRevenueForFixedCosts;
            totalFixedCosts += currentFixedCosts;
            totalPropertyPayments += currentPropertyPayment;
            totalSalesCount += salesCount;
            totalRentalsCount += rentalsCount;
            totalVgv += vgv;
        }
        
        // Recalculando o Faturamento Tributável Total para os Totais
        const totalTaxableGrossRevenue = totalGrossRevenue - totalCommVarSaleC;

        const totals = {
            grossRevenueSales: totalGrossSales,
            grossRevenueRental1st: totalGrossRental1st,
            grossRevenueRentalAdmin: totalGrossRentalAdmin,
            grossRevenueRegularization: totalGrossRegularization,
            grossRevenueTotal: totalGrossRevenue,
            taxAmount: totalTax,
            commissionVarSalesPartners: totalCommVarSaleS,
            commissionVarSalesBrokersPaid: totalCommVarSaleC,
            commissionVarRental1stPartners: totalCommVarRent1stS,
            commissionVarRental1stInterns: totalCommVarRent1stI,
            netRevenueForFixedCosts: totalNetRevenueForFixedCosts,
            totalFixedCosts: totalFixedCosts,
            totalPropertyPayments: totalPropertyPayments,
            finalAccumulatedCashFlow: accumulatedCashFlow,
            totalSalesCount,
            totalRentalsCount,
            totalVgv,
            avgContributionMarginPercent: totalTaxableGrossRevenue > 0 ? (totalNetRevenueForFixedCosts / totalTaxableGrossRevenue) * 100 : 0,
            avgOperatingProfitabilityPercent: totalNetRevenueForFixedCosts > 0 ? ((accumulatedCashFlow - inputs.initialCash) / totalNetRevenueForFixedCosts) * 100 : 0,
            avgBreakEvenPoint: monthlyData.reduce((acc, row) => acc + row.breakEvenPoint, 0) / duration,
        };
        
        const correctedPayment2 = inputs.propertyPayment2Amount * (1 + inputs.taxaSelicEstimadaAnual / 100);
        const totalPropertyCost = inputs.propertyPayment1Amount + correctedPayment2 + inputs.propertyPayment3Amount;
        const bufferTarget = totalPropertyCost * 0.10;
        const isViable = accumulatedCashFlow >= 0;

        const summary = {
            finalCash: accumulatedCashFlow,
            totalPropertyCost: totalPropertyCost,
            isViable: isViable,
            bufferTarget: bufferTarget,
            bufferMet: isViable && accumulatedCashFlow >= bufferTarget,
        };

        return { monthlyData, totals, summary };

    }, []);
    
    return calculateSimulation;
};
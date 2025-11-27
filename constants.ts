import { SimulationInput } from './types';

export const INSS_PRO_LABORE_COST = 660; // 3 sócios * R$2000 (base) * 11%

export const initialSimulationInputs: SimulationInput = {
    avgSaleValue: 300000,
    avgRentalValue: 2500,
    avgRegularizationsPerMonth: 1,
    avgRegularizationValue: 3000,
    taxRate: 6,
    propertyPayment1Month: 6,
    propertyPayment1Amount: 40000,
    propertyPayment2Month: 12,
    propertyPayment2Amount: 275000,
    propertyPayment3Month: 8, // Novo: Mês Pagto. Reforma
    propertyPayment3Amount: 15000, // Novo: Valor Pagto. Reforma
    initialCash: 0,
    custoSetupInicial: 5000,
    custoContabilidade: 100,
    custoCRM: 470.30,
    custoInternetTel: 150,
    custoAguaLuz: 300,
    custoAluguelCondominio: 2000,
    salarioAdministrativo: 2500,
    custoOutrosFixos: 200,
    taxaSelicEstimadaAnual: 10,
    outrosCustosVarPercentFatBruto: 1,
    // Pro-labore defaults
    proLaboreStartMonth: 1,
    proLaboreAlessandro: 2000,
    proLaboreTamires: 2000,
    proLaboreMoisez: 2000,
    marketingBaseCost: 500,
    marketingExpandedCost: 3000,
    expansionStartMonth: 5,
    numberOfInterns: 2,
    internCost: 1000,
    numberOfBrokers: 4,
    slowStartMonths: 3,
    salesTargetPartnersSlow: 1,
    rentalsTargetSlow: 4,
    salesTargetPartnersFull: 3,
    salesTargetBrokersFull: 1, // Per broker
    percRampaMes1: 50,
    percRampaMes2: 75,
    percRampaMes3: 100,
    rentalsTargetFull: 8,
    commissionRateSale: 6,
    partnerCommissionVarSale: 20,
    brokerCommissionSale: 3,
    brokerCommissionListing: 1,
    brokerInternalListingRatio: 50,
    partnerCommissionVarRental1st: 30,
    brokerCommissionRental1stPercent: 0,
    brokerCommissionRentalAdminPercent: 0,
    commissionRateRentalAdmin: 10,
    // Novos campos para estagiários
    internCommissionRental1stPercent: 10, // 10% de comissão sobre o 1º aluguel
    internRentalRatio: 20, // 20% dos aluguéis são provenientes de estagiários
    
    // NOVO: Data de Início
    startDate: new Date().toISOString().split('T')[0],
};
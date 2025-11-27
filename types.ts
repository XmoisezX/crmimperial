export interface SimulationInput {
  avgSaleValue: number;
  avgRentalValue: number;
  avgRegularizationsPerMonth: number; // Novo
  avgRegularizationValue: number; // Novo
  taxRate: number;
  propertyPayment1Month: number;
  propertyPayment1Amount: number;
  propertyPayment2Month: number;
  propertyPayment2Amount: number;
  propertyPayment3Month: number; // Novo: Mês Pagto. Reforma
  propertyPayment3Amount: number; // Novo: Valor Pagto. Reforma
  initialCash: number;
  custoSetupInicial: number;
  custoContabilidade: number;
  custoCRM: number;
  custoInternetTel: number;
  custoAguaLuz: number;
  custoAluguelCondominio: number;
  salarioAdministrativo: number;
  custoOutrosFixos: number;
  taxaSelicEstimadaAnual: number;
  outrosCustosVarPercentFatBruto: number;
  // Pro-labore changes
  proLaboreStartMonth: number;
  proLaboreAlessandro: number;
  proLaboreTamires: number;
  proLaboreMoisez: number;
  marketingBaseCost: number;
  marketingExpandedCost: number;
  expansionStartMonth: number;
  numberOfInterns: number;
  internCost: number;
  numberOfBrokers: number;
  slowStartMonths: number;
  salesTargetPartnersSlow: number;
  rentalsTargetSlow: number;
  salesTargetPartnersFull: number;
  salesTargetBrokersFull: number;
  percRampaMes1: number;
  percRampaMes2: number;
  percRampaMes3: number;
  rentalsTargetFull: number;
  commissionRateSale: number;
  partnerCommissionVarSale: number;
  brokerCommissionSale: number;
  brokerCommissionListing: number;
  brokerInternalListingRatio: number;
  partnerCommissionVarRental1st: number;
  brokerCommissionRental1stPercent: number;
  brokerCommissionRentalAdminPercent: number;
  commissionRateRentalAdmin: number;
  // Novos campos para estagiários
  internCommissionRental1stPercent: number; // Comissão % sobre 1º aluguel
  internRentalRatio: number; // Proporção de aluguéis (0-100%)
  
  // NOVO: Data de Início
  startDate: string; 
}

export interface MonthlyResult {
  month: number;
  grossRevenueSales: number;
  grossRevenueRental1st: number;
  grossRevenueRentalAdmin: number;
  grossRevenueRegularization: number; // Novo
  grossRevenueTotal: number;
  taxAmount: number;
  commissionVarSalesPartners: number;
  commissionVarSalesBrokersPaid: number;
  commissionVarRental1stPartners: number;
  
  // NOVO: Comissão Estagiários
  commissionVarRental1stInterns: number; 
  
  netRevenueForFixedCosts: number;
  currentFixedCosts: number;
  currentPropertyPayment: number;
  monthlyCashFlow: number;
  accumulatedCashFlow: number;
  salesCount: number;
  salesCountPartners: number; // Novo
  salesCountBrokers: number; // Novo
  rentalsCount: number;
  contributionMarginPercent: number;
  operatingProfitabilityPercent: number;
  breakEvenPoint: number;
  vgv: number;
  
  // NOVO: Campos para Dados Reais (Actual Data)
  actualSalesCount: number | null;
  actualRentalsCount: number | null;
  actualGrossRevenueTotal: number | null;
  actualCurrentFixedCosts: number | null;
  actualPropertyPayment: number | null;
  actualMonthlyCashFlow: number | null;
}

export interface SimulationTotals {
    grossRevenueSales: number;
    grossRevenueRental1st: number;
    grossRevenueRentalAdmin: number;
    grossRevenueRegularization: number; // Novo
    grossRevenueTotal: number;
    taxAmount: number;
    commissionVarSalesPartners: number;
    commissionVarSalesBrokersPaid: number;
    commissionVarRental1stPartners: number;
    
    // NOVO: Comissão Estagiários
    commissionVarRental1stInterns: number; 
    
    netRevenueForFixedCosts: number;
    totalFixedCosts: number;
    totalPropertyPayments: number;
    finalAccumulatedCashFlow: number;
    totalSalesCount: number;
    totalRentalsCount: number;
    avgContributionMarginPercent: number;
    avgOperatingProfitabilityPercent: number;
    avgBreakEvenPoint: number;
    totalVgv: number;
}

export interface SimulationSummary {
  finalCash: number;
  totalPropertyCost: number;
  isViable: boolean;
  bufferTarget: number;
  bufferMet: boolean;
}

export interface SimulationResult {
  monthlyData: MonthlyResult[];
  totals: SimulationTotals;
  summary: SimulationSummary;
}

// --- Imovel Cadastro Types ---

export type ImovelStatus = 'Venda' | 'Locação' | 'Temporada';
export type Disponibilidade = 'Disponível' | 'Indisponível';
export type SimNao = 'Sim' | 'Não';
export type SimNaoSemimobiliado = 'Não' | 'Sim' | 'Semimobiliado';
export type Financiavel = 'Sim' | 'Não' | 'MCMV';
export type VisibilidadeMapa = 'Exata' | 'Aproximada' | 'Não mostrar';
export type StatusAprovacao = 'Aprovado' | 'Não aprovado' | 'Aguardando';
export type Ocupacao = 'Desocupado' | 'Ocupado' | 'Locado'; // NOVO TIPO

// Tipos para Permuta
export type TipoBemPermuta = 'Imóvel' | 'Móvel' | '';
export type TipoMovelPermuta = 'Automóvel' | 'Motocicleta' | 'Barco' | '';

export interface Permuta {
  id: string; // ID único para cada entrada de permuta
  tipo_bem: TipoBemPermuta;
  tipo_especifico: string; // Ex: 'Automóvel' ou 'Apartamento'
  valor_minimo: number | null;
  valor_maximo: number | null;
  estado: string;
  cidade: string;
  bairros_condominios: string;
}

// Tipos para Chaves (NOVO)
export type ResponsavelChave = 'Imobiliária' | 'Agenciador' | 'Proprietário' | 'Corretor Externo' | 'Familiar' | 'Porteiro' | 'Síndico' | 'Zelador' | '';
export type KeyStatus = 'Disponível' | 'Retirada' | 'Atrasada'; // NOVO
export type WithdrawalType = 'Temporária' | 'Definitiva'; // NOVO
export type WithdrawalReason = 'Visita' | 'Vistoria' | 'Manutenção'; // NOVO

export interface ImovelChave {
    id: string; // Client-side UUID for tracking
    responsavel_tipo: ResponsavelChave;
    codigo_chave: string;
    disponivel_emprestimo: boolean;
    nome_contato: string;
    telefone_contato: string;
    observacoes: string;
}

// Interface para a tabela de Chaves (usada na listagem)
export interface KeyListingData {
    id: string;
    codigo_chave: string; // Código da chave
    agencia: string;
    status: KeyStatus;
    retirada_por: string | null;
    previsao_entrega: string | null; // Date string
    hora_entrega: string | null; // Time string
    imovel_id: string;
    // Dados do Imóvel (join)
    imoveis: {
        codigo: string;
        logradouro: string;
        numero: string;
        bairro: string;
    } | null;
}


// Interface para o formulário de retirada
export interface WithdrawalFormData {
    tipo_retirada: WithdrawalType | '';
    motivo: WithdrawalReason | '';
    retirada_por: string;
    previsao_entrega: string;
    hora_entrega: string;
    imprimir_termo: boolean;
}


export interface ImovelInput {
  // Step 1: Dados do Imóvel
  tipo_imovel: string;
  codigo: string;
  venda_ativo: boolean;
  venda_disponibilidade: Disponibilidade;
  venda_motivo_indisponibilidade: string;
  locacao_ativo: boolean;
  locacao_disponibilidade: Disponibilidade;
  locacao_motivo_indisponibilidade: string;
  temporada_ativo: boolean;
  temporada_disponibilidade: Disponibilidade;
  temporada_motivo_indisponibilidade: string;

  // Step 2: Localização
  condominio_id: string;
  bloco_torre: string;
  cep: string;
  estado: string;
  cidade: string;
  bairro: string;
  logradouro: string;
  numero: string;
  complemento: string;
  referencia: string;
  andar: string;
  ultimo_andar: SimNao;
  mapa_visibilidade: VisibilidadeMapa;

  // Step 3: Valores
  valor_venda: number;
  valor_locacao: number;
  valor_condominio: number;
  condominio_isento: boolean;
  valor_iptu: number;
  iptu_isento: boolean;
  seguro_incendio: number;
  taxa_limpeza: number;
  indice_reajuste: string;
  valor_base: number;
  iptu_periodo: 'Mensal' | 'Anual';
  financiavel: Financiavel;
  permutas: Permuta[]; // NOVO CAMPO: Array de permutas

  // Step 4: Visibilidade
  vis_endereco: string;
  vis_venda: string;
  vis_locacao: string;
  vis_temporada: string;
  vis_iptu: string;
  vis_condominio: string;

  // Step 5: Dados não visíveis no site
  proprietario_id: string;
  comissao_proprietario_percent: number;
  periodo_email_atualizacao: number;
  enviar_email_atualizacao: boolean;
  agenciador_id: string;
  responsavel_id: string;
  honorarios_venda_percent: number;
  honorarios_locacao_percent: number;
  honorarios_temporada_percent: number;
  data_agenciamento: string;
  numero_matricula: string;
  nao_possui_matricula: boolean;
  numero_iptu: string;
  vencimento_exclusividade: string;
  ocupacao: Ocupacao; // USANDO NOVO TIPO
  exclusivo: SimNao;
  placa: SimNao;
  medidor_energia: string;
  medidor_agua: string;
  medidor_gas: string;
  observacoes_internas: string;
  
  // Step 6: Chaves (NOVO)
  chaves: ImovelChave[];

  // Step 9: Características
  etiquetas: string;
  dormitorios: number;
  suites: number;
  banheiros: number;
  vagas_garagem: number;
  area_privativa_m2: number; // NOVO CAMPO
  condicao: string;
  mobiliado: SimNaoSemimobiliado;
  orientacao_solar: string;
  posicao: string;
  entrega_obra: string;
  pessoas_acomodacoes: number;
  distancia_mar_m: number;
  tipos_piso: string[];
  titulo_site: string;
  descricao_site: string;
  meta_title: string;
  meta_description: string;

  // Step 11: Aprovação do imóvel
  status_aprovacao: StatusAprovacao;
  observacoes_aprovacao: string;
}

// --- Tipos para Mídias de Imóvel ---
export interface ImovelImage {
    id: string;
    url: string;
    file: File | null; // Pode ser null se a imagem já existir
    legend: string;
    isVisible: boolean;
    rotation: number;
    ordem: number; // NOVO CAMPO
}

// --- Condomínio Cadastro Types ---

export interface CondominioInput {
  // 1. Dados do condomínio
  nome: string;
  ficha: boolean;
  loteamento: boolean;
  incorporadora_id: number | null; // FK para incorporadoras (INT)
  area_terreno_m2: number;
  ano_termino: number;
  arquitetura: string;
  logo_url: string; // URL do logo

  // 2. Localização
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  cidade: string;
  estado: string;
  bairro: string;
  referencia: string;
  latitude: number | null;
  longitude: number | null;

  // 3. Características (IDs das características selecionadas)
  caracteristicas_ids: number[]; 

  // 4. Descrição
  descricao: string;

  // 5. Website
  website_url: string;
  meta_description: string;
  slug: string;

  // 8. Andamento de obra (CondominioObra)
  estagio: string;
  destaque_obra: boolean;
  entrega_obra: string; // Date string
  percentual_projeto: number;
  percentual_terraplanagem: number;
  percentual_fundacao: number;
  percentual_estrutura: number;
  percentual_alvenaria: number;
  percentual_instalacoes: number;
  percentual_acabamento: number;
  percentual_paisagismo: number;

  // 9. Informações complementares
  administradora: string;
  sindico: string;
  construtora: string;
  incorporadora: string;
  projeto_arquitetonico: string;
  projeto_engenharia: string;
  projeto_decoracao: string;
  decoradora: string;
  ocupacao_interna: string;

  // 10. Visibilidade no site
  andamento_obra_visivel: boolean;
  album_visivel: boolean;
  entregas_visivel: boolean;
  ficha_tecnica_visivel: boolean;
  plantas_visivel: boolean;
  projecoes_visivel: boolean;
  tipologias_visivel: boolean;
  transacoes_visivel: boolean;

  // 11. Anexar ao caso lançamento
  vincular_lancamento: boolean;
  lancamento_id: number | null; // FK para lançamentos (INT)
}

export interface CondominioMedia {
    id: string;
    url: string;
    file: File | null;
    tipo: 'imagem' | 'video';
    destaque: boolean;
    ordem: number;
}

// --- Lead Types (NOVO) ---
export type LeadStatus = 'Novo' | 'Contatado' | 'Qualificado' | 'Desqualificado';
export type LeadSource = 'Indicação' | 'Site' | 'Instagram' | 'WhatsApp' | 'Portal Imobiliário' | 'Outro' | '';

export interface LeadInput {
    id?: string;
    nome: string;
    telefone: string;
    email: string;
    origem: LeadSource;
    responsavel_id: string | null;
    observacoes: string | null;
    status: LeadStatus;
    created_at?: string;
}

// Interface for listing (with joins)
export interface LeadListing extends LeadInput {
    responsavel: { full_name: string } | null;
}
import { Planilha } from '../hooks/useAgenciamentoData';

export const TARGET_PLANILHA_NAME = 'imoveis_extraidos';

export const DEFAULT_AGENCIAMENTO_HEADERS = [
    'ID', 
    'Endereço', 
    'Bairro', 
    'Tipo', 
    'Valor Venda', 
    'Valor Locação', 
    'Status', 
    'Proprietário'
];

export const INITIAL_AGENCIAMENTO_DATA: string[][] = [
    ['1', 'Rua A, 123', 'Centro', 'Apartamento', '350000', '1500', 'Novo', 'João Silva'],
    ['2', 'Av. B, 45', 'Laranjal', 'Casa', '800000', '', 'Usado', 'Maria Torres'],
    ['3', 'Rua C, 789', 'Areal', 'Terreno', '120000', '', 'Novo', 'Pedro Souza'],
];
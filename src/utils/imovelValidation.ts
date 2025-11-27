import { ImovelInput } from '../../types';

const TOTAL_STEPS = 11;

/**
 * Valida os campos obrigatórios para um passo específico do cadastro de imóvel.
 * @param currentData Dados do formulário.
 * @param currentStep Passo a ser validado (1 a 11).
 * @returns Lista de erros encontrados.
 */
export const validateImovelStep = (currentData: ImovelInput, currentStep: number): string[] => {
    let errors: string[] = [];

    switch (currentStep) {
        case 1:
            if (!currentData.tipo_imovel) errors.push('O tipo do imóvel é obrigatório.');
            if (!currentData.codigo) errors.push('O código do imóvel é obrigatório.');
            
            const activeCount = (currentData.venda_ativo ? 1 : 0) + (currentData.locacao_ativo ? 1 : 0) + (currentData.temporada_ativo ? 1 : 0);
            if (activeCount === 0) {
                errors.push('Pelo menos uma finalidade deve estar ativa.');
            }
            
            if (currentData.venda_ativo && currentData.venda_disponibilidade === 'Indisponível' && !currentData.venda_motivo_indisponibilidade) {
                errors.push('O motivo de indisponibilidade de venda é obrigatório.');
            }
            if (currentData.locacao_ativo && currentData.locacao_disponibilidade === 'Indisponível' && !currentData.locacao_motivo_indisponibilidade) {
                errors.push('O motivo de indisponibilidade de locação é obrigatório.');
            }
            if (currentData.temporada_ativo && currentData.temporada_disponibilidade === 'Indisponível' && !currentData.temporada_motivo_indisponibilidade) {
                errors.push('O motivo de indisponibilidade de temporada é obrigatório.');
            }
            break;
        case 2:
            if (!currentData.cep || currentData.cep.replace(/\D/g, '').length !== 8) errors.push('O CEP é obrigatório e deve ter 8 dígitos.');
            if (!currentData.bairro) errors.push('O bairro é obrigatório.');
            if (!currentData.logradouro) errors.push('O logradouro é obrigatório.');
            if (!currentData.numero) errors.push('O número é obrigatório.');
            break;
        case 3:
            if (currentData.venda_ativo && currentData.valor_venda <= 0) errors.push('O valor de venda deve ser maior que zero se a venda estiver ativa.');
            if (currentData.locacao_ativo && currentData.valor_locacao <= 0) errors.push('O valor de locação deve ser maior que zero se a locação estiver ativa.');
            if (!currentData.financiavel) errors.push('O campo Financiável é obrigatório.');
            break;
        case 5:
            if (!currentData.proprietario_id) errors.push('O proprietário é obrigatório.');
            if (!currentData.agenciador_id) errors.push('O agenciador é obrigatório.');
            if (!currentData.responsavel_id) errors.push('O responsável é obrigatório.');
            if (!currentData.data_agenciamento) errors.push('A data de agenciamento é obrigatória.');
            if (!currentData.ocupacao) errors.push('O campo Ocupação é obrigatório.');
            break;
        case 9:
            if (currentData.dormitorios === undefined || currentData.dormitorios < 0) errors.push('O número de dormitórios é obrigatório.');
            if (currentData.suites === undefined || currentData.suites < 0) errors.push('O número de suítes é obrigatório.');
            if (currentData.banheiros === undefined || currentData.banheiros < 0) errors.push('O número de banheiros é obrigatório.');
            if (currentData.vagas_garagem === undefined || currentData.vagas_garagem < 0) errors.push('O número de vagas de garagem é obrigatório.');
            if (currentData.area_privativa_m2 === undefined || currentData.area_privativa_m2 <= 0) errors.push('A área privativa é obrigatória.');
            if (!currentData.condicao) errors.push('A condição do imóvel é obrigatória.');
            break;
        case 11:
            if (!currentData.status_aprovacao) errors.push('O status de aprovação é obrigatório.');
            break;
    }

    return errors;
};

/**
 * Valida todos os passos do formulário de imóvel.
 * @param currentData Dados do formulário.
 * @returns Lista de erros de todos os passos.
 */
export const validateAllImovelSteps = (currentData: ImovelInput): string[] => {
    let allErrors: string[] = [];
    for (let i = 1; i <= TOTAL_STEPS; i++) {
        const stepErrors = validateImovelStep(currentData, i);
        if (stepErrors.length > 0) {
            allErrors.push(`Erro no Passo ${i}: ${stepErrors.join('; ')}`);
        }
    }
    return allErrors;
};
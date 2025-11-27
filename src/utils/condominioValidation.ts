import { CondominioInput } from '../../types';

const TOTAL_STEPS = 11;

/**
 * Valida os campos obrigatórios para um passo específico do cadastro de condomínio.
 * @param currentData Dados do formulário.
 * @param currentStep Passo a ser validado (1 a 11).
 * @returns Lista de erros encontrados.
 */
export const validateCondominioStep = (currentData: CondominioInput, currentStep: number): string[] => {
    let errors: string[] = [];

    switch (currentStep) {
        case 1: // Dados do condomínio
            if (!currentData.nome) errors.push('O nome do condomínio é obrigatório.');
            if (currentData.area_terreno_m2 <= 0) errors.push('A área do terreno é obrigatória.');
            if (currentData.ano_termino > new Date().getFullYear() + 10 || currentData.ano_termino < 1900) errors.push('O ano de término parece inválido.');
            break;
        case 2: // Localização
            if (!currentData.cep || currentData.cep.replace(/\D/g, '').length !== 8) errors.push('O CEP é obrigatório e deve ter 8 dígitos.');
            if (!currentData.cidade) errors.push('A cidade é obrigatória.');
            if (!currentData.estado) errors.push('O estado é obrigatório.');
            if (!currentData.endereco) errors.push('O endereço é obrigatório.');
            if (!currentData.numero) errors.push('O número é obrigatório.');
            break;
        case 3: // Características
            if (currentData.caracteristicas_ids.length === 0) errors.push('Selecione pelo menos uma característica.');
            break;
        case 4: // Descrição
            if (!currentData.descricao || currentData.descricao.length < 50) errors.push('A descrição é obrigatória e deve ter pelo menos 50 caracteres.');
            break;
        case 5: // Website
            if (currentData.website_url && !currentData.website_url.startsWith('http')) errors.push('A URL do website deve começar com http:// ou https://');
            if (!currentData.slug) errors.push('O slug é obrigatório.');
            break;
        case 8: // Andamento de obra
            if (!currentData.estagio) errors.push('O estágio da obra é obrigatório.');
            if (currentData.destaque_obra && !currentData.entrega_obra) errors.push('A data de entrega é obrigatória se a obra estiver em destaque.');
            break;
        case 11: // Anexar ao caso lançamento
            if (currentData.vincular_lancamento && !currentData.lancamento_id) errors.push('Selecione um lançamento para vincular.');
            break;
    }

    return errors;
};

/**
 * Valida todos os passos do formulário de condomínio.
 * @param currentData Dados do formulário.
 * @returns Lista de erros de todos os passos.
 */
export const validateAllCondominioSteps = (currentData: CondominioInput): string[] => {
    let allErrors: string[] = [];
    for (let i = 1; i <= TOTAL_STEPS; i++) {
        const stepErrors = validateCondominioStep(currentData, i);
        if (stepErrors.length > 0) {
            allErrors.push(`Erro no Passo ${i}: ${stepErrors.join('; ')}`);
        }
    }
    return allErrors;
};
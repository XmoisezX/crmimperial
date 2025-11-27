import React, { useState, useEffect } from 'react';
import { SimulationInput } from '../types';
import NumberInput from './NumberInput';
import TextInput from './TextInput';
import CollapsibleCard from './CollapsibleCard';
import { useAuth } from '../contexts/AuthContext';
import { initialSimulationInputs, INSS_PRO_LABORE_COST } from '../../constants';

interface SidebarProps {
    inputs: SimulationInput;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onLoadSimulation: (inputs: SimulationInput) => void;
}

interface SavedSimulation {
    id: string;
    name: string;
    inputs: SimulationInput;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const Sidebar: React.FC<SidebarProps> = ({ inputs, onInputChange, onLoadSimulation }) => {
    const { supabase, session } = useAuth();
    const [savedSimulations, setSavedSimulations] = useState<SavedSimulation[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [simulationName, setSimulationName] = useState('');
    const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');

    const fetchSimulations = async () => {
        if (!session) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('simulations')
            .select('id, name, inputs')
            .eq('user_id', session.user.id)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching simulations:', error);
            alert('Não foi possível carregar as simulações salvas.');
        } else {
            setSavedSimulations(data as SavedSimulation[]);
            // Ensure state consistency if the current ID is no longer valid
            if (currentSimulationId && !data.some(sim => sim.id === currentSimulationId)) {
                 setCurrentSimulationId(null);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (session) {
            fetchSimulations();
        }
    }, [session]);

    const handleSaveNew = async () => {
        if (!simulationName.trim()) {
            alert("Por favor, digite um nome para a simulação antes de salvar.");
            return;
        }
        if (session) {
            // Check if a simulation with this name already exists
            const existingSim = savedSimulations.find(sim => sim.name.trim() === simulationName.trim());
            
            if (existingSim) {
                alert(`Já existe uma simulação chamada "${simulationName}". Use o botão 'Atualizar' na lista de simulações para sobrescrever ou mude o nome.`);
                return;
            }

            const { error, data } = await supabase.from('simulations').insert({
                user_id: session.user.id,
                name: simulationName.trim(),
                inputs: inputs,
            }).select('id').single();

            if (error) {
                console.error('Error saving simulation:', error);
                alert('Erro ao salvar a simulação.');
            } else {
                alert('Simulação salva com sucesso!');
                // Set the newly created ID as current to enable immediate update mode
                setCurrentSimulationId(data.id);
                fetchSimulations();
            }
        }
    };
    
    const handleUpdate = async (id: string) => {
        if (!simulationName.trim()) {
             alert("O nome da simulação não pode estar vazio.");
            return;
        }
        
        if (session) {
            const { error } = await supabase
                .from('simulations')
                .update({ inputs: inputs, name: simulationName.trim() })
                .match({ id: id, user_id: session.user.id });

            if (error) {
                console.error('Error updating simulation:', error);
                alert('Erro ao atualizar a simulação.');
            } else {
                alert(`Simulação "${simulationName}" atualizada com sucesso!`);
                fetchSimulations();
            }
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Tem certeza que deseja excluir esta simulação?")) {
            const { error } = await supabase.from('simulations').delete().match({ id });
            if (error) {
                alert('Erro ao excluir a simulação.');
            } else {
                alert('Simulação excluída.');
                if (currentSimulationId === id) {
                    setCurrentSimulationId(null);
                    setSimulationName('');
                    onLoadSimulation(initialSimulationInputs);
                }
                fetchSimulations();
            }
        }
    };
    
    const handleLoad = (sim: SavedSimulation) => {
        onLoadSimulation(sim.inputs);
        setSimulationName(sim.name);
        setCurrentSimulationId(sim.id);
    };

    const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSimulationName(e.target.value);
    };
    
    const startRename = (sim: SavedSimulation) => {
        setEditingId(sim.id);
        setEditingName(sim.name);
    };

    const handleRename = async (id: string) => {
        const newName = editingName.trim();
        if (!newName) {
            alert("O nome da simulação não pode estar vazio.");
            return;
        }
        
        if (session) {
            const { error } = await supabase
                .from('simulations')
                .update({ name: newName })
                .match({ id: id, user_id: session.user.id });

            if (error) {
                console.error('Error renaming simulation:', error);
                alert('Erro ao renomear a simulação.');
            } else {
                // If the renamed simulation is the currently loaded one, update the main input name state
                if (currentSimulationId === id) {
                    setSimulationName(newName);
                }
                setEditingId(null);
                fetchSimulations(); // Refresh the list
            }
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, id: string) => {
        if (e.key === 'Enter') {
            handleRename(id);
        } else if (e.key === 'Escape') {
            setEditingId(null);
        }
    };

    return (
        <aside className="w-full lg:w-[420px] lg:flex-shrink-0 bg-white p-6 border-r border-gray-200 overflow-y-auto lg:h-[calc(100vh-88px)] lg:sticky top-[88px]">
            <div className="space-y-4 mb-6">
                 <h2 className="text-xl font-bold text-dark-text">Parâmetros</h2>
                 <TextInput 
                    label="Nome da Simulação"
                    id="simulationName"
                    value={simulationName}
                    onChange={handleNameChange}
                    placeholder="Ex: Cenário Otimista"
                />
                <div className="flex space-x-2">
                    <button
                        onClick={handleSaveNew}
                        className="w-full px-4 py-2 text-sm font-medium text-white bg-primary-orange rounded-md hover:bg-secondary-orange transition-colors"
                        title="Salvar a simulação atual como um novo registro."
                    >
                        Salvar Nova Simulação
                    </button>
                </div>
                {currentSimulationId && (
                    <button
                        onClick={() => {
                            setCurrentSimulationId(null);
                            setSimulationName('');
                            onLoadSimulation(initialSimulationInputs); // Reset inputs to default
                        }}
                        className="w-full text-sm text-gray-500 hover:text-gray-700 underline mt-2"
                    >
                        Limpar Seleção
                    </button>
                )}
            </div>
            
            {/* Simulações Salvas movidas para cima */}
            <div className="space-y-4 mb-6">
                <CollapsibleCard title="Simulações Salvas" isOpenDefault>
                    {isLoading ? <p>Carregando...</p> : (
                        <div className="space-y-2">
                            {savedSimulations.length > 0 ? savedSimulations.map(sim => (
                                <div key={sim.id} className={`flex justify-between items-center p-2 rounded-md transition-colors ${currentSimulationId === sim.id ? 'bg-blue-100 border border-blue-300' : 'hover:bg-gray-100'}`}>
                                    {editingId === sim.id ? (
                                        <TextInput
                                            label=""
                                            id={`rename-${sim.id}`}
                                            value={editingName}
                                            onChange={(e) => setEditingName(e.target.value)}
                                            onBlur={() => handleRename(sim.id)}
                                            onKeyDown={(e) => handleKeyDown(e, sim.id)}
                                            className="flex-1 min-w-0 mr-2"
                                            autoFocus
                                        />
                                    ) : (
                                        <button 
                                            onClick={() => handleLoad(sim)} 
                                            onDoubleClick={() => startRename(sim)}
                                            className="text-left text-blue-600 hover:underline font-medium flex-1 min-w-0 truncate pr-2"
                                            title="Clique para carregar. Duplo clique para renomear."
                                        >
                                            {sim.name} {currentSimulationId === sim.id && '(Atual)'}
                                        </button>
                                    )}
                                    <div className="flex space-x-2 items-center">
                                        {currentSimulationId === sim.id && (
                                            <button
                                                onClick={() => handleUpdate(sim.id)}
                                                className="px-3 py-1 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                                                title={`Atualizar a simulação "${sim.name}" com os dados atuais.`}
                                            >
                                                Atualizar
                                            </button>
                                        )}
                                        <button onClick={() => handleDelete(sim.id)} className="text-red-500 hover:text-red-700 text-xs px-2 py-1">
                                            Excluir
                                        </button>
                                    </div>
                                </div>
                            )) : <p className="text-sm text-gray-500">Nenhuma simulação salva.</p>}
                        </div>
                    )}
                </CollapsibleCard>
            </div>

            <div className="space-y-4">
                <CollapsibleCard title="Premissas Financeiras">
                    <TextInput 
                        label="Data de Início da Simulação" 
                        id="startDate" 
                        type="date"
                        value={inputs.startDate} 
                        onChange={onInputChange} 
                        title="A data de início define o mês 1 para a comparação Real vs. Projetado." 
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Valor Médio Venda" id="avgSaleValue" value={inputs.avgSaleValue} onChange={onInputChange} step={10000} placeholder="300000" title="Valor médio estimado de cada venda. Principal fator para o faturamento de vendas." isCurrency />
                        <NumberInput label="Valor Médio Aluguel" id="avgRentalValue" value={inputs.avgRentalValue} onChange={onInputChange} step={100} placeholder="2500" title="Valor do primeiro aluguel (comissão) e base para o cálculo da administração mensal." isCurrency />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Média Reg./Mês" id="avgRegularizationsPerMonth" value={inputs.avgRegularizationsPerMonth} onChange={onInputChange} step={1} placeholder="1" title="Média de regularizações de imóveis por mês." />
                        <NumberInput label="Valor Médio Reg." id="avgRegularizationValue" value={inputs.avgRegularizationValue} onChange={onInputChange} step={500} placeholder="3000" title="Valor médio cobrado por cada regularização de imóvel." isCurrency />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Alíquota SN (%)" id="taxRate" value={inputs.taxRate} onChange={onInputChange} step={0.1} placeholder="6" title="Alíquota percentual do Simples Nacional que incide sobre o Faturamento Bruto Total." />
                        <NumberInput label="Outros Custos Var. (%)" id="outrosCustosVarPercentFatBruto" value={inputs.outrosCustosVarPercentFatBruto} onChange={onInputChange} step={0.5} placeholder="1" title="Percentual de outros custos variáveis que incidem sobre o Faturamento Bruto Total (ex: taxas de portal, etc)." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Mês Pagto. Imóvel 1" id="propertyPayment1Month" value={inputs.propertyPayment1Month} onChange={onInputChange} min={1} max={12} title="Mês (1 a 12) em que o primeiro pagamento de imóvel será realizado." />
                        <NumberInput label="Valor Pagto. 1" id="propertyPayment1Amount" value={inputs.propertyPayment1Amount} onChange={onInputChange} step={1000} title="Custo do primeiro imóvel a ser pago, impactando o fluxo de caixa no mês correspondente." isCurrency />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Mês Pagto. Imóvel 2" id="propertyPayment2Month" value={inputs.propertyPayment2Month} onChange={onInputChange} min={1} max={12} title="Mês (1 a 12) em que o segundo pagamento de imóvel será realizado." />
                        <NumberInput label="Valor Pagto. 2" id="propertyPayment2Amount" value={inputs.propertyPayment2Amount} onChange={onInputChange} step={1000} title="Custo do segundo imóvel a ser pago, base para o cálculo da correção." isCurrency />
                    </div>
                    {/* NOVO CAMPO: Pagamento de Reforma */}
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Mês Pagto. Reforma" id="propertyPayment3Month" value={inputs.propertyPayment3Month} onChange={onInputChange} min={1} max={12} title="Mês (1 a 12) em que o pagamento da reforma será realizado." />
                        <NumberInput label="Valor Pagto. Reforma" id="propertyPayment3Amount" value={inputs.propertyPayment3Amount} onChange={onInputChange} step={1000} title="Custo da reforma, impactando o fluxo de caixa no mês correspondente." isCurrency />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Caixa Inicial" id="initialCash" value={inputs.initialCash} onChange={onInputChange} step={1000} placeholder="Valor inicial" title="Valor inicial em caixa no começo do primeiro mês da simulação." isCurrency />
                         <NumberInput label="SELIC Estimada Anual (%)" id="taxaSelicEstimadaAnual" value={inputs.taxaSelicEstimadaAnual} onChange={onInputChange} step={0.5} placeholder="10" title="Taxa SELIC anual estimada para corrigir o valor do segundo pagamento do imóvel." />
                    </div>
                     <NumberInput label="Custo Setup Inicial" id="custoSetupInicial" value={inputs.custoSetupInicial} onChange={onInputChange} step={500} title="Custo único no primeiro mês para montagem do negócio (móveis, computadores, etc)." isCurrency />
                </CollapsibleCard>

                <CollapsibleCard title="Custos e Estrutura">
                    <h3 className="text-md font-semibold text-light-text mb-2">Custos Fixos Mensais</h3>
                     <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Aluguel/Condomínio" id="custoAluguelCondominio" value={inputs.custoAluguelCondominio} onChange={onInputChange} step={100} title="Custo mensal com aluguel e condomínio do escritório." isCurrency />
                        <NumberInput label="Salário Admin." id="salarioAdministrativo" value={inputs.salarioAdministrativo} onChange={onInputChange} step={100} title="Custo mensal com salários da equipe administrativa." isCurrency />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Contabilidade" id="custoContabilidade" value={inputs.custoContabilidade} onChange={onInputChange} step={10} title="Custo mensal com serviços de contabilidade." isCurrency />
                        <NumberInput label="CRM e Sistemas" id="custoCRM" value={inputs.custoCRM} onChange={onInputChange} step={10} title="Custo mensal com software de CRM e outras ferramentas." isCurrency />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Internet e Tel." id="custoInternetTel" value={inputs.custoInternetTel} onChange={onInputChange} step={10} title="Custo mensal com serviços de internet e telefonia." isCurrency />
                        <NumberInput label="Água e Luz" id="custoAguaLuz" value={inputs.custoAguaLuz} onChange={onInputChange} step={10} title="Custo mensal com contas de água e eletricidade." isCurrency />
                    </div>
                     <NumberInput label="Outros Custos Fixos" id="custoOutrosFixos" value={inputs.custoOutrosFixos} onChange={onInputChange} step={10} title="Outros custos fixos mensais não listados acima." isCurrency />
                    
                    <h3 className="text-md font-semibold text-light-text border-t pt-4 mt-2">Pró-Labore Sócios</h3>
                    <NumberInput label="Mês Início Pró-Labore" id="proLaboreStartMonth" value={inputs.proLaboreStartMonth} onChange={onInputChange} min={1} max={12} title="Mês em que o pagamento do pró-labore para os sócios começará." />
                    <div className="grid grid-cols-3 gap-2 mt-2">
                        <NumberInput label="Alessandro" id="proLaboreAlessandro" value={inputs.proLaboreAlessandro} onChange={onInputChange} step={100} title="Valor do pró-labore mensal para Alessandro Gomes." isCurrency />
                        <NumberInput label="Tamires" id="proLaboreTamires" value={inputs.proLaboreTamires} onChange={onInputChange} step={100} title="Valor do pró-labore mensal para Tamires Torres." isCurrency />
                        <NumberInput label="Moisez" id="proLaboreMoisez" value={inputs.proLaboreMoisez} onChange={onInputChange} step={100} title="Valor do pró-labore mensal para Moisez Torres." isCurrency />
                    </div>
                    
                    {/* Novo campo fixo para INSS */}
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-200 mt-4">
                        <label className="block text-sm font-medium text-light-text mb-1">
                            INSS Pró-Labore (11% sobre R$ 2.000 x 3)
                        </label>
                        <p className="text-base font-semibold text-dark-text">
                            {formatCurrency(INSS_PRO_LABORE_COST)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                            Custo fixo mensal de INSS patronal, aplicado a partir do Mês de Início do Pró-Labore.
                        </p>
                    </div>

                    <h3 className="text-md font-semibold text-light-text border-t pt-4 mt-2">Marketing e Expansão</h3>
                    <div className="grid grid-cols-2 gap-4">
                         <NumberInput label="Invest. Mkt Base" id="marketingBaseCost" value={inputs.marketingBaseCost} onChange={onInputChange} step={100} placeholder="Facebook Ads" title="Investimento mensal fixo em marketing durante os meses iniciais (antes da expansão)." isCurrency />
                         <NumberInput label="Invest. Mkt Expandido" id="marketingExpandedCost" value={inputs.marketingExpandedCost} onChange={onInputChange} step={500} placeholder="Tráfego Pago" title="Investimento mensal em marketing após o início do plano de expansão." isCurrency />
                    </div>
                     <NumberInput label="Mês Início Expansão" id="expansionStartMonth" value={inputs.expansionStartMonth} onChange={onInputChange} min={1} max={12} title="Mês em que os custos de expansão (marketing, estagiários, etc.) começam a ser aplicados." />
                    <div className="grid grid-cols-2 gap-4">
                       <NumberInput label="Nº Estagiários" id="numberOfInterns" value={inputs.numberOfInterns} onChange={onInputChange} min={0} title="Quantidade de estagiários contratados a partir do mês de expansão." />
                       <NumberInput label="Custo/Estagiário" id="internCost" value={inputs.internCost} onChange={onInputChange} step={100} title="Custo mensal por cada estagiário contratado." isCurrency />
                    </div>
                    <NumberInput label="Nº Corretores Externos" id="numberOfBrokers" value={inputs.numberOfBrokers} onChange={onInputChange} min={0} title="Quantidade de corretores externos que começam a atuar a partir do mês de expansão." />
                </CollapsibleCard>

                <CollapsibleCard title="Metas e Comissões">
                    <h3 className="text-md font-semibold text-light-text mb-2">Metas Mensais</h3>
                    <NumberInput label="Nº Meses de Início Lento" id="slowStartMonths" value={inputs.slowStartMonths} onChange={onInputChange} min={0} max={11} placeholder="Meta reduzida" title="Número de meses iniciais com metas de vendas e aluguéis reduzidas para a equipe." />
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Vendas/Sócios (Lento)" id="salesTargetPartnersSlow" value={inputs.salesTargetPartnersSlow} onChange={onInputChange} min={0} placeholder="Unid." title="Meta mensal de vendas por sócio durante os meses de início lento." />
                        <NumberInput label="Aluguéis Totais (Lento)" id="rentalsTargetSlow" value={inputs.rentalsTargetSlow} onChange={onInputChange} min={0} placeholder="Unid." title="Meta mensal de novos contratos de aluguel (total da equipe) durante os meses de início lento." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Vendas/Sócios (Pós)" id="salesTargetPartnersFull" value={inputs.salesTargetPartnersFull} onChange={onInputChange} min={0} placeholder="Unid." title="Meta mensal de vendas por sócio após o período de início lento." />
                        <NumberInput label="Aluguéis Totais (Pós)" id="rentalsTargetFull" value={inputs.rentalsTargetFull} onChange={onInputChange} min={0} placeholder="Unid." title="Meta mensal de novos contratos de aluguel (total da equipe) após o período de início lento." />
                    </div>
                     <h3 className="text-md font-semibold text-light-text border-t pt-4 mt-2">Metas e Rampa Corretores (Pós)</h3>
                     <NumberInput label="Média Vendas/Mês (Corretor)" id="salesTargetBrokersFull" value={inputs.salesTargetBrokersFull} onChange={onInputChange} min={0} placeholder="Unid." title="Defina a meta média de vendas que cada corretor externo deve atingir por mês após o período de rampa inicial." />
                     <div className="grid grid-cols-3 gap-2">
                         <NumberInput label="Rampa M1 (%)" id="percRampaMes1" value={inputs.percRampaMes1} onChange={onInputChange} min={0} max={200} step={10} title="Percentual da meta total de corretores a ser atingida no primeiro mês de expansão." />
                         <NumberInput label="Rampa M2 (%)" id="percRampaMes2" value={inputs.percRampaMes2} onChange={onInputChange} min={0} max={200} step={10} title="Percentual da meta total de corretores a ser atingida no segundo mês de expansão." />
                         <NumberInput label="Rampa M3+ (%)" id="percRampaMes3" value={inputs.percRampaMes3} onChange={onInputChange} min={0} max={200} step={10} title="Percentual da meta total de corretores a ser atingida do terceiro mês de expansão em diante." />
                     </div>

                    <h3 className="text-md font-semibold text-light-text border-t pt-4 mt-2">Comissões (%)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Venda Bruta Empresa" id="commissionRateSale" value={inputs.commissionRateSale} onChange={onInputChange} step={0.5} title="Percentual bruto que a imobiliária recebe sobre o valor de cada venda." />
                        <NumberInput label="Variável Sócios (Venda)" id="partnerCommissionVarSale" value={inputs.partnerCommissionVarSale} onChange={onInputChange} step={1} title="Percentual da comissão bruta da venda que é pago como comissão variável aos sócios." />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                         <NumberInput label="Corretor Venda" id="brokerCommissionSale" value={inputs.brokerCommissionSale} onChange={onInputChange} step={0.1} title="Comissão do corretor que realizou a venda, calculada como um % sobre o Valor de Venda (VV)." />
                         <NumberInput label="Corretor Agenc." id="brokerCommissionListing" value={inputs.brokerCommissionListing} onChange={onInputChange} step={0.1} title="Comissão do corretor que agenciou o imóvel, calculada como um % sobre o Valor de Venda (VV)." />
                         <NumberInput label="Ag. Interno (%)" id="brokerInternalListingRatio" value={inputs.brokerInternalListingRatio} onChange={onInputChange} step={5} title="Percentual de vendas feitas por corretores externos que foram agenciadas internamente pela imobiliária." />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Admin. Aluguel" id="commissionRateRentalAdmin" value={inputs.commissionRateRentalAdmin} onChange={onInputChange} step={0.5} title="Percentual mensal cobrado sobre o valor do aluguel para administração do contrato." />
                        <NumberInput label="Var. Sócios (1º Alug.)" id="partnerCommissionVarRental1st" value={inputs.partnerCommissionVarRental1st} onChange={onInputChange} step={1} title="Percentual do primeiro aluguel que é pago como comissão variável aos sócios." />
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Var. Corr. (1º Alug.)" id="brokerCommissionRental1stPercent" value={inputs.brokerCommissionRental1stPercent} onChange={onInputChange} step={1} title="Comissão paga a corretores sobre novos aluguéis (se aplicável)." />
                        <NumberInput label="Var. Corr. (Admin.)" id="brokerCommissionRentalAdminPercent" value={inputs.brokerCommissionRentalAdminPercent} onChange={onInputChange} step={0.5} title="Comissão paga a corretores sobre a administração de aluguéis (se aplicável)." />
                    </div>
                    
                    <h3 className="text-md font-semibold text-light-text border-t pt-4 mt-2">Comissões Estagiários (Aluguel)</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <NumberInput label="Comissão Estag. (1º Alug. %)" id="internCommissionRental1stPercent" value={inputs.internCommissionRental1stPercent} onChange={onInputChange} step={1} title="Comissão paga aos estagiários sobre o valor do primeiro aluguel (em %)." />
                        <NumberInput label="Proporção Alug. Estag. (%)" id="internRentalRatio" value={inputs.internRentalRatio} onChange={onInputChange} step={5} title="Percentual dos novos contratos de aluguel que são atribuídos aos estagiários." />
                    </div>
                </CollapsibleCard>
            </div>
        </aside>
    );
};

export default Sidebar;
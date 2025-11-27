import React from 'react';
import { TrendingUp, User, Home, DollarSign, Calendar, Edit, FileText, Clock, CheckCircle, XCircle } from 'lucide-react';
import { Button } from './ui/Button';
import { Opportunity, OpportunityStage } from './NewOpportunityModal';
import { Link } from 'react-router-dom';

interface OpportunityCardProps {
    opportunity: Opportunity;
    onEdit: (opportunity: Opportunity) => void;
    onAddActivity: (opportunity: Opportunity) => void;
    onGenerateProposal: (opportunity: Opportunity) => void;
    // Para drag-and-drop (mock)
    onDragStart: (e: React.DragEvent, opportunityId: string) => void;
}

const formatCurrency = (value: number | null) => 
    value ? value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'N/A';

const OpportunityCard: React.FC<OpportunityCardProps> = ({ 
    opportunity, 
    onEdit, 
    onAddActivity, 
    onGenerateProposal,
    onDragStart,
}) => {
    const clientName = opportunity.clientes?.nome || 'Cliente Desconhecido';
    const imovelInfo = opportunity.imoveis 
        ? `${opportunity.imoveis.codigo} - ${opportunity.imoveis.logradouro}, ${opportunity.imoveis.numero} (${opportunity.imoveis.bairro})`
        : 'Imóvel não associado';

    return (
        <div 
            className="bg-white rounded-lg shadow-md p-4 mb-4 border border-gray-200 cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={(e) => onDragStart(e, opportunity.id!)}
        >
            <div className="flex justify-between items-start mb-2">
                <h3 className="font-semibold text-dark-text text-base flex items-center">
                    <TrendingUp className="w-4 h-4 mr-2 text-primary-orange" /> {opportunity.nome}
                </h3>
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => onEdit(opportunity)}
                    className="p-1 h-auto text-gray-500 hover:text-blue-600"
                    title="Editar Oportunidade"
                >
                    <Edit className="w-4 h-4" />
                </Button>
            </div>
            
            <div className="text-sm text-light-text space-y-1">
                <p className="flex items-center"><User className="w-4 h-4 mr-2 text-gray-400" /> {clientName}</p>
                <p className="flex items-center"><Home className="w-4 h-4 mr-2 text-gray-400" /> {imovelInfo}</p>
                <p className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-gray-400" /> {formatCurrency(opportunity.valor_estimado)}</p>
                {opportunity.data_fechamento_estimada && (
                    <p className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-gray-400" /> Fechamento: {new Date(opportunity.data_fechamento_estimada).toLocaleDateString('pt-BR')}</p>
                )}
            </div>

            <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
                <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onAddActivity(opportunity)}
                    className="text-blue-600 border-blue-600 hover:bg-blue-50"
                    title="Adicionar Atividade"
                >
                    <Clock className="w-4 h-4 mr-1" /> Atividade
                </Button>
                {opportunity.imovel_id && opportunity.cliente_id && (
                    <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => onGenerateProposal(opportunity)}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                        title="Gerar Proposta"
                    >
                        <FileText className="w-4 h-4 mr-1" /> Proposta
                    </Button>
                )}
            </div>
        </div>
    );
};

export default OpportunityCard;
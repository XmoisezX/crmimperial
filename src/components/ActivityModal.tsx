import React, { useState, useCallback, useEffect } from 'react';
import { X, Save, Loader2, Clock, Calendar, MessageSquare, Phone, Mail, Users, Edit } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import { Opportunity } from './NewOpportunityModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Label } from './ui/Label';
import { RadioGroup, RadioGroupItem } from './ui/RadioGroup';

export type ActivityType = 'Ligar' | 'Enviar E-mail' | 'Agendar Visita' | 'Reunião' | 'Outro';
export type ActivityStatus = 'Pendente' | 'Concluída' | 'Cancelada';

export interface Activity {
    id?: string;
    oportunidade_id: string;
    tipo: ActivityType;
    descricao: string | null;
    data_agendamento: string; // ISO string
    data_conclusao: string | null; // ISO string
    status: ActivityStatus;
}

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    opportunity: Opportunity;
    onSaveSuccess: () => void;
    initialActivity?: Activity | null; // Para edição de atividade existente
}

const activityTypes: { type: ActivityType, icon: React.ReactNode }[] = [
    { type: 'Ligar', icon: <Phone className="w-4 h-4" /> },
    { type: 'Enviar E-mail', icon: <Mail className="w-4 h-4" /> },
    { type: 'Agendar Visita', icon: <Users className="w-4 h-4" /> },
    { type: 'Reunião', icon: <Calendar className="w-4 h-4" /> },
    { type: 'Outro', icon: <MessageSquare className="w-4 h-4" /> },
];

const activityStatuses: ActivityStatus[] = ['Pendente', 'Concluída', 'Cancelada'];

const ActivityModal: React.FC<ActivityModalProps> = ({ isOpen, onClose, opportunity, onSaveSuccess, initialActivity }) => {
    const { session } = useAuth();
    const [formData, setFormData] = useState<Activity>(() => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Ajusta para fuso horário local
        return initialActivity || {
            oportunidade_id: opportunity.id!,
            tipo: 'Ligar',
            descricao: null,
            data_agendamento: now.toISOString().slice(0, 16), // YYYY-MM-DDTHH:MM
            data_conclusao: null,
            status: 'Pendente',
        };
    });
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [isLoadingActivities, setIsLoadingActivities] = useState(true);

    const fetchActivities = useCallback(async () => {
        if (!session || !opportunity.id) return;
        setIsLoadingActivities(true);
        const { data, error } = await supabase
            .from('atividades')
            .select(`
                id, tipo, descricao, data_agendamento, status,
                oportunidades:oportunidade_id(nome)
            `)
            .eq('oportunidade_id', opportunity.id)
            .eq('user_id', session.user.id)
            .order('data_agendamento', { ascending: false });

        if (error) {
            console.error('Erro ao buscar atividades:', error);
            setError('Não foi possível carregar as atividades.');
        } else {
            setActivities(data as Activity[]);
        }
        setIsLoadingActivities(false);
    }, [session, opportunity.id]);

    useEffect(() => {
        if (isOpen) {
            fetchActivities();
            // Reset form for new activity if not editing
            if (!initialActivity) {
                const now = new Date();
                now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
                setFormData({
                    oportunidade_id: opportunity.id!,
                    tipo: 'Ligar',
                    descricao: null,
                    data_agendamento: now.toISOString().slice(0, 16),
                    data_conclusao: null,
                    status: 'Pendente',
                });
            } else {
                setFormData(initialActivity);
            }
            setError(null);
        }
    }, [isOpen, initialActivity, opportunity.id, fetchActivities]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
        setError(null);
    };
    
    const handleTypeChange = (value: ActivityType) => {
        setFormData(prev => ({ ...prev, tipo: value }));
        setError(null);
    };

    const handleStatusChange = (value: ActivityStatus) => {
        setFormData(prev => ({ 
            ...prev, 
            status: value,
            data_conclusao: value === 'Concluída' ? new Date().toISOString() : null,
        }));
        setError(null);
    };

    const validate = () => {
        const errors: string[] = [];
        if (!formData.tipo) errors.push('O tipo da atividade é obrigatório.');
        if (!formData.data_agendamento) errors.push('A data e hora de agendamento são obrigatórias.');
        
        if (errors.length > 0) {
            setError(errors.join(' '));
            return false;
        }
        setError(null);
        return true;
    };

    const handleSave = useCallback(async () => {
        if (!session || !validate()) return;

        setIsSaving(true);
        
        const dataToSave = {
            user_id: session.user.id,
            oportunidade_id: opportunity.id!,
            tipo: formData.tipo,
            descricao: formData.descricao?.trim() || null,
            data_agendamento: formData.data_agendamento,
            data_conclusao: formData.data_conclusao,
            status: formData.status,
        };

        let result;
        if (formData.id) {
            result = await supabase
                .from('atividades')
                .update(dataToSave)
                .eq('id', formData.id)
                .select('id')
                .single();
        } else {
            result = await supabase
                .from('atividades')
                .insert(dataToSave)
                .select('id')
                .single();
        }

        setIsSaving(false);

        if (result.error) {
            console.error('Erro ao salvar atividade:', result.error);
            setError(`Erro ao salvar: ${result.error.message}`);
        } else {
            onSaveSuccess(); // Notifica o pai para recarregar oportunidades/dashboard
            fetchActivities(); // Recarrega a lista de atividades no modal
            // Reset form for new activity after saving
            const now = new Date();
            now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
            setFormData({
                oportunidade_id: opportunity.id!,
                tipo: 'Ligar',
                descricao: null,
                data_agendamento: now.toISOString().slice(0, 16),
                data_conclusao: null,
                status: 'Pendente',
            });
        }
    }, [session, formData, opportunity.id, onSaveSuccess, validate, fetchActivities]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-dark-text flex items-center">
                        <Clock className="w-5 h-5 mr-2" /> Atividades da Oportunidade
                    </h2>
                    <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-6 space-y-6">
                    <div className="p-3 bg-blue-50 rounded-md border border-blue-200">
                        <p className="text-sm font-semibold text-blue-800">Oportunidade: {opportunity.nome}</p>
                        <p className="text-xs text-blue-700">Cliente: {opportunity.clientes?.nome || 'N/A'}</p>
                    </div>

                    {error && <div className="p-3 bg-red-100 text-red-700 text-sm rounded-md">{error}</div>}
                    
                    {/* Formulário de Nova Atividade */}
                    <div className="border p-4 rounded-lg bg-gray-50 space-y-4">
                        <h3 className="text-lg font-semibold text-dark-text">Adicionar Nova Atividade</h3>
                        
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-light-text">Tipo de Atividade</Label>
                            <RadioGroup 
                                value={formData.tipo} 
                                onValueChange={(value: ActivityType) => handleTypeChange(value)}
                                className="flex flex-wrap gap-4"
                            >
                                {activityTypes.map(item => (
                                    <div key={item.type} className="flex items-center space-x-2">
                                        <RadioGroupItem value={item.type} id={item.type} />
                                        <Label htmlFor={item.type} className="flex items-center">
                                            {item.icon} <span className="ml-1">{item.type}</span>
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <TextInput 
                            label="Descrição" 
                            id="descricao" 
                            value={formData.descricao || ''} 
                            onChange={handleChange} 
                            placeholder="Detalhes da atividade"
                        />
                        
                        <TextInput 
                            label="Data e Hora de Agendamento" 
                            id="data_agendamento" 
                            type="datetime-local"
                            value={formData.data_agendamento.slice(0, 16)} // Garante formato YYYY-MM-DDTHH:MM
                            onChange={handleChange} 
                            required
                        />
                        
                        <div className="space-y-2">
                            <Label className="text-sm font-medium text-light-text">Status</Label>
                            <RadioGroup 
                                value={formData.status} 
                                onValueChange={(value: ActivityStatus) => handleStatusChange(value)}
                                className="flex flex-wrap gap-4"
                            >
                                {activityStatuses.map(status => (
                                    <div key={status} className="flex items-center space-x-2">
                                        <RadioGroupItem value={status} id={status} />
                                        <Label htmlFor={status}>{status}</Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-gray-200">
                            <Button onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Salvar Atividade
                            </Button>
                        </div>
                    </div>

                    {/* Lista de Atividades Existentes */}
                    <div className="space-y-3">
                        <h3 className="text-lg font-semibold text-dark-text">Histórico de Atividades ({activities.length})</h3>
                        {isLoadingActivities ? (
                            <div className="flex items-center justify-center py-4">
                                <Loader2 className="w-5 h-5 animate-spin text-blue-600 mr-2" />
                                <p className="text-gray-600">Carregando histórico...</p>
                            </div>
                        ) : activities.length === 0 ? (
                            <p className="text-sm text-gray-500">Nenhuma atividade registrada para esta oportunidade.</p>
                        ) : (
                            <div className="space-y-2">
                                {activities.map(activity => (
                                    <div key={activity.id} className="p-3 bg-white rounded-md border border-gray-200 flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold text-dark-text flex items-center">
                                                {activityTypes.find(t => t.type === activity.tipo)?.icon}
                                                <span className="ml-2">{activity.tipo}</span>
                                                <span className={`ml-3 px-2 py-0.5 text-xs rounded-full ${
                                                    activity.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                                                    activity.status === 'Concluída' ? 'bg-green-100 text-green-800' :
                                                    'bg-red-100 text-red-800'
                                                }`}>
                                                    {activity.status}
                                                </span>
                                            </p>
                                            <p className="text-sm text-light-text mt-1">{activity.descricao}</p>
                                            <p className="text-xs text-gray-500 mt-1">
                                                Agendado para: {new Date(activity.data_agendamento).toLocaleString('pt-BR')}
                                                {activity.data_conclusao && ` | Concluído em: ${new Date(activity.data_conclusao).toLocaleString('pt-BR')}`}
                                            </p>
                                        </div>
                                        <Button 
                                            variant="ghost" 
                                            size="sm" 
                                            onClick={() => setFormData(activity)} // Carrega para edição
                                            className="p-1 h-auto text-gray-500 hover:text-blue-600"
                                            title="Editar Atividade"
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer de Ações */}
                <div className="p-6 bg-gray-50 border-t border-gray-200 flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Fechar
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default ActivityModal;
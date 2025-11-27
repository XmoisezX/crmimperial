import React, { useState, useEffect, useCallback } from 'react';
import { Clock, Loader2, RefreshCw, AlertTriangle, Calendar, MessageSquare, Phone, Mail, Users, Plus, Edit } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { Card, CardContent } from '../components/ui/Card';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import ActivityModal, { Activity, ActivityType, ActivityStatus } from '../components/ActivityModal';
import { Link } from 'react-router-dom';

// Interface para os dados da atividade com join
interface ActivityListing extends Activity {
    oportunidades: { nome: string } | null;
}

const activityTypes: ActivityType[] = ['Ligar', 'Enviar E-mail', 'Agendar Visita', 'Reunião', 'Outro'];
const activityStatuses: ActivityStatus[] = ['Pendente', 'Concluída', 'Cancelada'];

const AtividadesPage: React.FC = () => {
    const { session } = useAuth();
    const [activities, setActivities] = useState<ActivityListing[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [filterStatus, setFilterStatus] = useState<ActivityStatus | ''>('Pendente');
    const [filterType, setFilterType] = useState<ActivityType | ''>('');
    
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
    
    // Mock de oportunidade para o modal de nova atividade (necessário para FK)
    const [mockOpportunity, setMockOpportunity] = useState<{ id: string, nome: string, cliente_id: string } | null>(null);

    const fetchActivities = useCallback(async () => {
        if (!session) return;
        setIsLoading(true);
        setError(null);

        let query = supabase
            .from('atividades')
            .select(`
                id, tipo, descricao, data_agendamento, data_conclusao, status,
                oportunidades:oportunidade_id(id, nome)
            `)
            .eq('user_id', session.user.id)
            .order('data_agendamento', { ascending: true });
            
        if (filterStatus) {
            query = query.eq('status', filterStatus);
        }
        if (filterType) {
            query = query.eq('tipo', filterType);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Erro ao buscar atividades:', error);
            setError('Não foi possível carregar a lista de atividades.');
            setActivities([]);
        } else {
            setActivities(data as ActivityListing[]);
            
            // Se não houver mock, tenta usar a primeira oportunidade encontrada
            if (!mockOpportunity && data.length > 0 && data[0].oportunidades) {
                setMockOpportunity({
                    id: data[0].oportunidades.id,
                    nome: data[0].oportunidades.nome,
                    cliente_id: 'mock_client_id' // Cliente ID não é necessário aqui, mas é bom ter
                });
            }
        }
        setIsLoading(false);
    }, [session, filterStatus, filterType, mockOpportunity]);

    useEffect(() => {
        fetchActivities();
    }, [fetchActivities]);
    
    const getStatusBadge = (status: ActivityStatus) => {
        switch (status) {
            case 'Pendente': return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Pendente</Badge>;
            case 'Concluída': return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Concluída</Badge>;
            case 'Cancelada': return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Cancelada</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
        }
    };
    
    const getTypeIcon = (type: ActivityType) => {
        switch (type) {
            case 'Ligar': return <Phone className="w-4 h-4 mr-2 text-gray-400" />;
            case 'Enviar E-mail': return <Mail className="w-4 h-4 mr-2 text-gray-400" />;
            case 'Agendar Visita': return <Users className="w-4 h-4 mr-2 text-gray-400" />;
            case 'Reunião': return <Calendar className="w-4 h-4 mr-2 text-gray-400" />;
            case 'Outro': return <MessageSquare className="w-4 h-4 mr-2 text-gray-400" />;
            default: return <Clock className="w-4 h-4 mr-2 text-gray-400" />;
        }
    };
    
    const handleEditClick = (activity: ActivityListing) => {
        setEditingActivity(activity);
        setIsModalOpen(true);
    };
    
    const handleNewActivityClick = () => {
        if (!mockOpportunity) {
            alert('Não é possível criar uma atividade sem uma oportunidade associada. Crie uma oportunidade primeiro.');
            return;
        }
        setEditingActivity(null);
        setIsModalOpen(true);
    };
    
    const handleSaveSuccess = () => {
        fetchActivities();
        setIsModalOpen(false);
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold text-dark-text flex items-center">
                    <Calendar className="w-6 h-6 mr-2 text-blue-600" /> Gestão de Atividades ({activities.length})
                </h1>
                <div className="flex space-x-3">
                    <Button 
                        onClick={handleNewActivityClick}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        disabled={!mockOpportunity}
                    >
                        <Plus className="w-4 h-4 mr-2" /> Nova Atividade
                    </Button>
                    <Button 
                        variant="outline" 
                        className="text-blue-600 border-blue-600 hover:bg-blue-50"
                        onClick={fetchActivities}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} /> 
                        Atualizar
                    </Button>
                </div>
            </div>
            
            {/* Filtros */}
            <div className="flex flex-wrap gap-4 mb-6 p-4 bg-white rounded-lg shadow-md border border-gray-200">
                <select 
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as ActivityStatus | '')}
                    className="p-2 border border-gray-300 rounded-md text-sm text-light-text"
                    disabled={isLoading}
                >
                    <option value="">Todos os Status</option>
                    {activityStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select 
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as ActivityType | '')}
                    className="p-2 border border-gray-300 rounded-md text-sm text-light-text"
                    disabled={isLoading}
                >
                    <option value="">Todos os Tipos</option>
                    {activityTypes.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
            </div>

            {error && (
                <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md mb-6 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" /> {error}
                </div>
            )}

            <Card className="shadow-lg">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[200px]">Oportunidade</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">Descrição</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agendamento</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-500">
                                            <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                                            Carregando atividades...
                                        </td>
                                    </tr>
                                ) : activities.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-10 text-gray-500">
                                            Nenhuma atividade encontrada com os filtros aplicados.
                                        </td>
                                    </tr>
                                ) : (
                                    activities.map((activity) => (
                                        <tr key={activity.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text flex items-center">
                                                {getTypeIcon(activity.tipo)} {activity.tipo}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 hover:underline">
                                                <Link to={`/crm/oportunidades?id=${activity.oportunidade_id}`}>
                                                    {activity.oportunidades?.nome || 'Oportunidade N/A'}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-light-text max-w-xs truncate" title={activity.descricao || ''}>
                                                {activity.descricao || 'Sem descrição'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">
                                                {new Date(activity.data_agendamento).toLocaleString('pt-BR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {getStatusBadge(activity.status)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <Button 
                                                    size="sm" 
                                                    variant="outline"
                                                    className="text-blue-600 hover:bg-blue-50"
                                                    onClick={() => handleEditClick(activity)}
                                                >
                                                    <Edit className="w-4 h-4 mr-1" /> Editar
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            
            {isModalOpen && mockOpportunity && (
                <ActivityModal 
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    opportunity={mockOpportunity as any} // Passa o mock, pois o modal precisa de uma oportunidade
                    onSaveSuccess={handleSaveSuccess}
                    initialActivity={editingActivity}
                />
            )}
        </div>
    );
};

export default AtividadesPage;
import React from 'react';
import { X, Bed, Bath, Home, Maximize2, DollarSign, MapPin, Lock, Eye, FileText, Image, Edit } from 'lucide-react';
import { ImovelInput } from '../../types';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/Button';
import { useNavigate } from 'react-router-dom';

// Interface para o Imóvel (dados completos + mídias)
interface ImovelDetails extends ImovelInput {
    id: string;
    created_at: string;
    imagens_imovel: { id: string, url: string, legend: string, is_visible: boolean, rotation: number, ordem: number }[];
}

interface ImovelDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    imovel: ImovelDetails | null;
}

const formatCurrency = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const DetailSection: React.FC<{ title: string, children: React.ReactNode }> = ({ title, children }) => (
    <div className="border-b border-gray-100 pb-3 mb-3">
        <h3 className="text-lg font-semibold text-primary-orange mb-2">{title}</h3>
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-dark-text">
            {children}
        </div>
    </div>
);

const DetailItem: React.FC<{ label: string, value: string | number | boolean | null }> = ({ label, value }) => {
    let displayValue = value === null || value === undefined || value === '' ? 'N/A' : String(value);
    if (typeof value === 'boolean') {
        displayValue = value ? 'Sim' : 'Não';
    }
    return (
        <div className="flex justify-between">
            <span className="text-light-text">{label}:</span>
            <span className="font-medium text-right">{displayValue}</span>
        </div>
    );
};

const ImovelDetailsModal: React.FC<ImovelDetailsModalProps> = ({ isOpen, onClose, imovel }) => {
    const navigate = useNavigate();
    
    if (!isOpen || !imovel) return null;

    const { dados_contrato, dados_localizacao, dados_valores, dados_caracteristicas, dados_internos } = imovel;
    
    const handleEdit = () => {
        onClose();
        // Redireciona para a página de edição do imóvel, usando o ID como parâmetro de rota
        navigate(`/crm/imoveis/${imovel.id}`);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 flex justify-between items-center sticky top-0 bg-white z-10">
                    <h2 className="text-xl font-bold text-dark-text">Detalhes do Imóvel: {imovel.codigo}</h2>
                    <div className="flex space-x-3">
                        <Button 
                            onClick={handleEdit}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <Edit className="w-4 h-4 mr-2" /> Editar Cadastro
                        </Button>
                        <button onClick={onClose} className="text-gray-500 hover:text-gray-800 p-2 rounded-full hover:bg-gray-100">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                </div>
                
                <div className="p-6 space-y-6">
                    {/* Seção de Mídias */}
                    <div className="border p-4 rounded-lg bg-gray-50">
                        <h3 className="text-lg font-semibold text-primary-orange mb-3 flex items-center"><Image className="w-5 h-5 mr-2" /> Mídias ({imovel.imagens_imovel.length})</h3>
                        <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-64 overflow-y-auto p-2">
                            {imovel.imagens_imovel
                                .map((media, index) => (
                                <div key={media.id} className="relative h-24 w-full rounded-md overflow-hidden shadow-md border border-gray-200">
                                    <img 
                                        src={media.url} 
                                        alt={media.legend || `Imagem ${index + 1}`} 
                                        className="w-full h-full object-cover"
                                        style={{ transform: `rotate(${media.rotation}deg)` }}
                                    />
                                    {!media.is_visible && (
                                        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                                            <Eye className="w-6 h-6 text-white" />
                                        </div>
                                    )}
                                    <p className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white text-[10px] p-1 truncate">{media.legend || 'Sem legenda'}</p>
                                </div>
                            ))}
                            {imovel.imagens_imovel.length === 0 && <p className="text-sm text-light-text col-span-full">Nenhuma mídia cadastrada.</p>}
                        </div>
                    </div>

                    {/* Seção 1: Dados Principais */}
                    <DetailSection title="Dados Principais">
                        <DetailItem label="Tipo" value={imovel.tipo_imovel} />
                        <DetailItem label="Código" value={imovel.codigo} />
                        <DetailItem label="Status Aprovação" value={imovel.status_aprovacao} />
                        <DetailItem label="Data Cadastro" value={new Date(imovel.created_at).toLocaleDateString('pt-BR')} />
                    </DetailSection>

                    {/* Seção 2: Finalidades e Contrato */}
                    <DetailSection title="Finalidades e Contrato">
                        <DetailItem label="Venda Ativa" value={dados_contrato.venda_ativo} />
                        <DetailItem label="Disponibilidade Venda" value={dados_contrato.venda_disponibilidade} />
                        <DetailItem label="Locação Ativa" value={dados_contrato.locacao_ativo} />
                        <DetailItem label="Disponibilidade Locação" value={dados_contrato.locacao_disponibilidade} />
                        <DetailItem label="Temporada Ativa" value={dados_contrato.temporada_ativo} />
                        <DetailItem label="Disponibilidade Temporada" value={dados_contrato.temporada_disponibilidade} />
                    </DetailSection>

                    {/* Seção 3: Localização */}
                    <DetailSection title="Localização">
                        <DetailItem label="CEP" value={dados_localizacao.cep} />
                        <DetailItem label="Endereço" value={`${imovel.logradouro}, ${imovel.numero} - ${imovel.bairro}`} />
                        <DetailItem label="Cidade/Estado" value={`${dados_localizacao.cidade} - ${dados_localizacao.estado}`} />
                        <DetailItem label="Complemento" value={dados_localizacao.complemento} />
                        <DetailItem label="Andar" value={dados_localizacao.andar} />
                        <DetailItem label="Visibilidade Mapa" value={dados_localizacao.mapa_visibilidade} />
                    </DetailSection>

                    {/* Seção 4: Valores */}
                    <DetailSection title="Valores">
                        <DetailItem label="Valor Venda" value={formatCurrency(dados_valores.valor_venda)} />
                        <DetailItem label="Valor Locação" value={formatCurrency(dados_valores.valor_locacao)} />
                        <DetailItem label="Condomínio" value={formatCurrency(dados_valores.valor_condominio)} />
                        <DetailItem label="IPTU" value={formatCurrency(dados_valores.valor_iptu)} />
                        <DetailItem label="Financiável" value={dados_valores.financiavel} />
                        <DetailItem label="Índice Reajuste" value={dados_valores.indice_reajuste} />
                    </DetailSection>
                    
                    {/* Seção 5: Características */}
                    <DetailSection title="Características">
                        <DetailItem label="Dormitórios" value={dados_caracteristicas.dormitorios} />
                        <DetailItem label="Suítes" value={dados_caracteristicas.suites} />
                        <DetailItem label="Banheiros" value={dados_caracteristicas.banheiros} />
                        <DetailItem label="Vagas Garagem" value={dados_caracteristicas.vagas_garagem} />
                        <DetailItem label="Área Privativa (m²)" value={dados_caracteristicas.area_privativa_m2} />
                        <DetailItem label="Condição" value={dados_caracteristicas.condicao} />
                        <DetailItem label="Mobiliado" value={dados_caracteristicas.mobiliado} />
                        <DetailItem label="Ocupação" value={dados_internos.ocupacao} />
                        <DetailItem label="Exclusivo" value={dados_internos.exclusivo} />
                        <DetailItem label="Placa" value={dados_internos.placa} />
                        <div className="col-span-2">
                            <span className="text-light-text">Tipos de Piso:</span>
                            <span className="font-medium ml-2">{dados_caracteristicas.tipos_piso.join(', ') || 'N/A'}</span>
                        </div>
                    </DetailSection>
                    
                    {/* Seção 6: Dados Internos */}
                    <DetailSection title="Dados Internos">
                        <DetailItem label="Proprietário ID" value={dados_internos.proprietario_id} />
                        <DetailItem label="Agenciador ID" value={dados_internos.agenciador_id} />
                        <DetailItem label="Responsável ID" value={dados_internos.responsavel_id} />
                        <DetailItem label="Data Agenciamento" value={dados_internos.data_agenciamento} />
                        <div className="col-span-2">
                            <span className="text-light-text">Observações Internas:</span>
                            <p className="text-sm mt-1 p-2 bg-gray-100 rounded">{dados_internos.observacoes_internas || 'Nenhuma observação.'}</p>
                        </div>
                    </DetailSection>
                </div>
            </div>
        </div>
    );
};

export default ImovelDetailsModal;
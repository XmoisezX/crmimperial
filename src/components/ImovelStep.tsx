import React from 'react';
import { Button } from './ui/Button';
import { ChevronLeft, ChevronRight, Save, Loader2 } from 'lucide-react';

interface ImovelStepProps {
    title: React.ReactNode;
    children: React.ReactNode;
    step: number;
    totalSteps: number;
    onNext: () => void;
    onBack: () => void;
    onSave: () => void;
    isLastStep: boolean;
    isFirstStep: boolean;
    isStepValid: boolean;
    isSaving: boolean;
    disabled?: boolean;
}

const ImovelStep: React.FC<ImovelStepProps> = ({
    title,
    children,
    step,
    totalSteps,
    onNext,
    onBack,
    onSave,
    isLastStep,
    isFirstStep,
    isStepValid,
    isSaving,
    disabled = false,
}) => {
    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className={`bg-white p-6 rounded-lg shadow-md border border-gray-200 ${disabled ? 'opacity-70' : ''}`}>
                <div className="flex justify-between items-center border-b pb-3 mb-4">
                    <h2 className="text-xl font-bold text-dark-text flex items-center">
                        {title}
                    </h2>
                    <span className="text-sm text-light-text font-medium">
                        Passo {step} de {totalSteps}
                    </span>
                </div>
                
                <div className="space-y-6">
                    {children}
                </div>
                
                {/* Footer de Navegação (Visível apenas se NÃO estiver disabled) */}
                {!disabled && (
                    <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
                        <Button
                            onClick={onBack}
                            disabled={isFirstStep || isSaving}
                            variant="outline"
                            className="text-gray-700 border-gray-300 hover:bg-gray-100"
                        >
                            <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
                        </Button>

                        {isLastStep ? (
                            <Button
                                onClick={onSave}
                                disabled={!isStepValid || isSaving}
                                className="bg-green-600 hover:bg-green-700 text-white"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                                Salvar Imóvel
                            </Button>
                        ) : (
                            <Button
                                onClick={onNext}
                                disabled={!isStepValid || isSaving}
                                className="bg-blue-600 hover:bg-blue-700 text-white"
                            >
                                Próximo <ChevronRight className="w-4 h-4 ml-2" />
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default ImovelStep;
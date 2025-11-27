import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, Move, RotateCw, Smartphone, Tablet, Monitor, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';

// Tipos para as configurações de visualização
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

// Tipos para os dados de transformação
export interface ImageTransform {
    scale: number; // 1.0 = 100% zoom
    offsetX: number; // -100 a 100 (posição X em %)
    offsetY: number; // -100 a 100 (posição Y em %)
}

interface ImageManipulatorProps {
    imageUrl: string;
    currentTransform: ImageTransform;
    onTransformChange: (transform: ImageTransform) => void;
    device: DeviceType;
    isLoading: boolean;
    previewHeight: number; // Altura do container de preview em pixels
    previewWidth: number; // Largura do container de preview em pixels
}

const ImageManipulator: React.FC<ImageManipulatorProps> = ({ imageUrl, currentTransform, onTransformChange, device, isLoading, previewHeight, previewWidth }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [initialOffset, setInitialOffset] = useState({ x: 0, y: 0 });

    const { scale, offsetX, offsetY } = currentTransform;

    // Limites de zoom
    const MIN_SCALE = 1.0;
    const MAX_SCALE = 3.0;
    const ZOOM_STEP = 0.1;

    // --- Lógica de Arrastar (Pan) ---
    const handleMouseDown = useCallback((e: React.MouseEvent) => {
        if (isLoading) return;
        e.preventDefault();
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        setInitialOffset({ x: offsetX, y: offsetY });
    }, [offsetX, offsetY, isLoading]);

    const handleMouseMove = useCallback((e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;

        // Usamos a largura/altura do preview simulado para calcular a sensibilidade
        // NOTA: Usamos previewWidth/Height para o cálculo de sensibilidade,
        // mas o container visual pode ser mais largo no desktop.
        const width = previewWidth;
        const height = previewHeight;
        
        // Calcula a diferença de pixels arrastados
        const dx = e.clientX - dragStart.x;
        const dy = e.clientY - dragStart.y;
        
        // Converte a diferença de pixels para porcentagem do container
        const sensitivityX = 100 / (width * scale); 
        const sensitivityY = 100 / (height * scale); 
        
        let newOffsetX = initialOffset.x + dx * sensitivityX;
        let newOffsetY = initialOffset.y + dy * sensitivityY;
        
        // Limita o offset para que a imagem não saia completamente da tela
        const maxOffset = (scale - 1) * 50; // Máximo de deslocamento em %
        
        newOffsetX = Math.max(-maxOffset, Math.min(maxOffset, newOffsetX));
        newOffsetY = Math.max(-maxOffset, Math.min(maxOffset, newOffsetY));

        onTransformChange({ scale, offsetX: newOffsetX, offsetY: newOffsetY });
    }, [isDragging, dragStart, initialOffset, scale, onTransformChange, previewWidth, previewHeight]);

    const handleMouseUp = useCallback(() => {
        setIsDragging(false);
    }, []);

    useEffect(() => {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [handleMouseMove, handleMouseUp]);
    
    // --- Lógica de Zoom ---
    const handleZoom = (direction: 'in' | 'out') => {
        let newScale = scale;
        if (direction === 'in') {
            newScale = Math.min(MAX_SCALE, scale + ZOOM_STEP);
        } else {
            newScale = Math.max(MIN_SCALE, scale - ZOOM_STEP);
        }
        
        // Recalcula o offset para garantir que ele permaneça dentro dos limites da nova escala
        const maxOffset = (newScale - 1) * 50;
        const newOffsetX = Math.max(-maxOffset, Math.min(maxOffset, offsetX));
        const newOffsetY = Math.max(-maxOffset, Math.min(maxOffset, offsetY));

        onTransformChange({ scale: newScale, offsetX: newOffsetX, offsetY: newOffsetY });
    };
    
    // Estilos dinâmicos para a imagem
    const imageStyle: React.CSSProperties = {
        backgroundImage: `url(${imageUrl})`,
        backgroundSize: `${scale * 100}%`,
        backgroundPosition: `${50 + offsetX}% ${50 + offsetY}%`,
        cursor: isDragging ? 'grabbing' : 'grab',
    };
    
    // Classes de largura para o container de manipulação
    const containerWidthClass = device === 'desktop' ? 'w-full' : device === 'tablet' ? 'w-[768px] max-w-full' : 'w-[375px] max-w-full';

    return (
        <div className="space-y-4">
            {/* Controles */}
            <div className="flex space-x-3">
                <Button 
                    onClick={() => handleZoom('in')} 
                    disabled={scale >= MAX_SCALE || isLoading}
                    variant="outline"
                    title="Zoom In"
                >
                    <ZoomIn className="w-4 h-4" />
                </Button>
                <Button 
                    onClick={() => handleZoom('out')} 
                    disabled={scale <= MIN_SCALE || isLoading}
                    variant="outline"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-4 h-4" />
                </Button>
                <Button 
                    onClick={() => onTransformChange({ scale: 1.0, offsetX: 0, offsetY: 0 })}
                    disabled={isLoading}
                    variant="outline"
                    title="Resetar Posição e Zoom"
                >
                    <Move className="w-4 h-4" />
                </Button>
            </div>

            {/* Preview do Dispositivo (Apenas o container de manipulação) */}
            <div className="flex justify-center items-center p-4 bg-gray-100 rounded-lg shadow-inner">
                <div 
                    ref={containerRef}
                    className={`relative overflow-hidden border-8 border-gray-800 rounded-xl shadow-2xl transition-all duration-300 ${containerWidthClass}`}
                    style={{ 
                        height: `${previewHeight}px`,
                        // No desktop, usamos w-full. Nos outros, usamos a largura fixa.
                        width: device === 'desktop' ? '100%' : `${previewWidth}px`,
                        minHeight: '300px',
                        minWidth: device === 'desktop' ? '300px' : `${previewWidth}px`,
                    }}
                    onMouseDown={handleMouseDown}
                >
                    {isLoading ? (
                        <div className="absolute inset-0 flex items-center justify-center bg-white/80">
                            <Loader2 className="w-6 h-6 animate-spin text-primary-orange" />
                        </div>
                    ) : (
                        <div 
                            className="absolute inset-0 bg-cover bg-no-repeat"
                            style={imageStyle}
                        />
                    )}
                    
                    {/* Linhas de Guia (Opcional) */}
                    <div className="absolute inset-0 border border-dashed border-white/50 pointer-events-none">
                        <div className="absolute inset-y-0 left-1/2 border-l border-dashed border-white/50 transform -translate-x-1/2"></div>
                        <div className="absolute inset-x-0 top-1/2 border-t border-dashed border-white/50 transform -translate-y-1/2"></div>
                    </div>
                </div>
            </div>
            
            {/* Status */}
            <div className="text-sm text-light-text">
                Zoom: {(scale * 100).toFixed(0)}% | Posição X: {offsetX.toFixed(1)}% | Posição Y: {offsetY.toFixed(1)}%
            </div>
        </div>
    );
};

export default ImageManipulator;
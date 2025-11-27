import React, { ReactNode } from 'react';
import { useIsClient } from '../hooks/useIsClient';
import { Loader2 } from 'lucide-react';

interface ClientOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

const ClientOnly: React.FC<ClientOnlyProps> = ({ children, fallback = (
    <div className="relative h-64 bg-gray-200 rounded-md mt-4 flex items-center justify-center">
        <Loader2 className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-600" />
        <p className="ml-3 text-gray-600">Carregando componente...</p>
    </div>
) }) => {
  const isClient = useIsClient();

  if (!isClient) {
    return fallback as React.ReactElement;
  }

  return <>{children}</>;
};

export default ClientOnly;
import { useState, useEffect } from 'react';

export const useIsClient = () => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    // Este efeito só roda no cliente
    setIsClient(true);
  }, []);

  return isClient;
};
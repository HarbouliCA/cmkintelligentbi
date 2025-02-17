'use client';

import { Providers } from '@/app/providers';

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <Providers>{children}</Providers>;
}

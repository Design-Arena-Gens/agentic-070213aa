'use client';

import { ReactNode } from 'react';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { DatabaseProvider } from '@/components/providers/database-provider';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <DatabaseProvider>{children}</DatabaseProvider>
    </LocaleProvider>
  );
}

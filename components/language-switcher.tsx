'use client';

import { useLocale } from '@/components/providers/locale-provider';

export function LanguageSwitcher() {
  const { locale, setLocale, t } = useLocale();

  return (
    <div className="inline-flex items-center rounded-full border border-gray-200 bg-white p-1 text-sm">
      <button
        type="button"
        onClick={() => setLocale('ar')}
        className={`rounded-full px-3 py-1 transition ${
          locale === 'ar'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-500 hover:bg-gray-100'
        }`}
      >
        {t('arabic')}
      </button>
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`rounded-full px-3 py-1 transition ${
          locale === 'en'
            ? 'bg-primary-600 text-white shadow-sm'
            : 'text-gray-500 hover:bg-gray-100'
        }`}
      >
        {t('english')}
      </button>
    </div>
  );
}

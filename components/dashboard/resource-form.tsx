'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import type { ResourceFormValues } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

type ResourceFormProps = {
  onSubmit: (values: ResourceFormValues) => void;
  onCancel: () => void;
  initialData?: Partial<ResourceFormValues>;
};

const defaults: ResourceFormValues = {
  name: '',
  type: '',
  allocation: 0
};

export function ResourceForm({ onSubmit, onCancel, initialData }: ResourceFormProps) {
  const { t } = useLocale();
  const [values, setValues] = useState<ResourceFormValues>({ ...defaults, ...initialData });

  useEffect(() => {
    setValues({ ...defaults, ...initialData });
  }, [initialData]);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="space-y-2">
        <span className="text-sm font-medium text-gray-700">{t('resource_name')}</span>
        <Input
          value={values.name}
          onChange={(event) => setValues((prev) => ({ ...prev, name: event.target.value }))}
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium text-gray-700">{t('resource_type')}</span>
        <Input
          value={values.type}
          onChange={(event) => setValues((prev) => ({ ...prev, type: event.target.value }))}
        />
      </label>
      <label className="space-y-2">
        <span className="text-sm font-medium text-gray-700">{t('resource_allocation')}</span>
        <Input
          type="number"
          min={0}
          max={100}
          value={values.allocation}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, allocation: Number(event.target.value) }))
          }
        />
      </label>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit">{t('save')}</Button>
      </div>
    </form>
  );
}

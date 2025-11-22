'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import type { PhaseFormValues, PhaseStatus } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';

type PhaseFormProps = {
  onSubmit: (values: PhaseFormValues) => void;
  onCancel: () => void;
  initialData?: Partial<PhaseFormValues>;
};

const defaults: PhaseFormValues = {
  name: '',
  startDate: '',
  endDate: '',
  progress: 0,
  status: 'on_track'
};

export function PhaseForm({ onSubmit, onCancel, initialData }: PhaseFormProps) {
  const { t } = useLocale();
  const [values, setValues] = useState<PhaseFormValues>({ ...defaults, ...initialData });

  useEffect(() => {
    setValues({ ...defaults, ...initialData });
  }, [initialData]);

  const handleChange = (field: keyof PhaseFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]:
        field === 'progress'
          ? Number(value)
          : field === 'status'
            ? (value as PhaseStatus)
            : value
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit(values);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <label className="space-y-2">
        <span className="text-sm font-medium text-gray-700">{t('phase_name')}</span>
        <Input value={values.name} onChange={(event) => handleChange('name', event.target.value)} />
      </label>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">{t('phase_start_date')}</span>
          <Input
            type="date"
            value={values.startDate}
            onChange={(event) => handleChange('startDate', event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">{t('phase_end_date')}</span>
          <Input
            type="date"
            value={values.endDate}
            onChange={(event) => handleChange('endDate', event.target.value)}
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">{t('phase_progress')}</span>
          <Input
            type="number"
            min={0}
            max={100}
            value={values.progress}
            onChange={(event) => handleChange('progress', event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">{t('health_status')}</span>
          <Select value={values.status} onChange={(event) => handleChange('status', event.target.value)}>
            <option value="on_track">{t('phase_status_on_track')}</option>
            <option value="at_risk">{t('phase_status_at_risk')}</option>
            <option value="delayed">{t('phase_status_delayed')}</option>
          </Select>
        </label>
      </div>
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit">{t('save')}</Button>
      </div>
    </form>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useLocale } from '@/components/providers/locale-provider';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { HealthStatus, ProjectFormValues, ProjectStatus } from '@/lib/types';

type ProjectFormProps = {
  onSubmit: (values: ProjectFormValues) => void;
  onCancel: () => void;
  initialData?: Partial<ProjectFormValues>;
};

const defaultValues: ProjectFormValues = {
  name: '',
  description: '',
  status: 'planned',
  startDate: '',
  endDate: '',
  budget: 0,
  spent: 0,
  health: 'stable'
};

export function ProjectForm({ onSubmit, onCancel, initialData }: ProjectFormProps) {
  const { t } = useLocale();
  const [values, setValues] = useState<ProjectFormValues>({ ...defaultValues, ...initialData });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValues({ ...defaultValues, ...initialData });
  }, [initialData]);

  const handleChange = (field: keyof ProjectFormValues, value: string) => {
    setValues((prev) => ({
      ...prev,
      [field]:
        field === 'budget' || field === 'spent' || field === 'health'
          ? field === 'health'
            ? (value as HealthStatus)
            : Number(value)
          : field === 'status'
            ? (value as ProjectStatus)
            : value
    }));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!values.name.trim()) {
      setError(t('project_name'));
      return;
    }
    if (!values.startDate || !values.endDate) {
      setError(t('timeline'));
      return;
    }
    setError(null);
    onSubmit(values);
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">{t('project_name')}</span>
          <Input
            value={values.name}
            onChange={(event) => handleChange('name', event.target.value)}
            required
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">{t('project_status')}</span>
          <Select
            value={values.status}
            onChange={(event) => handleChange('status', event.target.value)}
          >
            <option value="planned">{t('status_planned')}</option>
            <option value="active">{t('status_active')}</option>
            <option value="on_hold">{t('status_on_hold')}</option>
            <option value="completed">{t('status_completed')}</option>
          </Select>
        </label>
      </div>
      <label className="space-y-2">
        <span className="text-sm font-medium text-gray-700">{t('project_description')}</span>
        <Textarea
          rows={4}
          value={values.description}
          onChange={(event) => handleChange('description', event.target.value)}
        />
      </label>
      <div className="grid gap-3 md:grid-cols-4">
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-gray-700">{t('project_start_date')}</span>
          <Input
            type="date"
            value={values.startDate}
            onChange={(event) => handleChange('startDate', event.target.value)}
            required
          />
        </label>
        <label className="space-y-2 md:col-span-2">
          <span className="text-sm font-medium text-gray-700">{t('project_end_date')}</span>
          <Input
            type="date"
            value={values.endDate}
            onChange={(event) => handleChange('endDate', event.target.value)}
            required
          />
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">{t('project_budget')}</span>
          <Input
            type="number"
            value={values.budget ?? 0}
            min={0}
            onChange={(event) => handleChange('budget', event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">{t('project_spent')}</span>
          <Input
            type="number"
            value={values.spent ?? 0}
            min={0}
            onChange={(event) => handleChange('spent', event.target.value)}
          />
        </label>
        <label className="space-y-2">
          <span className="text-sm font-medium text-gray-700">{t('health_status')}</span>
          <Select value={values.health} onChange={(event) => handleChange('health', event.target.value)}>
            <option value="stable">{t('health_stable')}</option>
            <option value="warning">{t('health_warning')}</option>
            <option value="critical">{t('health_critical')}</option>
          </Select>
        </label>
      </div>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="ghost" onClick={onCancel}>
          {t('cancel')}
        </Button>
        <Button type="submit">{t('save')}</Button>
      </div>
    </form>
  );
}

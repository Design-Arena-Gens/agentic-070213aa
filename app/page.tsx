'use client';

import { useMemo, useState } from 'react';
import { useDatabase } from '@/components/providers/database-provider';
import { useLocale } from '@/components/providers/locale-provider';
import { LanguageSwitcher } from '@/components/language-switcher';
import { MetricCards } from '@/components/dashboard/metric-cards';
import { AlertsPanel } from '@/components/dashboard/alerts-panel';
import { ProjectForm } from '@/components/dashboard/project-form';
import { PhaseForm } from '@/components/dashboard/phase-form';
import { ResourceForm } from '@/components/dashboard/resource-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import type {
  Phase,
  ProjectFormValues,
  ProjectWithRelations,
  ResourceFormValues
} from '@/lib/types';
import { exportProjectsAsCSV, exportProjectsAsJSON } from '@/lib/utils/export';

type ProjectModalState =
  | null
  | {
      mode: 'create';
    }
  | {
      mode: 'edit';
      project: ProjectWithRelations;
    };

type PhaseModalState =
  | null
  | {
      project: ProjectWithRelations;
      phase?: Phase;
    };

type ResourceModalState =
  | null
  | {
      project: ProjectWithRelations;
      resource?: ProjectWithRelations['resources'][number];
    };

function projectStatusLabel(t: (key: string) => string, status: ProjectWithRelations['status']) {
  switch (status) {
    case 'planned':
      return t('status_planned');
    case 'active':
      return t('status_active');
    case 'on_hold':
      return t('status_on_hold');
    case 'completed':
      return t('status_completed');
    default:
      return status;
  }
}

function phaseStatusLabel(t: (key: string) => string, status: Phase['status']) {
  switch (status) {
    case 'on_track':
      return t('phase_status_on_track');
    case 'at_risk':
      return t('phase_status_at_risk');
    case 'delayed':
      return t('phase_status_delayed');
    default:
      return status;
  }
}

function healthLabel(t: (key: string) => string, health: string) {
  switch (health) {
    case 'warning':
      return t('health_warning');
    case 'critical':
      return t('health_critical');
    default:
      return t('health_stable');
  }
}

function projectProgress(project: ProjectWithRelations) {
  if (!project.phases.length) {
    return project.status === 'completed' ? 100 : 0;
  }
  const sum = project.phases.reduce((acc, phase) => acc + phase.progress, 0);
  return Math.round(sum / project.phases.length);
}

export default function HomePage() {
  const {
    ready,
    projects,
    notifications,
    addProject,
    updateProject,
    deleteProject,
    addPhase,
    updatePhase,
    deletePhase,
    addResource,
    updateResource,
    deleteResource
  } = useDatabase();
  const { t, locale } = useLocale();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedProjectId, setExpandedProjectId] = useState<string | null>(null);
  const [projectModal, setProjectModal] = useState<ProjectModalState>(null);
  const [phaseModal, setPhaseModal] = useState<PhaseModalState>(null);
  const [resourceModal, setResourceModal] = useState<ResourceModalState>(null);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesSearch =
        !searchTerm ||
        project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        project.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [projects, searchTerm, statusFilter]);

  const handleCreateProject = (values: ProjectFormValues) => {
    const existing = projects.find(
      (project) => project.name.trim().toLowerCase() === values.name.trim().toLowerCase()
    );
    if (existing) {
      alert(t('duplicate_name_error'));
      return;
    }
    addProject(values);
    setProjectModal(null);
  };

  const handleUpdateProject = (projectId: string, values: ProjectFormValues) => {
    updateProject(projectId, values);
    setProjectModal(null);
  };

  const handleDeleteProject = (projectId: string) => {
    if (window.confirm(t('confirm_delete_project'))) {
      deleteProject(projectId);
    }
  };

  const handleExportJSON = () => {
    exportProjectsAsJSON(projects);
    alert(t('export_success'));
  };

  const handleExportCSV = () => {
    exportProjectsAsCSV(projects);
    alert(t('export_success'));
  };

  if (!ready) {
    return (
      <div className="flex h-screen items-center justify-center text-lg text-gray-500">
        {t('loading')}
      </div>
    );
  }

  const formatter = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const activeProject =
    (phaseModal?.project ?? resourceModal?.project ?? null) || (projectModal?.mode === 'edit' ? projectModal.project : null);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-primary-50/40 p-6 md:p-10">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <header className="flex flex-col items-start justify-between gap-4 rounded-3xl bg-white/80 p-6 shadow-sm ring-1 ring-gray-100 md:flex-row md:items-center">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">{t('app_title')}</h1>
            <p className="mt-2 text-sm text-gray-500">{t('dashboard')}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <LanguageSwitcher />
            <Button variant="outline" onClick={() => setProjectModal({ mode: 'create' })}>
              {t('add_project')}
            </Button>
            <Button variant="ghost" onClick={() => window.print()}>
              {t('print_report')}
            </Button>
            <Button onClick={handleExportJSON}>{t('export_report')}</Button>
          </div>
        </header>

        <MetricCards projects={projects} />

        <Card>
          <CardHeader className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <CardTitle>{t('projects')}</CardTitle>
              <p className="mt-1 text-sm text-gray-500">{t('reports')}</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder={t('search_projects')}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="w-48"
              />
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                className="w-40"
              >
                <option value="all">{t('filter_status')}</option>
                <option value="planned">{t('status_planned')}</option>
                <option value="active">{t('status_active')}</option>
                <option value="on_hold">{t('status_on_hold')}</option>
                <option value="completed">{t('status_completed')}</option>
              </Select>
              <Button variant="outline" onClick={handleExportCSV}>
                CSV
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {filteredProjects.length === 0 ? (
              <p className="text-sm text-gray-500">{t('no_projects')}</p>
            ) : (
              <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {t('project_name')}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {t('project_status')}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {t('progress')}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {t('timeline')}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {t('financials')}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {t('resources')}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {t('health_status')}
                      </th>
                      <th className="px-4 py-3 text-start text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {t('actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {filteredProjects.map((project) => {
                      const progressValue = projectProgress(project);
                      return (
                        <tr key={project.id} className="bg-white">
                          <td className="px-4 py-4 text-sm font-semibold text-gray-900">{project.name}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {projectStatusLabel(t, project.status)}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-100">
                                <div
                                  className="h-full rounded-full bg-primary-500 transition-all"
                                  style={{ width: `${progressValue}%` }}
                                />
                              </div>
                              <span className="text-xs font-medium text-gray-600">{progressValue}%</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            <div>{formatter.format(new Date(project.startDate))}</div>
                            <div className="text-xs text-gray-400">
                              {formatter.format(new Date(project.endDate))}
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">
                            {project.budget.toLocaleString()} / {project.spent.toLocaleString()}
                          </td>
                          <td className="px-4 py-4 text-sm text-gray-600">{project.resources.length}</td>
                          <td className="px-4 py-4 text-sm text-gray-600">{healthLabel(t, project.health)}</td>
                          <td className="flex flex-wrap gap-2 px-4 py-4">
                            <Button variant="ghost" size="sm" onClick={() => setExpandedProjectId((prev) => (prev === project.id ? null : project.id))}>
                              {expandedProjectId === project.id ? '-' : '+'}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setProjectModal({ mode: 'edit', project })}
                            >
                              {t('edit_project')}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteProject(project.id)}
                            >
                              {t('delete_project')}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        {filteredProjects.map((project) =>
          expandedProjectId === project.id ? (
            <Card key={`details-${project.id}`}>
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <CardTitle>{project.name}</CardTitle>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPhaseModal({ project })}
                  >
                    {t('add_phase')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResourceModal({ project })}
                  >
                    {t('add_resource')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">{t('phase_details')}</h3>
                  {project.phases.length === 0 ? (
                    <p className="text-sm text-gray-500">{t('no_deadlines')}</p>
                  ) : (
                    <div className="space-y-3">
                      {project.phases.map((phase) => (
                        <div key={phase.id} className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{phase.name}</p>
                              <p className="text-xs text-gray-500">
                                {formatter.format(new Date(phase.startDate))} →{' '}
                                {formatter.format(new Date(phase.endDate))}
                              </p>
                            </div>
                            <Badge
                              variant={
                                phase.status === 'delayed'
                                  ? 'danger'
                                  : phase.status === 'at_risk'
                                    ? 'warning'
                                    : 'success'
                              }
                            >
                              {phaseStatusLabel(t, phase.status)}
                            </Badge>
                          </div>
                          <div className="mt-3">
                            <div className="h-2 w-full rounded-full bg-white">
                              <div
                                className="h-full rounded-full bg-primary-500"
                                style={{ width: `${phase.progress}%` }}
                              />
                            </div>
                            <div className="mt-2 flex justify-between text-xs text-gray-500">
                              <span>{t('progress')}</span>
                              <span>{phase.progress}%</span>
                            </div>
                          </div>
                          <div className="mt-3 flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPhaseModal({ project, phase })}
                            >
                              {t('edit_project')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deletePhase(phase.id)}
                            >
                              {t('delete_project')}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">{t('resource_details')}</h3>
                  {project.resources.length === 0 ? (
                    <p className="text-sm text-gray-500">{t('no_resources')}</p>
                  ) : (
                    <div className="space-y-3">
                      {project.resources.map((resource) => (
                        <div
                          key={resource.id}
                          className="flex items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
                        >
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{resource.name}</p>
                            <p className="text-xs text-gray-500">{resource.type}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge variant="default">{resource.allocation}%</Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setResourceModal({ project, resource })}
                            >
                              {t('edit_project')}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteResource(resource.id)}
                            >
                              {t('delete_project')}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="rounded-xl border border-gray-100 bg-gray-50/80 p-4">
                    <dl className="grid grid-cols-2 gap-3 text-sm text-gray-700">
                      <div>
                        <dt>{t('total_budget')}</dt>
                        <dd className="font-semibold text-gray-900">
                          {project.budget.toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt>{t('total_spent')}</dt>
                        <dd className="font-semibold text-gray-900">
                          {project.spent.toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt>{t('remaining_budget')}</dt>
                        <dd className="font-semibold text-gray-900">
                          {(project.budget - project.spent).toLocaleString()}
                        </dd>
                      </div>
                      <div>
                        <dt>{t('updated_at')}</dt>
                        <dd className="font-semibold text-gray-900">
                          {formatter.format(new Date(project.updatedAt))}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : null
        )}

        <AlertsPanel projects={projects} notifications={notifications} />
      </div>

      <Modal
        open={projectModal !== null}
        onClose={() => setProjectModal(null)}
        title={projectModal?.mode === 'edit' ? t('edit_project') : t('add_project')}
        actions={null}
      >
        {projectModal && (
          <ProjectForm
            initialData={
              projectModal.mode === 'edit'
                ? {
                    name: projectModal.project.name,
                    description: projectModal.project.description,
                    status: projectModal.project.status,
                    startDate: projectModal.project.startDate,
                    endDate: projectModal.project.endDate,
                    budget: projectModal.project.budget,
                    spent: projectModal.project.spent,
                    health: projectModal.project.health
                  }
                : undefined
            }
            onCancel={() => setProjectModal(null)}
            onSubmit={(values: ProjectFormValues) =>
              projectModal.mode === 'edit'
                ? handleUpdateProject(projectModal.project.id, values)
                : handleCreateProject(values)
            }
          />
        )}
      </Modal>

      <Modal
        open={phaseModal !== null}
        onClose={() => setPhaseModal(null)}
        title={t('phase_details')}
        actions={null}
      >
        {phaseModal && (
          <PhaseForm
            initialData={
              phaseModal.phase
                ? {
                    name: phaseModal.phase.name,
                    startDate: phaseModal.phase.startDate,
                    endDate: phaseModal.phase.endDate,
                    progress: phaseModal.phase.progress,
                    status: phaseModal.phase.status
                  }
                : undefined
            }
            onCancel={() => setPhaseModal(null)}
            onSubmit={(values) => {
              if (phaseModal.phase) {
                updatePhase(phaseModal.phase.id, values);
              } else {
                addPhase(phaseModal.project.id, values);
              }
              setPhaseModal(null);
            }}
          />
        )}
      </Modal>

      <Modal
        open={resourceModal !== null}
        onClose={() => setResourceModal(null)}
        title={t('resource_details')}
        actions={null}
      >
        {resourceModal && (
          <ResourceForm
            initialData={
              resourceModal.resource
                ? {
                    name: resourceModal.resource.name,
                    type: resourceModal.resource.type,
                    allocation: resourceModal.resource.allocation
                  }
                : undefined
            }
            onCancel={() => setResourceModal(null)}
            onSubmit={(values: ResourceFormValues) => {
              if (resourceModal.resource) {
                updateResource(resourceModal.resource.id, values);
              } else {
                addResource(resourceModal.project.id, values);
              }
              setResourceModal(null);
            }}
          />
        )}
      </Modal>
    </div>
  );
}

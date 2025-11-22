import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/components/providers/locale-provider';
import type { ProjectWithRelations } from '@/lib/types';

type MetricCardsProps = {
  projects: ProjectWithRelations[];
};

function calculateAverageProgress(projects: ProjectWithRelations[]) {
  if (!projects.length) return 0;
  const values = projects.map((project) => {
    if (!project.phases.length) {
      return project.status === 'completed' ? 100 : 0;
    }
    const sum = project.phases.reduce((acc, phase) => acc + phase.progress, 0);
    return Math.round(sum / project.phases.length);
  });
  return Math.round(values.reduce((acc, value) => acc + value, 0) / projects.length);
}

function getHealthBadge(health: string) {
  switch (health) {
    case 'critical':
      return <Badge variant="danger">•</Badge>;
    case 'warning':
      return <Badge variant="warning">•</Badge>;
    default:
      return <Badge variant="success">•</Badge>;
  }
}

export function MetricCards({ projects }: MetricCardsProps) {
  const { t } = useLocale();
  const totalProjects = projects.length;
  const activeProjects = projects.filter((project) => project.status === 'active').length;
  const completedProjects = projects.filter((project) => project.status === 'completed').length;
  const totalBudget = projects.reduce((acc, project) => acc + project.budget, 0);
  const totalSpent = projects.reduce((acc, project) => acc + project.spent, 0);
  const utilization = totalBudget ? Math.round((totalSpent / totalBudget) * 100) : 0;
  const averageProgress = calculateAverageProgress(projects);

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('total_projects')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-primary-700">{totalProjects}</p>
          <p className="mt-2 text-sm text-gray-500">
            {t('active_projects')}: {activeProjects}
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('completed_projects')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-emerald-600">{completedProjects}</p>
          <p className="mt-2 text-sm text-gray-500">
            {t('progress')}: {averageProgress}%
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('budget_utilization')}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-amber-600">{utilization}%</p>
          <div className="mt-2 text-sm text-gray-500">
            <div>
              {t('total_budget')}: {totalBudget.toLocaleString()}
            </div>
            <div>
              {t('total_spent')}: {totalSpent.toLocaleString()}
            </div>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <CardTitle>{t('health_status')}</CardTitle>
          {projects.length > 0 && getHealthBadge(projects[0].health)}
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-bold text-gray-900">{averageProgress}%</p>
          <p className="mt-2 text-sm text-gray-500">{t('quarterly_progress')}</p>
        </CardContent>
      </Card>
    </div>
  );
}

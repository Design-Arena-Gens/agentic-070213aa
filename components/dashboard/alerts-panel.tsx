import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLocale } from '@/components/providers/locale-provider';
import type { Notification, ProjectWithRelations } from '@/lib/types';

type AlertsPanelProps = {
  projects: ProjectWithRelations[];
  notifications: Notification[];
};

function getSeverityVariant(severity: Notification['severity']) {
  switch (severity) {
    case 'danger':
      return 'danger';
    case 'warning':
      return 'warning';
    default:
      return 'default';
  }
}

function daysUntil(date: string) {
  const target = new Date(date);
  const today = new Date();
  const diff = target.getTime() - today.setHours(0, 0, 0, 0);
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function getSeverityLabel(t: (key: string) => string, severity: Notification['severity']) {
  switch (severity) {
    case 'danger':
      return t('severity_danger');
    case 'warning':
      return t('severity_warning');
    default:
      return t('severity_info');
  }
}

export function AlertsPanel({ projects, notifications }: AlertsPanelProps) {
  const { t, locale } = useLocale();
  const upcoming = projects
    .flatMap((project) =>
      project.phases.map((phase) => ({
        project,
        phase,
        dueIn: daysUntil(phase.endDate)
      }))
    )
    .filter(({ dueIn }) => dueIn >= 0 && dueIn <= 30)
    .sort((a, b) => a.dueIn - b.dueIn)
    .slice(0, 5);

  const formatter = new Intl.DateTimeFormat(locale === 'ar' ? 'ar-EG' : 'en-GB', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>{t('upcoming_deadlines')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {upcoming.length === 0 ? (
            <p className="text-sm text-gray-500">{t('no_deadlines')}</p>
          ) : (
            upcoming.map(({ project, phase, dueIn }) => (
              <div
                key={phase.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-semibold text-gray-900">{project.name}</p>
                  <p className="text-xs text-gray-500">
                    {phase.name} • {formatter.format(new Date(phase.endDate))}
                  </p>
                </div>
                <Badge variant={dueIn < 7 ? 'danger' : 'warning'}>
                  {dueIn} {locale === 'ar' ? 'يوم' : 'days'}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{t('notifications')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {notifications.length === 0 ? (
            <p className="text-sm text-gray-500">{t('no_notifications')}</p>
          ) : (
            notifications.slice(0, 6).map((notification) => (
              <div
                key={notification.id}
                className="rounded-lg border border-gray-100 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <Badge variant={getSeverityVariant(notification.severity)}>
                    {getSeverityLabel(t, notification.severity)}
                  </Badge>
                  <span className="text-xs text-gray-400">
                    {formatter.format(new Date(notification.createdAt))}
                  </span>
                </div>
                <p className="mt-2 text-sm text-gray-700">{notification.message}</p>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { TeamMember } from '@/hooks/use-dashboard';

interface TeamPerformanceProps {
  members: TeamMember[] | undefined;
  loading?: boolean;
}

const roleLabels: Record<string, string> = {
  super_admin: 'სუპერ ადმინი',
  manager: 'მენეჯერი',
  admin: 'ადმინი',
  assistant: 'ასისტანტი',
  accountant: 'ბუღალტერი',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getCompletionRate(member: TeamMember): number {
  const activeCases = member.totalCases - member.casesByStatus.completed;
  const totalHandled = activeCases + member.completedInPeriod;
  return totalHandled > 0 ? Math.round((member.completedInPeriod / totalHandled) * 100) : 0;
}

function getRateColor(rate: number): string {
  if (rate >= 80) return 'text-green-600';
  if (rate >= 60) return 'text-amber-600';
  return 'text-red-600';
}

function getRateBgColor(rate: number): string {
  if (rate >= 80) return 'bg-green-100';
  if (rate >= 60) return 'bg-amber-100';
  return 'bg-red-100';
}

export function TeamPerformance({ members, loading }: TeamPerformanceProps) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">გუნდის შედეგები</h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-gray-100 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">გუნდის შედეგები</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-gray-500">გუნდის წევრები არ მოიძებნა</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900">გუნდის შედეგები</h3>
        <span className="text-xs text-gray-400">ამ თვეში</span>
      </div>

      {/* Table header */}
      <div className="grid grid-cols-12 gap-2 px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100">
        <div className="col-span-4">თანამშრომელი</div>
        <div className="col-span-2 text-center">სულ</div>
        <div className="col-span-2 text-center">დასრულ.</div>
        <div className="col-span-2 text-center">საშ.დრო</div>
        <div className="col-span-2 text-center">%</div>
      </div>

      {/* Table rows */}
      <div className="divide-y divide-gray-50">
        {members.map((member) => {
          const rate = getCompletionRate(member);
          const activeCases = member.totalCases - member.casesByStatus.completed;

          return (
            <div
              key={member.id}
              className="grid grid-cols-12 gap-2 px-3 py-3 items-center hover:bg-gray-50 transition-colors"
            >
              {/* User info */}
              <div className="col-span-4 flex items-center gap-2 min-w-0">
                <Avatar className="h-8 w-8 flex-shrink-0">
                  <AvatarImage src={member.avatar || undefined} alt={member.name} />
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{member.name}</p>
                  <p className="text-xs text-gray-400 truncate">
                    {roleLabels[member.role] || member.role}
                  </p>
                </div>
              </div>

              {/* Total / Active */}
              <div className="col-span-2 text-center">
                <span className="text-sm font-medium text-gray-700">{member.totalCases}</span>
                {activeCases > 0 && (
                  <span className="text-xs text-blue-500 ml-1">({activeCases})</span>
                )}
              </div>

              {/* Completed in period */}
              <div className="col-span-2 text-center">
                <span className="text-sm font-medium text-green-600">{member.completedInPeriod}</span>
              </div>

              {/* Avg days */}
              <div className="col-span-2 text-center">
                <span className="text-sm text-gray-600">
                  {member.avgDays !== null ? `${member.avgDays} დღე` : '-'}
                </span>
              </div>

              {/* Rate */}
              <div className="col-span-2 text-center">
                <span
                  className={cn(
                    'inline-flex px-2 py-0.5 text-xs font-bold rounded-full',
                    getRateBgColor(rate),
                    getRateColor(rate)
                  )}
                >
                  {rate}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default TeamPerformance;

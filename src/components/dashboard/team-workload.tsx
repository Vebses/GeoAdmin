'use client';

import { useRouter } from 'next/navigation';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { ROLE_LABELS } from '@/lib/constants/roles';
import type { TeamMember } from '@/hooks/use-dashboard';

interface TeamWorkloadProps {
  members: TeamMember[] | undefined;
  loading?: boolean;
}

const statusConfig = {
  draft: { color: 'bg-gray-400', label: 'დრაფტი' },
  in_progress: { color: 'bg-blue-500', label: 'მიმდინარე' },
  paused: { color: 'bg-amber-500', label: 'შეჩერებული' },
  delayed: { color: 'bg-red-500', label: 'შეფერხებული' },
  completed: { color: 'bg-green-500', label: 'დასრულებული' },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function TeamWorkload({ members, loading }: TeamWorkloadProps) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-gray-900">გუნდის დატვირთვა</h3>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <div className="h-10 w-10 bg-gray-200 rounded-full animate-pulse" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
                <div className="h-3 bg-gray-100 rounded-full animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!members || members.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-gray-900">გუნდის დატვირთვა</h3>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">გუნდის წევრები არ მოიძებნა</p>
        </div>
      </div>
    );
  }

  // Find max cases for scaling
  const maxCases = Math.max(...members.map((m) => m.totalCases), 1);

  const handleMemberClick = (memberId: string) => {
    router.push(`/cases?assigned_to=${memberId}`);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-sm font-semibold text-gray-900">გუნდის დატვირთვა</h3>
        <div className="flex items-center gap-3 flex-wrap">
          {Object.entries(statusConfig).map(([key, { color, label }]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className={cn('w-2.5 h-2.5 rounded-full', color)} />
              <span className="text-xs text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-4">
        {members.map((member) => {
          const activeCases = member.totalCases - member.casesByStatus.completed;

          return (
            <div
              key={member.id}
              onClick={() => handleMemberClick(member.id)}
              className="group cursor-pointer p-3 -mx-3 rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <Avatar className="h-10 w-10 flex-shrink-0 ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                  <AvatarImage src={member.avatar || undefined} alt={member.name} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-blue-500 to-blue-600 text-white font-medium">
                    {getInitials(member.name)}
                  </AvatarFallback>
                </Avatar>

                {/* Info and Progress */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                        {member.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {ROLE_LABELS[member.role as keyof typeof ROLE_LABELS] || member.role}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">
                          {member.totalCases}
                        </p>
                        <p className="text-xs text-gray-400">სულ</p>
                      </div>
                      {activeCases > 0 && (
                        <div className="text-right">
                          <p className="text-sm font-semibold text-blue-600">
                            {activeCases}
                          </p>
                          <p className="text-xs text-gray-400">აქტიური</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stacked Progress Bar */}
                  <div className="relative h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    {member.totalCases > 0 ? (
                      <div
                        className="absolute inset-y-0 left-0 flex rounded-full overflow-hidden transition-all duration-500"
                        style={{ width: `${(member.totalCases / maxCases) * 100}%` }}
                      >
                        {/* Draft */}
                        {member.casesByStatus.draft > 0 && (
                          <div
                            className={cn(statusConfig.draft.color, 'h-full transition-all')}
                            style={{
                              width: `${(member.casesByStatus.draft / member.totalCases) * 100}%`,
                            }}
                            title={`დრაფტი: ${member.casesByStatus.draft}`}
                          />
                        )}
                        {/* In Progress */}
                        {member.casesByStatus.in_progress > 0 && (
                          <div
                            className={cn(statusConfig.in_progress.color, 'h-full transition-all')}
                            style={{
                              width: `${(member.casesByStatus.in_progress / member.totalCases) * 100}%`,
                            }}
                            title={`მიმდინარე: ${member.casesByStatus.in_progress}`}
                          />
                        )}
                        {/* Paused */}
                        {member.casesByStatus.paused > 0 && (
                          <div
                            className={cn(statusConfig.paused.color, 'h-full transition-all')}
                            style={{
                              width: `${(member.casesByStatus.paused / member.totalCases) * 100}%`,
                            }}
                            title={`შეჩერებული: ${member.casesByStatus.paused}`}
                          />
                        )}
                        {/* Delayed */}
                        {member.casesByStatus.delayed > 0 && (
                          <div
                            className={cn(statusConfig.delayed.color, 'h-full transition-all')}
                            style={{
                              width: `${(member.casesByStatus.delayed / member.totalCases) * 100}%`,
                            }}
                            title={`შეფერხებული: ${member.casesByStatus.delayed}`}
                          />
                        )}
                        {/* Completed */}
                        {member.casesByStatus.completed > 0 && (
                          <div
                            className={cn(statusConfig.completed.color, 'h-full transition-all')}
                            style={{
                              width: `${(member.casesByStatus.completed / member.totalCases) * 100}%`,
                            }}
                            title={`დასრულებული: ${member.casesByStatus.completed}`}
                          />
                        )}
                      </div>
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[10px] text-gray-400">ქეისები არ არის</span>
                      </div>
                    )}
                  </div>

                  {/* Status breakdown on hover */}
                  {member.totalCases > 0 && (
                    <div className="mt-1.5 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {Object.entries(member.casesByStatus).map(([status, count]) => {
                        if (count === 0) return null;
                        const config = statusConfig[status as keyof typeof statusConfig];
                        return (
                          <span
                            key={status}
                            className="inline-flex items-center gap-1 text-[10px] text-gray-500"
                          >
                            <span className={cn('w-1.5 h-1.5 rounded-full', config.color)} />
                            {count}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer note */}
      <div className="mt-4 pt-3 border-t border-gray-100">
        <p className="text-xs text-gray-400 text-center">
          დააკლიკეთ თანამშრომელზე მისი ქეისების სანახავად
        </p>
      </div>
    </div>
  );
}

export default TeamWorkload;

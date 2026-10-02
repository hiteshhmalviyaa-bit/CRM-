import React from 'react';
import {
  Users,
  Sparkles,
  Calendar,
  Award,
  ChevronRight,
  Check,
  Building,
  Clock,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Lead, FollowUp } from '../../types/crm';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  isDueToday,
  isOverdue,
} from '../../utils/crmHelpers';

interface DashboardViewProps {
  onSelectLead: (lead: Lead) => void;
  onNavigateToLeads: (statusFilter?: string) => void;
  onNavigateToTasks: () => void;
  onNavigateToImports: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onSelectLead,
  onNavigateToLeads,
  onNavigateToTasks,
  onNavigateToImports,
}) => {
  const {
    currentUser,
    filteredLeadsForCurrentUser,
    statuses,
    sources,
    updateFollowUpStatus,
  } = useCRM();

  const leads = filteredLeadsForCurrentUser;

  // Key metrics
  const totalLeads = leads.length;
  const newLeads = leads.filter((l) => l.status === 'new').length;
  const wonLeads = leads.filter((l) => l.status === 'won');
  const wonValue = wonLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const activePipelineValue = leads
    .filter((l) => l.status !== 'won' && l.status !== 'lost' && l.status !== 'invalid')
    .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  // Follow-ups queue
  const dueFollowUpsList: { lead: Lead; followUp: FollowUp; isLate: boolean; isToday: boolean }[] = [];
  leads.forEach((lead) => {
    (lead.followUps || []).forEach((f) => {
      if (f.status === 'pending') {
        const late = isOverdue(f.dueDate, f.dueTime);
        const today = isDueToday(f.dueDate);
        dueFollowUpsList.push({ lead, followUp: f, isLate: late, isToday: today });
      }
    });
  });

  // Sort: late & today first
  dueFollowUpsList.sort((a, b) => {
    const timeA = new Date(`${a.followUp.dueDate}T${a.followUp.dueTime || '09:00'}:00`).getTime();
    const timeB = new Date(`${b.followUp.dueDate}T${b.followUp.dueTime || '09:00'}:00`).getTime();
    return timeA - timeB;
  });

  const dueCount = dueFollowUpsList.filter((i) => i.isLate || i.isToday).length;

  // Recent activities
  const recentActivities: {
    id: string;
    lead: Lead;
    type: string;
    userName: string;
    description: string;
    createdAt: string;
  }[] = [];

  leads.forEach((lead) => {
    (lead.activities || []).forEach((act) => {
      recentActivities.push({
        id: act.id,
        lead,
        type: act.type,
        userName: act.userName,
        description: act.description,
        createdAt: act.createdAt,
      });
    });
  });

  recentActivities.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-7">
      {/* Header Greeting */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">
            Good day, {currentUser.name.split(' ')[0]}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {currentUser.role === 'admin'
              ? 'Organization overview & company-wide lead pipeline'
              : currentUser.role === 'manager'
              ? `Operational oversight for ${currentUser.team}`
              : 'Your assigned leads and scheduled follow-ups'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToLeads()}
            className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs transition"
          >
            View All Leads
          </button>
        </div>
      </div>

      {/* 4 Clean Primary Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <button
          onClick={() => onNavigateToLeads()}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-slate-300 text-left transition group shadow-2xs"
        >
          <div className="text-xs font-medium text-slate-500">Total Leads</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{totalLeads}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-indigo-600 transition">
            <span>Open lead list</span>
            <ChevronRight size={12} />
          </div>
        </button>

        {/* New Leads */}
        <button
          onClick={() => onNavigateToLeads('new')}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-blue-300 text-left transition group shadow-2xs"
        >
          <div className="text-xs font-medium text-slate-500">New Leads</div>
          <div className="text-2xl font-bold text-slate-900 mt-1">{newLeads}</div>
          <div className="text-[11px] text-blue-600 font-medium mt-1">
            Awaiting first outreach
          </div>
        </button>

        {/* Follow-Ups Today */}
        <button
          onClick={onNavigateToTasks}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-amber-300 text-left transition group shadow-2xs"
        >
          <div className="text-xs font-medium text-slate-500">Follow-Ups Due</div>
          <div className="text-2xl font-bold text-amber-800 mt-1">{dueCount}</div>
          <div className="text-[11px] text-amber-700 font-medium mt-1">
            Due today or overdue
          </div>
        </button>

        {/* Closed Won Revenue */}
        <button
          onClick={() => onNavigateToLeads('won')}
          className="p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-300 text-left transition group shadow-2xs"
        >
          <div className="text-xs font-medium text-slate-500">Closed Won ARR</div>
          <div className="text-2xl font-bold text-emerald-800 mt-1">
            {formatCurrency(wonValue)}
          </div>
          <div className="text-[11px] text-emerald-700 font-medium mt-1">
            {wonLeads.length} closed deals
          </div>
        </button>
      </div>

      {/* Clean Pipeline Funnel Bar */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-900">Lead Pipeline Stages</span>
          <span className="text-[11px] text-slate-500">
            Active Value: <strong className="text-slate-800">{formatCurrency(activePipelineValue)}</strong>
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
          {[
            { id: 'new', label: 'New', dot: 'bg-blue-500' },
            { id: 'contacted', label: 'Contacted', dot: 'bg-indigo-500' },
            { id: 'follow_up_required', label: 'Follow-Up', dot: 'bg-purple-500' },
            { id: 'qualified', label: 'Qualified', dot: 'bg-teal-500' },
            { id: 'opportunity', label: 'Opportunity', dot: 'bg-cyan-500' },
            { id: 'won', label: 'Won', dot: 'bg-emerald-500' },
          ].map((stage) => {
            const count = leads.filter((l) => l.status === stage.id).length;
            const stageVal = leads
              .filter((l) => l.status === stage.id)
              .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

            return (
              <button
                key={stage.id}
                onClick={() => onNavigateToLeads(stage.id)}
                className="p-3 rounded-lg border border-slate-200 hover:border-indigo-400 hover:bg-slate-50/60 transition text-left"
              >
                <div className="flex items-center gap-1.5 text-xs text-slate-600 mb-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${stage.dot}`} />
                  <span className="font-semibold truncate">{stage.label}</span>
                </div>
                <div className="text-sm font-bold text-slate-900">{count}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{formatCurrency(stageVal)}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Two Column Layout: Follow-ups Queue & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Action Items: Follow-ups */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Follow-Up Queue
              </h2>
              <p className="text-[11px] text-slate-400">Scheduled calls, meetings, & check-ins</p>
            </div>
            <button
              onClick={onNavigateToTasks}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={13} />
            </button>
          </div>

          <div className="flex-1 mt-3 divide-y divide-slate-100 overflow-y-auto max-h-80">
            {dueFollowUpsList.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No pending follow-ups right now.
              </div>
            ) : (
              dueFollowUpsList.slice(0, 5).map(({ lead, followUp, isLate, isToday }) => (
                <div
                  key={followUp.id}
                  className="py-3 flex items-start justify-between gap-3 group"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onSelectLead(lead)}
                        className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition truncate text-left"
                      >
                        {lead.fullName}
                      </button>
                      <span className="text-[10px] text-slate-400 truncate">· {lead.company}</span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 line-clamp-1">
                      {followUp.notes || `Scheduled ${followUp.type}`}
                    </p>

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1.5">
                      <span
                        className={`font-semibold ${
                          isLate ? 'text-rose-600' : isToday ? 'text-amber-700' : 'text-slate-500'
                        }`}
                      >
                        {isLate ? 'Overdue' : isToday ? 'Due Today' : formatDate(followUp.dueDate)}
                      </span>
                      <span>·</span>
                      <span className="capitalize">{followUp.type}</span>
                      <span>·</span>
                      <span>{followUp.assignedUserName}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => updateFollowUpStatus(lead.id, followUp.id, 'completed')}
                      className="px-2.5 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition flex items-center gap-1"
                    >
                      <Check size={12} />
                      <span>Done</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity Timeline */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs flex flex-col">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Team Activity
              </h2>
              <p className="text-[11px] text-slate-400">Live feed of notes, calls, & status updates</p>
            </div>
          </div>

          <div className="flex-1 mt-3 divide-y divide-slate-100 overflow-y-auto max-h-80">
            {recentActivities.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                No recent activity logged yet.
              </div>
            ) : (
              recentActivities.slice(0, 6).map((act) => (
                <div key={act.id} className="py-2.5 flex items-start gap-2.5">
                  <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 flex-shrink-0 text-[10px] font-bold mt-0.5">
                    {act.userName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs text-slate-800">
                      <span className="font-semibold text-slate-900">{act.userName}</span>{' '}
                      <span className="text-slate-600">{act.description}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectLead(act.lead)}
                        className="font-medium text-indigo-600 hover:underline truncate"
                      >
                        {act.lead.fullName} ({act.lead.company})
                      </button>
                      <span>·</span>
                      <span>{formatRelativeTime(act.createdAt)}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

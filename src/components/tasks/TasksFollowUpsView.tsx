import React, { useState } from 'react';
import {
  CalendarCheck2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  PhoneCall,
  Send,
  Video,
  Building,
  Check,
  Calendar,
  User,
  ArrowUpRight,
  Filter,
  CheckSquare,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Lead, FollowUp, FollowUpStatus, FollowUpType } from '../../types/crm';
import {
  formatDate,
  formatDateTime,
  isDueToday,
  isOverdue,
} from '../../utils/crmHelpers';

interface TasksFollowUpsViewProps {
  onSelectLead: (lead: Lead) => void;
}

export const TasksFollowUpsView: React.FC<TasksFollowUpsViewProps> = ({ onSelectLead }) => {
  const {
    filteredLeadsForCurrentUser,
    updateFollowUpStatus,
    scheduleFollowUp,
    users,
    currentUser,
  } = useCRM();

  // Tab filter: 'all' | 'overdue' | 'today' | 'upcoming' | 'completed'
  const [filterTab, setFilterTab] = useState<'all' | 'overdue' | 'today' | 'upcoming' | 'completed'>(
    'all'
  );

  // Modal to add new follow-up
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [targetLeadId, setTargetLeadId] = useState(filteredLeadsForCurrentUser[0]?.id || '');
  const [followUpType, setFollowUpType] = useState<FollowUpType>('call');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueTime, setDueTime] = useState('14:00');
  const [assignedUserId, setAssignedUserId] = useState(currentUser.id);
  const [notes, setNotes] = useState('');

  // Collect all follow-ups across visible leads
  const allFollowUps: { lead: Lead; followUp: FollowUp; isOverdue: boolean; isToday: boolean }[] = [];

  filteredLeadsForCurrentUser.forEach((lead) => {
    (lead.followUps || []).forEach((f) => {
      const late = isOverdue(f.dueDate, f.dueTime);
      const today = isDueToday(f.dueDate);
      allFollowUps.push({
        lead,
        followUp: f,
        isOverdue: late,
        isToday: today,
      });
    });
  });

  // Filter based on selected tab
  const filteredList = allFollowUps.filter((item) => {
    if (filterTab === 'completed') return item.followUp.status === 'completed';
    if (item.followUp.status === 'completed') return false; // exclude completed from active queues

    if (filterTab === 'overdue') return item.isOverdue;
    if (filterTab === 'today') return item.isToday;
    if (filterTab === 'upcoming') return !item.isOverdue && !item.isToday;
    return true;
  });

  // Sort: Overdue first, then today, then chronological
  filteredList.sort((a, b) => {
    const timeA = new Date(`${a.followUp.dueDate}T${a.followUp.dueTime || '09:00'}:00`).getTime();
    const timeB = new Date(`${b.followUp.dueDate}T${b.followUp.dueTime || '09:00'}:00`).getTime();
    return timeA - timeB;
  });

  const overdueCount = allFollowUps.filter(
    (i) => i.followUp.status === 'pending' && i.isOverdue
  ).length;
  const todayCount = allFollowUps.filter(
    (i) => i.followUp.status === 'pending' && i.isToday
  ).length;

  const handleCreateFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    const targetLead = filteredLeadsForCurrentUser.find((l) => l.id === targetLeadId);
    if (!targetLead) return;

    scheduleFollowUp({
      leadId: targetLead.id,
      leadName: targetLead.fullName,
      company: targetLead.company,
      type: followUpType,
      assignedUserId,
      dueDate,
      dueTime,
      notes: notes.trim(),
    });

    setNotes('');
    setShowScheduleModal(false);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Tasks & Follow-Ups Queue</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {filteredList.length} items
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ensure no prospect slips through the cracks with scheduled touchpoints
          </p>
        </div>

        <button
          onClick={() => setShowScheduleModal(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
        >
          <Plus size={15} />
          <span>Schedule Follow-Up</span>
        </button>
      </div>

      {/* Segmented Filter Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Pending' },
          {
            id: 'overdue',
            label: `Overdue (${overdueCount})`,
            color: overdueCount > 0 ? 'text-rose-700' : undefined,
          },
          {
            id: 'today',
            label: `Due Today (${todayCount})`,
            color: todayCount > 0 ? 'text-amber-800' : undefined,
          },
          { id: 'upcoming', label: 'Upcoming' },
          { id: 'completed', label: 'Completed History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              filterTab === tab.id
                ? 'bg-slate-900 text-white shadow-2xs font-semibold'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            } ${tab.color || ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="py-20 text-center text-slate-500">
            <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
            <div className="font-bold text-slate-800 text-sm">No follow-ups in this queue</div>
            <p className="text-xs text-slate-400 mt-1">
              You are all caught up on scheduled interactions!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredList.map(({ lead, followUp, isOverdue: overdue, isToday: today }) => {
              const isCompleted = followUp.status === 'completed';

              return (
                <div
                  key={followUp.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition hover:bg-slate-50/70 ${
                    overdue && !isCompleted ? 'bg-rose-50/20' : ''
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <button
                      onClick={() =>
                        updateFollowUpStatus(
                          lead.id,
                          followUp.id,
                          isCompleted ? 'pending' : 'completed'
                        )
                      }
                      className={`w-5 h-5 rounded-md border mt-0.5 flex items-center justify-center transition flex-shrink-0 ${
                        isCompleted
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 hover:border-emerald-600'
                      }`}
                      title={isCompleted ? 'Mark Pending' : 'Mark Completed'}
                    >
                      {isCompleted && <Check size={13} />}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">
                          {followUp.type}
                        </span>
                        <button
                          onClick={() => onSelectLead(lead)}
                          className="text-xs font-bold text-slate-900 hover:text-indigo-600 transition truncate"
                        >
                          {lead.fullName}
                        </button>
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Building size={11} />
                          {lead.company}
                        </span>
                      </div>

                      <p
                        className={`text-xs mt-1.5 font-medium ${
                          isCompleted ? 'line-through text-slate-400' : 'text-slate-700'
                        }`}
                      >
                        {followUp.notes || `Scheduled ${followUp.type} touchpoint`}
                      </p>

                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2">
                        <span className="flex items-center gap-1">
                          <User size={11} />
                          <span>Rep: {followUp.assignedUserName}</span>
                        </span>
                        <span>·</span>
                        <span
                          className={`flex items-center gap-1 font-medium ${
                            overdue && !isCompleted
                              ? 'text-rose-600 font-bold'
                              : today && !isCompleted
                              ? 'text-amber-700 font-bold'
                              : 'text-slate-600'
                          }`}
                        >
                          <Clock size={11} />
                          <span>
                            {followUp.dueDate} at {followUp.dueTime}
                          </span>
                        </span>
                        {overdue && !isCompleted && (
                          <span className="text-[10px] uppercase font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                            Overdue
                          </span>
                        )}
                        {today && !isCompleted && (
                          <span className="text-[10px] uppercase font-bold text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                            Due Today
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-center">
                    {!isCompleted && (
                      <button
                        onClick={() => updateFollowUpStatus(lead.id, followUp.id, 'completed')}
                        className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition"
                      >
                        <Check size={12} />
                        <span>Done</span>
                      </button>
                    )}
                    <button
                      onClick={() => onSelectLead(lead)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg flex items-center gap-1 transition"
                    >
                      <span>View Lead</span>
                      <ArrowUpRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Schedule Follow-Up Modal */}
      {showScheduleModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-sm font-bold text-slate-900">Schedule Lead Follow-Up</h3>

            <form onSubmit={handleCreateFollowUp} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Associate with Lead *
                </label>
                <select
                  value={targetLeadId}
                  onChange={(e) => setTargetLeadId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                >
                  {filteredLeadsForCurrentUser.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.fullName} ({l.company})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Interaction Type
                  </label>
                  <select
                    value={followUpType}
                    onChange={(e) => setFollowUpType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="call">Call</option>
                    <option value="email">Email</option>
                    <option value="demo">Product Demo</option>
                    <option value="check-in">Check-in</option>
                    <option value="proposal">Send Proposal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Assigned Rep
                  </label>
                  <select
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Due Time
                  </label>
                  <input
                    type="time"
                    value={dueTime}
                    onChange={(e) => setDueTime(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Notes / Objective
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Follow up on Q4 renewal pricing questions"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScheduleModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

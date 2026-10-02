import React, { useState } from 'react';
import {
  X,
  Building,
  Mail,
  Phone,
  Globe,
  MapPin,
  Calendar,
  Clock,
  User,
  Tag as TagIcon,
  Plus,
  PhoneCall,
  Video,
  Send,
  MessageSquare,
  CheckCircle2,
  Trash2,
  Edit,
  UserCheck,
  ChevronDown,
  AlertCircle,
  FileText,
  DollarSign,
  Activity as ActivityIcon,
  Check,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Lead, ActivityType, FollowUpType } from '../../types/crm';
import {
  formatCurrency,
  formatDate,
  formatDateTime,
  formatRelativeTime,
  getPriorityBadge,
  getStatusBadgeClasses,
  isDueToday,
  isOverdue,
} from '../../utils/crmHelpers';

interface LeadDetailModalProps {
  leadId: string;
  onClose: () => void;
  onEditLead: (lead: Lead) => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  leadId,
  onClose,
  onEditLead,
}) => {
  const {
    leads,
    updateLead,
    deleteLead,
    addNote,
    logActivity,
    scheduleFollowUp,
    updateFollowUpStatus,
    statuses,
    sources,
    tags,
    users,
    currentUser,
    canDeleteLeads,
  } = useCRM();

  const lead = leads.find((l) => l.id === leadId);

  // Tabs: 'timeline' | 'notes' | 'followups' | 'details'
  const [activeTab, setActiveTab] = useState<'timeline' | 'notes' | 'followups' | 'details'>(
    'timeline'
  );

  // Quick Action Modal states
  const [showLogActivity, setShowLogActivity] = useState(false);
  const [activityType, setActivityType] = useState<ActivityType>('call');
  const [activityDesc, setActivityDesc] = useState('');
  const [activityOutcome, setActivityOutcome] = useState('');
  const [activityNextFollowUp, setActivityNextFollowUp] = useState('');

  const [showScheduleFollowUp, setShowScheduleFollowUp] = useState(false);
  const [followUpType, setFollowUpType] = useState<FollowUpType>('call');
  const [followUpDate, setFollowUpDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [followUpTime, setFollowUpTime] = useState('10:00');
  const [followUpAssignee, setFollowUpAssignee] = useState(lead?.assignedUserId || currentUser.id);
  const [followUpNotes, setFollowUpNotes] = useState('');

  // Quick note input
  const [newNoteText, setNewNoteText] = useState('');

  if (!lead) return null;

  const currentStatus = statuses.find((s) => s.id === lead.status);
  const statusBadge = getStatusBadgeClasses(currentStatus?.color || 'slate');
  const priorityBadge = getPriorityBadge(lead.priority);
  const assignedUser = users.find((u) => u.id === lead.assignedUserId);
  const sourceDef = sources.find((s) => s.id === lead.source);

  // Handlers
  const handleStatusChange = (newStatusId: string) => {
    updateLead(lead.id, { status: newStatusId }, true);
  };

  const handleAssigneeChange = (newUserId: string) => {
    updateLead(lead.id, { assignedUserId: newUserId || undefined }, true);
  };

  const handlePriorityChange = (newPriority: any) => {
    updateLead(lead.id, { priority: newPriority }, true);
  };

  const handleAddQuickNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim()) return;
    addNote(lead.id, newNoteText.trim());
    setNewNoteText('');
  };

  const handleSubmitActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activityDesc.trim()) return;

    logActivity(lead.id, {
      type: activityType,
      description: activityDesc.trim(),
      outcome: activityOutcome.trim() || undefined,
      nextFollowUpDate: activityNextFollowUp || undefined,
    });

    setActivityDesc('');
    setActivityOutcome('');
    setActivityNextFollowUp('');
    setShowLogActivity(false);
  };

  const handleSubmitFollowUp = (e: React.FormEvent) => {
    e.preventDefault();
    scheduleFollowUp({
      leadId: lead.id,
      leadName: lead.fullName,
      company: lead.company,
      type: followUpType,
      assignedUserId: followUpAssignee,
      dueDate: followUpDate,
      dueTime: followUpTime,
      notes: followUpNotes.trim(),
    });

    setFollowUpNotes('');
    setShowScheduleFollowUp(false);
  };

  const handleDelete = () => {
    deleteLead(lead.id);
    onClose();
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'call':
        return <PhoneCall size={13} className="text-emerald-600" />;
      case 'email':
        return <Send size={13} className="text-blue-600" />;
      case 'meeting':
        return <Video size={13} className="text-purple-600" />;
      case 'note':
        return <FileText size={13} className="text-amber-600" />;
      case 'status_change':
        return <CheckCircle2 size={13} className="text-indigo-600" />;
      case 'reassign':
        return <UserCheck size={13} className="text-cyan-600" />;
      case 'follow-up':
        return <Clock size={13} className="text-rose-600" />;
      default:
        return <ActivityIcon size={13} className="text-slate-500" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header (PRD Section 18) */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900 truncate">
                  {lead.fullName}
                </h2>
                <span className="text-xs text-slate-400 font-mono px-2 py-0.5 bg-white border border-slate-200 rounded">
                  {lead.id}
                </span>

                {/* Priority Selector */}
                <select
                  value={lead.priority}
                  onChange={(e) => handlePriorityChange(e.target.value)}
                  className="text-[11px] font-semibold bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-700 focus:outline-none capitalize"
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-600 mt-1">
                <span className="font-semibold text-slate-800">{lead.company}</span>
                {lead.jobTitle && <span>· {lead.jobTitle}</span>}
                {lead.estimatedValue ? (
                  <>
                    <span>·</span>
                    <span className="font-bold text-emerald-700">
                      {formatCurrency(lead.estimatedValue)}
                    </span>
                  </>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => onEditLead(lead)}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-white rounded-lg border border-slate-200 transition"
                title="Edit Lead Details"
              >
                <Edit size={15} />
              </button>
              {canDeleteLeads && (
                <button
                  onClick={handleDelete}
                  className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg border border-rose-200 transition"
                  title="Delete Lead"
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg border border-slate-200 transition"
                title="Close"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Quick Stage and Assignee Selectors Bar */}
          <div className="mt-4 pt-4 border-t border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Stage Selector */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Stage:
              </span>
              <select
                value={lead.status}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="text-xs font-bold text-slate-900 bg-transparent focus:outline-none flex-1"
              >
                {statuses.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Assigned User */}
            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Assignee:
              </span>
              <select
                value={lead.assignedUserId || ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="text-xs font-medium text-slate-900 bg-transparent focus:outline-none flex-1 truncate"
              >
                <option value="">Unassigned</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Action Toolbar (PRD Section 18) */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1">
            <button
              onClick={() => {
                setActivityType('call');
                setShowLogActivity(true);
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap"
            >
              <PhoneCall size={13} className="text-emerald-600" />
              <span>Log Call</span>
            </button>
            <button
              onClick={() => {
                setActivityType('email');
                setShowLogActivity(true);
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap"
            >
              <Send size={13} className="text-blue-600" />
              <span>Log Email</span>
            </button>
            <button
              onClick={() => {
                setActivityType('meeting');
                setShowLogActivity(true);
              }}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap"
            >
              <Video size={13} className="text-purple-600" />
              <span>Log Meeting</span>
            </button>
            <button
              onClick={() => setShowScheduleFollowUp(true)}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-semibold text-indigo-700 flex items-center gap-1.5 transition shadow-2xs whitespace-nowrap"
            >
              <Clock size={13} className="text-indigo-600" />
              <span>Schedule Follow-Up</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-slate-200 px-6 flex items-center gap-4 bg-white select-none">
          {[
            { id: 'timeline', label: 'Activity Timeline', count: lead.activities?.length || 0 },
            { id: 'notes', label: 'Internal Notes', count: lead.notes?.length || 0 },
            {
              id: 'followups',
              label: 'Follow-Ups & Tasks',
              count: (lead.followUps?.length || 0) + (lead.tasks?.length || 0),
            },
            { id: 'details', label: 'Contact Details', count: null },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 text-xs font-semibold border-b-2 transition flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== null && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Modal Body / Tab Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* TAB 1: Activity Timeline */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Chronological Lead History</span>
                <button
                  onClick={() => setShowLogActivity(true)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                >
                  <Plus size={13} />
                  <span>Log Interaction</span>
                </button>
              </div>

              <div className="relative pl-6 space-y-6 before:content-[''] before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                {(lead.activities || []).map((activity) => (
                  <div key={activity.id} className="relative group">
                    {/* Timeline icon node */}
                    <div className="absolute -left-6 top-0.5 w-5 h-5 rounded-full bg-white border border-slate-300 flex items-center justify-center shadow-2xs">
                      {getActivityIcon(activity.type)}
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-800">{activity.userName}</span>
                        <span>{formatDateTime(activity.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {activity.description}
                      </p>
                      {activity.outcome && (
                        <div className="mt-2 text-[11px] p-2 bg-white rounded border border-slate-200 text-slate-600">
                          <span className="font-semibold text-slate-700">Outcome:</span>{' '}
                          {activity.outcome}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: Notes */}
          {activeTab === 'notes' && (
            <div className="space-y-6">
              {/* Add Note Form */}
              <form onSubmit={handleAddQuickNote} className="space-y-2">
                <label className="block text-xs font-bold text-slate-800">
                  Add Timestamped Internal Note
                </label>
                <textarea
                  rows={3}
                  placeholder="Record insights, customer objections, or internal handoff notes..."
                  value={newNoteText}
                  onChange={(e) => setNewNoteText(e.target.value)}
                  className="w-full text-xs p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 focus:bg-white"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newNoteText.trim()}
                    className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-xs rounded-lg shadow-2xs transition"
                  >
                    Post Note
                  </button>
                </div>
              </form>

              {/* Notes List */}
              <div className="space-y-3 divide-y divide-slate-100">
                {(lead.notes || []).length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    No notes recorded yet. Use the box above to write the first note.
                  </div>
                ) : (
                  (lead.notes || []).map((note) => (
                    <div key={note.id} className="pt-3 first:pt-0">
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                        <span className="font-semibold text-slate-800">{note.authorName}</span>
                        <span>{formatDateTime(note.createdAt)}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 whitespace-pre-wrap">
                        {note.text}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 3: Follow-ups & Tasks */}
          {activeTab === 'followups' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-900">Follow-Up Schedule</h3>
                  <p className="text-[11px] text-slate-500">Scheduled touchpoints and commitments</p>
                </div>
                <button
                  onClick={() => setShowScheduleFollowUp(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus size={13} />
                  <span>Schedule Action</span>
                </button>
              </div>

              <div className="space-y-3">
                {(lead.followUps || []).length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400">
                    No follow-ups scheduled for this lead.
                  </div>
                ) : (
                  (lead.followUps || []).map((fol) => {
                    const overdue = isOverdue(fol.dueDate, fol.dueTime);
                    const today = isDueToday(fol.dueDate);

                    return (
                      <div
                        key={fol.id}
                        className={`p-3.5 rounded-xl border transition ${
                          fol.status === 'completed'
                            ? 'bg-slate-50 border-slate-200 opacity-60'
                            : overdue
                            ? 'bg-rose-50/50 border-rose-200'
                            : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-slate-900 uppercase">
                                {fol.type}
                              </span>
                              {fol.status === 'completed' ? (
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded font-bold">
                                  Completed
                                </span>
                              ) : overdue ? (
                                <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded font-bold">
                                  Overdue
                                </span>
                              ) : today ? (
                                <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded font-bold">
                                  Due Today
                                </span>
                              ) : null}
                            </div>
                            <p className="text-xs text-slate-700 mt-1">{fol.notes}</p>
                            <div className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                              <span>Due: {fol.dueDate} at {fol.dueTime}</span>
                              <span>·</span>
                              <span>Assigned to: {fol.assignedUserName}</span>
                            </div>
                          </div>

                          {fol.status !== 'completed' && (
                            <button
                              onClick={() => updateFollowUpStatus(lead.id, fol.id, 'completed')}
                              className="px-2.5 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg flex items-center gap-1 transition"
                            >
                              <Check size={12} />
                              <span>Mark Done</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Contact & CRM Details */}
          {activeTab === 'details' && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Contact Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Primary Email
                    </span>
                    {lead.email ? (
                      <a
                        href={`mailto:${lead.email}`}
                        className="text-indigo-600 hover:underline font-medium"
                      >
                        {lead.email}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Primary Phone
                    </span>
                    {lead.phone ? (
                      <a
                        href={`tel:${lead.phone}`}
                        className="text-slate-800 hover:text-indigo-600 font-medium"
                      >
                        {lead.phone}
                      </a>
                    ) : (
                      '—'
                    )}
                  </div>
                  {lead.secondaryEmail && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Secondary Email
                      </span>
                      <a
                        href={`mailto:${lead.secondaryEmail}`}
                        className="text-indigo-600 hover:underline"
                      >
                        {lead.secondaryEmail}
                      </a>
                    </div>
                  )}
                  {lead.secondaryPhone && (
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Secondary Phone
                      </span>
                      <a href={`tel:${lead.secondaryPhone}`} className="text-slate-800">
                        {lead.secondaryPhone}
                      </a>
                    </div>
                  )}
                  {lead.website && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                        Website
                      </span>
                      <a
                        href={lead.website}
                        target="_blank"
                        rel="noreferrer"
                        className="text-indigo-600 hover:underline"
                      >
                        {lead.website}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Physical Address */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Physical Address
                </h4>
                <div className="text-xs text-slate-700">
                  {lead.addressLine1 || lead.city ? (
                    <div>
                      {lead.addressLine1 && <div>{lead.addressLine1}</div>}
                      {lead.addressLine2 && <div>{lead.addressLine2}</div>}
                      <div>
                        {[lead.city, lead.state, lead.postalCode].filter(Boolean).join(', ')}
                      </div>
                      {lead.country && <div>{lead.country}</div>}
                    </div>
                  ) : (
                    <span className="text-slate-400 italic">No address recorded</span>
                  )}
                </div>
              </div>

              {/* CRM System Meta */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  CRM Meta & Tracking
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Lead Source
                    </span>
                    <span className="font-medium text-slate-800">
                      {sourceDef?.label || lead.source}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Created Date
                    </span>
                    <span>{formatDateTime(lead.createdDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Last Contacted
                    </span>
                    <span>{formatDateTime(lead.lastContactedDate)}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">
                      Tags
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {lead.tags.map((tId) => {
                        const tagObj = tags.find((t) => t.id === tId);
                        return (
                          <span
                            key={tId}
                            className="text-[10px] px-2 py-0.5 bg-slate-200/80 text-slate-700 rounded"
                          >
                            {tagObj?.label || tId}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal 1: Log Interaction */}
        {showLogActivity && (
          <div className="fixed inset-0 z-60 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Log Interaction with {lead.fullName}
                </h3>
                <button onClick={() => setShowLogActivity(false)} className="text-slate-400">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitActivity} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Activity Type
                  </label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500"
                  >
                    <option value="call">Phone Call</option>
                    <option value="email">Email</option>
                    <option value="meeting">Video Meeting / Demo</option>
                    <option value="sms">SMS Text</option>
                    <option value="note">Internal Review Note</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Notes / Description *
                  </label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Discussed pricing model, next steps..."
                    value={activityDesc}
                    onChange={(e) => setActivityDesc(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Outcome
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Qualified, Agreed to send NDA, Left voicemail"
                    value={activityOutcome}
                    onChange={(e) => setActivityOutcome(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowLogActivity(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs"
                  >
                    Save Activity
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal 2: Schedule Follow-Up */}
        {showScheduleFollowUp && (
          <div className="fixed inset-0 z-60 bg-black/40 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">Schedule Follow-Up</h3>
                <button onClick={() => setShowScheduleFollowUp(false)} className="text-slate-400">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitFollowUp} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Action Type
                    </label>
                    <select
                      value={followUpType}
                      onChange={(e) => setFollowUpType(e.target.value as any)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    >
                      <option value="call">Call</option>
                      <option value="email">Send Email</option>
                      <option value="demo">Product Demo</option>
                      <option value="check-in">Check-in</option>
                      <option value="proposal">Send Proposal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Assigned To
                    </label>
                    <select
                      value={followUpAssignee}
                      onChange={(e) => setFollowUpAssignee(e.target.value)}
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
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                      Due Time
                    </label>
                    <input
                      type="time"
                      value={followUpTime}
                      onChange={(e) => setFollowUpTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Follow-Up Instructions / Note
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Check if procurement approved proposal..."
                    value={followUpNotes}
                    onChange={(e) => setFollowUpNotes(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowScheduleFollowUp(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs"
                  >
                    Set Follow-Up
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

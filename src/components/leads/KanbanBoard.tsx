import React, { useState } from 'react';
import { Lead } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import {
  formatCurrency,
  formatDate,
  getPriorityBadge,
  getStatusBadgeClasses,
  isDueToday,
  isOverdue,
} from '../../utils/crmHelpers';
import {
  Building,
  Clock,
  ChevronRight,
  ChevronLeft,
  GripVertical,
  Plus,
  CheckCircle2,
  Tag as TagIcon,
  Sparkles,
} from 'lucide-react';

interface KanbanBoardProps {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onOpenNewLead?: () => void;
}

export const KanbanBoard: React.FC<KanbanBoardProps> = ({
  leads,
  onSelectLead,
  onOpenNewLead,
}) => {
  const { statuses, updateLead, users, tags } = useCRM();

  // Active sorted pipeline stages
  const activeStatuses = statuses.filter((s) => s.active).sort((a, b) => a.order - b.order);

  // Drag & drop state
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [moveNotification, setMoveNotification] = useState<{
    leadName: string;
    stageLabel: string;
  } | null>(null);

  // Drag Handlers
  const handleDragStart = (e: React.DragEvent, lead: Lead) => {
    e.dataTransfer.setData('text/plain', lead.id);
    e.dataTransfer.effectAllowed = 'move';
    setDraggedLeadId(lead.id);
  };

  const handleDragEnd = () => {
    setDraggedLeadId(null);
    setDragOverColumnId(null);
  };

  const handleDragOverColumn = (e: React.DragEvent, statusId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverColumnId !== statusId) {
      setDragOverColumnId(statusId);
    }
  };

  const handleDragLeaveColumn = (e: React.DragEvent, statusId: string) => {
    // Only clear if leaving the column element itself
    if (e.currentTarget === e.target) {
      if (dragOverColumnId === statusId) {
        setDragOverColumnId(null);
      }
    }
  };

  const handleDropOnColumn = (e: React.DragEvent, targetStatusId: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('text/plain') || draggedLeadId;
    setDragOverColumnId(null);
    setDraggedLeadId(null);

    if (!leadId) return;

    const leadToMove = leads.find((l) => l.id === leadId);
    if (!leadToMove) return;

    // Only update if moving to a different stage
    if (leadToMove.status !== targetStatusId) {
      updateLead(leadId, { status: targetStatusId }, true);

      const targetStatus = activeStatuses.find((s) => s.id === targetStatusId);
      if (targetStatus) {
        setMoveNotification({
          leadName: leadToMove.fullName,
          stageLabel: targetStatus.label,
        });
        setTimeout(() => {
          setMoveNotification(null);
        }, 3000);
      }
    }
  };

  // Keyboard / Click quick move fallback
  const handleMoveStage = (lead: Lead, direction: 'prev' | 'next', e: React.MouseEvent) => {
    e.stopPropagation();
    const currentIdx = activeStatuses.findIndex((s) => s.id === lead.status);
    if (currentIdx === -1) return;

    const targetIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (targetIdx >= 0 && targetIdx < activeStatuses.length) {
      const nextStage = activeStatuses[targetIdx];
      updateLead(lead.id, { status: nextStage.id }, true);
      setMoveNotification({
        leadName: lead.fullName,
        stageLabel: nextStage.label,
      });
      setTimeout(() => setMoveNotification(null), 3000);
    }
  };

  const draggedLead = draggedLeadId ? leads.find((l) => l.id === draggedLeadId) : null;

  return (
    <div className="relative space-y-3">
      {/* Visual notification banner when lead is moved */}
      {moveNotification && (
        <div className="flex items-center gap-2 p-2.5 px-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold shadow-xs animate-in slide-in-from-top-1 transition">
          <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
          <span>
            Moved <strong className="text-slate-900">{moveNotification.leadName}</strong> to stage{' '}
            <span className="px-1.5 py-0.5 bg-emerald-100/80 rounded text-emerald-900">
              {moveNotification.stageLabel}
            </span>
          </span>
        </div>
      )}

      {/* Helpful Drag instructions sub-header */}
      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
        <span className="flex items-center gap-1.5">
          <Sparkles size={13} className="text-indigo-600" />
          <span>
            Drag & drop cards across stages to advance leads in the sales pipeline
          </span>
        </span>
        <span className="text-[11px] font-medium text-slate-400">
          {leads.length} leads in view · {activeStatuses.length} stages
        </span>
      </div>

      {/* Kanban Board Container */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4 min-w-max items-start">
          {activeStatuses.map((status, statusIdx) => {
            const statusLeads = leads.filter((l) => l.status === status.id);
            const totalValue = statusLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
            const badge = getStatusBadgeClasses(status.color);
            const isColumnOver = dragOverColumnId === status.id;
            const isSourceColumn = draggedLead && draggedLead.status === status.id;

            return (
              <div
                key={status.id}
                onDragOver={(e) => handleDragOverColumn(e, status.id)}
                onDragLeave={(e) => handleDragLeaveColumn(e, status.id)}
                onDrop={(e) => handleDropOnColumn(e, status.id)}
                className={`w-76 flex-shrink-0 rounded-2xl p-3 border flex flex-col transition-all duration-150 min-h-[520px] ${
                  isColumnOver
                    ? 'bg-indigo-50/70 border-indigo-400 ring-2 ring-indigo-400/30 shadow-md'
                    : 'bg-slate-100/70 border-slate-200/90'
                }`}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/90">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full ${badge.dot}`} />
                    <span className="text-xs font-bold text-slate-900 tracking-tight">
                      {status.label}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full border ${
                        statusLeads.length > 0
                          ? 'bg-white text-slate-700 border-slate-200'
                          : 'bg-slate-200/60 text-slate-400 border-slate-200'
                      }`}
                    >
                      {statusLeads.length}
                    </span>
                  </div>

                  <span className="text-xs font-bold text-slate-700">
                    {formatCurrency(totalValue)}
                  </span>
                </div>

                {/* Cards Column Body */}
                <div className="space-y-2.5 overflow-y-auto pr-1 flex-1 min-h-[380px]">
                  {/* Drop placeholder when hovering over this column */}
                  {isColumnOver && !isSourceColumn && (
                    <div className="border-2 border-dashed border-indigo-400 bg-indigo-100/40 rounded-xl p-3 text-center text-xs font-semibold text-indigo-700 animate-pulse">
                      Drop lead into {status.label}
                    </div>
                  )}

                  {statusLeads.length === 0 && !isColumnOver ? (
                    <div className="h-36 border border-dashed border-slate-300/80 rounded-xl flex flex-col items-center justify-center text-center p-4 text-slate-400 select-none">
                      <div className="w-8 h-8 rounded-full bg-slate-200/60 flex items-center justify-center text-slate-400 mb-1.5">
                        <GripVertical size={16} />
                      </div>
                      <span className="text-xs font-medium text-slate-500">No leads in stage</span>
                      <span className="text-[10px] text-slate-400 mt-0.5">
                        Drag leads here to move
                      </span>
                    </div>
                  ) : (
                    statusLeads.map((lead) => {
                      const priority = getPriorityBadge(lead.priority);
                      const assigned = users.find((u) => u.id === lead.assignedUserId);
                      const isDue = isDueToday(lead.nextFollowUpDate);
                      const isLate = isOverdue(lead.nextFollowUpDate);
                      const isBeingDragged = draggedLeadId === lead.id;

                      return (
                        <div
                          key={lead.id}
                          draggable
                          onDragStart={(e) => handleDragStart(e, lead)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            if (!draggedLeadId) onSelectLead(lead);
                          }}
                          className={`bg-white p-3 rounded-xl border shadow-xs transition-all duration-150 cursor-grab active:cursor-grabbing group select-none ${
                            isBeingDragged
                              ? 'opacity-40 border-dashed border-indigo-400 scale-[0.98]'
                              : 'border-slate-200 hover:border-indigo-400 hover:shadow-sm'
                          }`}
                        >
                          {/* Card Top: Drag Handle + Lead Name + ID */}
                          <div className="flex items-start justify-between gap-1.5 mb-1.5">
                            <div className="flex items-start gap-1.5 min-w-0">
                              <span
                                className="text-slate-300 group-hover:text-slate-500 transition mt-0.5 flex-shrink-0 cursor-grab"
                                title="Drag card to move stage"
                              >
                                <GripVertical size={14} />
                              </span>
                              <div className="min-w-0">
                                <span className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition block truncate">
                                  {lead.fullName}
                                </span>
                              </div>
                            </div>
                            <span className="text-[9px] text-slate-400 font-mono flex-shrink-0 bg-slate-50 px-1 py-0.5 rounded border border-slate-100">
                              {lead.id}
                            </span>
                          </div>

                          {/* Company & Job Title */}
                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 mb-2.5 pl-5 truncate">
                            <Building size={12} className="text-slate-400 flex-shrink-0" />
                            <span className="truncate font-medium">{lead.company}</span>
                            {lead.jobTitle && (
                              <span className="text-slate-400 truncate text-[10px]">
                                · {lead.jobTitle}
                              </span>
                            )}
                          </div>

                          {/* Deal Value & Priority Badge */}
                          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                            <span className="font-bold text-slate-900 text-xs">
                              {formatCurrency(lead.estimatedValue)}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
                              <span className={`text-[10px] font-semibold capitalize ${priority.text}`}>
                                {priority.label}
                              </span>
                            </div>
                          </div>

                          {/* Tags Preview */}
                          {lead.tags && lead.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap mt-2 pt-1.5 border-t border-slate-50">
                              {lead.tags.slice(0, 2).map((tId) => {
                                const tagObj = tags.find((t) => t.id === tId);
                                if (!tagObj) return null;
                                return (
                                  <span
                                    key={tId}
                                    className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200"
                                  >
                                    {tagObj.label}
                                  </span>
                                );
                              })}
                              {lead.tags.length > 2 && (
                                <span className="text-[9px] text-slate-400">
                                  +{lead.tags.length - 2}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Card Footer: Assigned Rep & Next Follow-Up */}
                          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                            <div className="flex items-center gap-1.5 min-w-0">
                              {assigned ? (
                                <div className="flex items-center gap-1.5 min-w-0">
                                  <img
                                    src={assigned.avatar}
                                    alt={assigned.name}
                                    title={`Assigned Rep: ${assigned.name}`}
                                    className="w-4 h-4 rounded-full object-cover border border-slate-200 flex-shrink-0"
                                  />
                                  <span className="text-[10px] text-slate-600 truncate max-w-[85px]">
                                    {assigned.name.split(' ')[0]}
                                  </span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">Unassigned</span>
                              )}
                            </div>

                            {lead.nextFollowUpDate && (
                              <span
                                className={`flex items-center gap-1 text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                  isLate
                                    ? 'bg-rose-50 text-rose-700'
                                    : isDue
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'text-slate-500'
                                }`}
                              >
                                <Clock size={10} />
                                <span>{formatDate(lead.nextFollowUpDate)}</span>
                              </span>
                            )}
                          </div>

                          {/* Quick Step Buttons (Accessible Navigation fallback) */}
                          <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 opacity-60 group-hover:opacity-100 transition">
                            <button
                              type="button"
                              disabled={statusIdx === 0}
                              onClick={(e) => handleMoveStage(lead, 'prev', e)}
                              className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded disabled:opacity-20 disabled:hover:text-slate-400 transition"
                              title="Move back to previous stage"
                            >
                              <ChevronLeft size={13} />
                            </button>

                            <span className="text-[9px] text-slate-400 uppercase tracking-wider font-semibold">
                              Drag or Step
                            </span>

                            <button
                              type="button"
                              disabled={statusIdx === activeStatuses.length - 1}
                              onClick={(e) => handleMoveStage(lead, 'next', e)}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded disabled:opacity-20 disabled:hover:text-slate-400 transition"
                              title="Advance to next stage"
                            >
                              <ChevronRight size={13} />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Quick Add Lead to Column */}
                {onOpenNewLead && (
                  <button
                    type="button"
                    onClick={onOpenNewLead}
                    className="mt-2 w-full py-1.5 px-2 text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition flex items-center justify-center gap-1"
                  >
                    <Plus size={13} />
                    <span>Add Lead</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

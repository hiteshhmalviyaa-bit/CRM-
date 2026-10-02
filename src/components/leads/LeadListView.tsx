import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Trash2,
  UserCheck,
  Tag as TagIcon,
  CheckSquare,
  Square,
  SlidersHorizontal,
  ChevronDown,
  LayoutList,
  Kanban,
  Building,
  Mail,
  Phone,
  Calendar,
  AlertCircle,
  MoreVertical,
  Plus,
  RefreshCw,
  X,
  Clock,
  Sparkles,
  CheckCircle,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Lead, LeadPriority } from '../../types/crm';
import {
  formatCurrency,
  formatDate,
  formatRelativeTime,
  getPriorityBadge,
  getStatusBadgeClasses,
  isDueToday,
  isOverdue,
} from '../../utils/crmHelpers';
import { KanbanBoard } from './KanbanBoard';

interface LeadListViewProps {
  onSelectLead: (lead: Lead) => void;
  onOpenNewLead: () => void;
  initialStatusFilter?: string;
}

type SortField =
  | 'fullName'
  | 'createdDate'
  | 'updatedDate'
  | 'nextFollowUpDate'
  | 'priority'
  | 'status'
  | 'company'
  | 'estimatedValue';

export const LeadListView: React.FC<LeadListViewProps> = ({
  onSelectLead,
  onOpenNewLead,
  initialStatusFilter,
}) => {
  const {
    filteredLeadsForCurrentUser,
    statuses,
    sources,
    tags,
    users,
    currentUser,
    bulkUpdateStatus,
    bulkAssignLeads,
    bulkAddTag,
    bulkDeleteLeads,
    canDeleteLeads,
    canExport,
  } = useCRM();

  // View mode: Table vs Kanban
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedQuickFilter, setSelectedQuickFilter] = useState<
    'all' | 'my' | 'due' | 'unassigned' | 'urgent'
  >('all');
  const [statusFilter, setStatusFilter] = useState<string>(initialStatusFilter || 'all');
  const [assignedFilter, setAssignedFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Sorting
  const [sortField, setSortField] = useState<SortField>('createdDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Bulk Selection
  const [selectedLeadIds, setSelectedLeadIds] = useState<string[]>([]);
  const [bulkActionDropdown, setBulkActionDropdown] = useState<'status' | 'assign' | 'tag' | null>(
    null
  );

  // Filter application
  const filteredLeads = useMemo(() => {
    return filteredLeadsForCurrentUser.filter((lead) => {
      // 1. Text Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesQuery =
          lead.fullName.toLowerCase().includes(q) ||
          lead.company.toLowerCase().includes(q) ||
          lead.email.toLowerCase().includes(q) ||
          lead.phone.toLowerCase().includes(q) ||
          lead.id.toLowerCase().includes(q) ||
          (lead.city && lead.city.toLowerCase().includes(q)) ||
          (lead.state && lead.state.toLowerCase().includes(q));

        if (!matchesQuery) return false;
      }

      // 2. Quick Filter Tabs
      if (selectedQuickFilter === 'my') {
        if (lead.assignedUserId !== currentUser.id) return false;
      } else if (selectedQuickFilter === 'due') {
        const hasDueFollowUp = (lead.followUps || []).some(
          (f) => f.status === 'pending' && (isDueToday(f.dueDate) || isOverdue(f.dueDate, f.dueTime))
        );
        if (!hasDueFollowUp && !isDueToday(lead.nextFollowUpDate) && !isOverdue(lead.nextFollowUpDate)) {
          return false;
        }
      } else if (selectedQuickFilter === 'unassigned') {
        if (lead.assignedUserId) return false;
      } else if (selectedQuickFilter === 'urgent') {
        if (lead.priority !== 'urgent' && lead.priority !== 'high') return false;
      }

      // 3. Dropdown Filters
      if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
      if (assignedFilter !== 'all') {
        if (assignedFilter === 'unassigned' && lead.assignedUserId) return false;
        if (assignedFilter !== 'unassigned' && lead.assignedUserId !== assignedFilter) return false;
      }
      if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false;
      if (priorityFilter !== 'all' && lead.priority !== priorityFilter) return false;
      if (tagFilter !== 'all' && !lead.tags.includes(tagFilter)) return false;

      return true;
    });
  }, [
    filteredLeadsForCurrentUser,
    searchQuery,
    selectedQuickFilter,
    statusFilter,
    assignedFilter,
    sourceFilter,
    priorityFilter,
    tagFilter,
    currentUser.id,
  ]);

  // Sort leads
  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      if (sortField === 'priority') {
        const weights: Record<LeadPriority, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
        valA = weights[a.priority] || 0;
        valB = weights[b.priority] || 0;
      } else if (sortField === 'estimatedValue') {
        valA = a.estimatedValue || 0;
        valB = b.estimatedValue || 0;
      } else {
        valA = valA || '';
        valB = valB || '';
      }

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredLeads, sortField, sortOrder]);

  // Bulk selection handlers
  const handleSelectAll = () => {
    if (selectedLeadIds.length === sortedLeads.length) {
      setSelectedLeadIds([]);
    } else {
      setSelectedLeadIds(sortedLeads.map((l) => l.id));
    }
  };

  const handleToggleSelect = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedLeadIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Sort toggle helper
  const handleSortToggle = (field: SortField) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  // Export to CSV
  const handleExportCSV = () => {
    const leadsToExport =
      selectedLeadIds.length > 0
        ? filteredLeads.filter((l) => selectedLeadIds.includes(l.id))
        : filteredLeads;

    const headers = [
      'Lead ID',
      'Full Name',
      'Company',
      'Job Title',
      'Email',
      'Phone',
      'Status',
      'Priority',
      'Source',
      'Assigned User',
      'Deal Value',
      'City',
      'State',
      'Country',
      'Created Date',
      'Next Follow-Up',
    ];

    const rows = leadsToExport.map((lead) => {
      const assigned = users.find((u) => u.id === lead.assignedUserId)?.name || 'Unassigned';
      const statusLabel = statuses.find((s) => s.id === lead.status)?.label || lead.status;
      const sourceLabel = sources.find((s) => s.id === lead.source)?.label || lead.source;

      return [
        `"${lead.id}"`,
        `"${lead.fullName.replace(/"/g, '""')}"`,
        `"${lead.company.replace(/"/g, '""')}"`,
        `"${(lead.jobTitle || '').replace(/"/g, '""')}"`,
        `"${lead.email || ''}"`,
        `"${lead.phone || ''}"`,
        `"${statusLabel}"`,
        `"${lead.priority}"`,
        `"${sourceLabel}"`,
        `"${assigned}"`,
        lead.estimatedValue || 0,
        `"${lead.city || ''}"`,
        `"${lead.state || ''}"`,
        `"${lead.country || ''}"`,
        `"${lead.createdDate}"`,
        `"${lead.nextFollowUpDate || ''}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Leads_Export_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset filters
  const resetFilters = () => {
    setSearchQuery('');
    setSelectedQuickFilter('all');
    setStatusFilter('all');
    setAssignedFilter('all');
    setSourceFilter('all');
    setPriorityFilter('all');
    setTagFilter('all');
  };

  const hasActiveFilters =
    searchQuery ||
    selectedQuickFilter !== 'all' ||
    statusFilter !== 'all' ||
    assignedFilter !== 'all' ||
    sourceFilter !== 'all' ||
    priorityFilter !== 'all' ||
    tagFilter !== 'all';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Lead Directory</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
              {filteredLeads.length} leads
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Search, filter, assign, and track progress across all leads
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode Toggle: Table vs Kanban */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Table View"
            >
              <LayoutList size={14} />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`p-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition ${
                viewMode === 'kanban'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Kanban Board View"
            >
              <Kanban size={14} />
              <span className="hidden sm:inline">Pipeline</span>
            </button>
          </div>

          {/* Export CSV button (PRD Requirement for admin/manager) */}
          {canExport && (
            <button
              onClick={handleExportCSV}
              className="p-2 sm:px-3 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg shadow-2xs flex items-center gap-1.5 transition"
              title="Export filtered leads to CSV"
            >
              <Download size={14} className="text-slate-500" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          )}

          {/* Add Lead CTA */}
          <button
            onClick={onOpenNewLead}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Plus size={15} />
            <span>Add Lead</span>
          </button>
        </div>
      </div>

      {/* Quick Filter Segmented Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {[
          { id: 'all', label: 'All Leads' },
          { id: 'my', label: 'My Assigned Leads' },
          { id: 'due', label: 'Follow-Up Due / Overdue' },
          { id: 'unassigned', label: 'Unassigned Leads' },
          { id: 'urgent', label: 'Urgent & High Priority' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedQuickFilter(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
              selectedQuickFilter === tab.id
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2.5">
          {/* Search box */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Search leads by name, company, email, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 hover:bg-slate-100/60 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={13} />
              </button>
            )}
          </div>

          {/* Quick Stage Dropdown */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Stages</option>
            {statuses.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Quick Rep Dropdown */}
          <select
            value={assignedFilter}
            onChange={(e) => setAssignedFilter(e.target.value)}
            className="bg-slate-50 hover:bg-slate-100/60 border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-700 font-medium focus:outline-none"
          >
            <option value="all">All Reps</option>
            <option value="unassigned">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>

          {/* More Filters Toggle */}
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`px-3 py-2 text-xs font-medium rounded-lg border flex items-center gap-1.5 transition ${
              showAdvancedFilters || (priorityFilter !== 'all' || sourceFilter !== 'all' || tagFilter !== 'all')
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 font-semibold'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal size={13} />
            <span>More</span>
          </button>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="text-xs text-slate-500 hover:text-slate-800 underline px-1 py-1"
            >
              Reset
            </button>
          )}
        </div>

        {/* Dropdown Filters (Collapsible for less frequent filters) */}
        {showAdvancedFilters && (
          <div className="pt-2.5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-in fade-in duration-150">
            {/* Source Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Lead Source
              </label>
              <select
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Sources</option>
                {sources.map((src) => (
                  <option key={src.id} value={src.id}>
                    {src.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Priority
              </label>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 capitalize"
              >
                <option value="all">All Priorities</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Tag Filter */}
            <div>
              <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                Tag
              </label>
              <select
                value={tagFilter}
                onChange={(e) => setTagFilter(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="all">All Tags</option>
                {tags.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Action Sticky Bar when 1 or more leads are selected */}
      {selectedLeadIds.length > 0 && (
        <div className="bg-slate-900 text-white p-3 px-4 rounded-xl shadow-lg flex items-center justify-between flex-wrap gap-3 animate-in slide-in-from-top-2 duration-150">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold px-2 py-0.5 bg-indigo-500 rounded text-white">
              {selectedLeadIds.length}
            </span>
            <span>leads selected</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Bulk Change Status */}
            <div className="relative">
              <button
                onClick={() =>
                  setBulkActionDropdown(bulkActionDropdown === 'status' ? null : 'status')
                }
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <span>Change Status</span>
                <ChevronDown size={12} />
              </button>

              {bulkActionDropdown === 'status' && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-1 z-30">
                  {statuses.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        bulkUpdateStatus(selectedLeadIds, s.id);
                        setBulkActionDropdown(null);
                        setSelectedLeadIds([]);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 flex items-center gap-2"
                    >
                      <span className={`w-2 h-2 rounded-full ${getStatusBadgeClasses(s.color).dot}`} />
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bulk Reassign */}
            <div className="relative">
              <button
                onClick={() =>
                  setBulkActionDropdown(bulkActionDropdown === 'assign' ? null : 'assign')
                }
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <UserCheck size={13} />
                <span>Assign Rep</span>
                <ChevronDown size={12} />
              </button>

              {bulkActionDropdown === 'assign' && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-1 z-30">
                  <button
                    onClick={() => {
                      bulkAssignLeads(selectedLeadIds, '');
                      setBulkActionDropdown(null);
                      setSelectedLeadIds([]);
                    }}
                    className="w-full px-3 py-1.5 text-xs text-left text-rose-600 hover:bg-slate-100"
                  >
                    Unassign leads
                  </button>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        bulkAssignLeads(selectedLeadIds, u.id);
                        setBulkActionDropdown(null);
                        setSelectedLeadIds([]);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100 flex items-center gap-2"
                    >
                      <img src={u.avatar} alt="" className="w-4 h-4 rounded-full" />
                      <span className="truncate">{u.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bulk Tag */}
            <div className="relative">
              <button
                onClick={() =>
                  setBulkActionDropdown(bulkActionDropdown === 'tag' ? null : 'tag')
                }
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <TagIcon size={13} />
                <span>Add Tag</span>
                <ChevronDown size={12} />
              </button>

              {bulkActionDropdown === 'tag' && (
                <div className="absolute right-0 bottom-full mb-2 w-48 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-200 py-1 z-30">
                  {tags.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        bulkAddTag(selectedLeadIds, t.id);
                        setBulkActionDropdown(null);
                        setSelectedLeadIds([]);
                      }}
                      className="w-full px-3 py-1.5 text-xs text-left hover:bg-slate-100"
                    >
                      {t.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Bulk Export */}
            {canExport && (
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
                title="Export selected leads"
              >
                <Download size={13} />
                <span>Export ({selectedLeadIds.length})</span>
              </button>
            )}

            {/* Bulk Delete (Admin only) */}
            {canDeleteLeads && (
              <button
                onClick={() => {
                  bulkDeleteLeads(selectedLeadIds);
                  setSelectedLeadIds([]);
                }}
                className="px-2.5 py-1.5 bg-rose-600/90 hover:bg-rose-600 rounded-lg text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            )}

            <button
              onClick={() => setSelectedLeadIds([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Main Content: Table View vs Kanban Board */}
      {viewMode === 'kanban' ? (
        <KanbanBoard
          leads={filteredLeads}
          onSelectLead={onSelectLead}
          onOpenNewLead={onOpenNewLead}
        />
      ) : (
        /* Table View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold select-none">
                  {/* Select All Checkbox */}
                  <th className="py-3 px-4 w-10">
                    <button
                      onClick={handleSelectAll}
                      className="text-slate-400 hover:text-slate-600 flex items-center"
                    >
                      {selectedLeadIds.length > 0 &&
                      selectedLeadIds.length === sortedLeads.length ? (
                        <CheckSquare size={16} className="text-indigo-600" />
                      ) : (
                        <Square size={16} />
                      )}
                    </button>
                  </th>

                  {/* Lead Name & Company */}
                  <th
                    onClick={() => handleSortToggle('fullName')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Lead & Organization</span>
                      <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </th>

                  {/* Status */}
                  <th
                    onClick={() => handleSortToggle('status')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Status</span>
                      <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </th>

                  {/* Priority */}
                  <th
                    onClick={() => handleSortToggle('priority')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Priority</span>
                      <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </th>

                  {/* Contact Info */}
                  <th className="py-3 px-4">Contact</th>

                  {/* Assigned User */}
                  <th className="py-3 px-4">Assigned Rep</th>

                  {/* Next Follow-Up */}
                  <th
                    onClick={() => handleSortToggle('nextFollowUpDate')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900"
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Next Follow-Up</span>
                      <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </th>

                  {/* Deal Value */}
                  <th
                    onClick={() => handleSortToggle('estimatedValue')}
                    className="py-3 px-4 cursor-pointer hover:text-slate-900 text-right"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>Est. Value</span>
                      <ArrowUpDown size={12} className="text-slate-400" />
                    </div>
                  </th>

                  {/* Source */}
                  <th className="py-3 px-4">Source</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {sortedLeads.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-16 text-center text-slate-500">
                      <div className="max-w-sm mx-auto space-y-3">
                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                          <Search size={20} />
                        </div>
                        <div className="font-semibold text-slate-800 text-sm">No leads match your criteria</div>
                        <p className="text-xs text-slate-500">
                          Try clearing some filters or searching with a different term.
                        </p>
                        {hasActiveFilters && (
                          <button
                            onClick={resetFilters}
                            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                          >
                            Reset all filters
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  sortedLeads.map((lead) => {
                    const isSelected = selectedLeadIds.includes(lead.id);
                    const statusObj = statuses.find((s) => s.id === lead.status);
                    const statusBadge = getStatusBadgeClasses(statusObj?.color || 'slate');
                    const priorityBadge = getPriorityBadge(lead.priority);
                    const assignedUser = users.find((u) => u.id === lead.assignedUserId);
                    const sourceObj = sources.find((s) => s.id === lead.source);

                    const overdueFollowUp = isOverdue(lead.nextFollowUpDate);
                    const todayFollowUp = isDueToday(lead.nextFollowUpDate);

                    return (
                      <tr
                        key={lead.id}
                        onClick={() => onSelectLead(lead)}
                        className={`hover:bg-slate-50/80 cursor-pointer transition select-none ${
                          isSelected ? 'bg-indigo-50/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td
                          className="py-3.5 px-4"
                          onClick={(e) => handleToggleSelect(lead.id, e)}
                        >
                          <button className="text-slate-400 hover:text-slate-600 flex items-center">
                            {isSelected ? (
                              <CheckSquare size={16} className="text-indigo-600" />
                            ) : (
                              <Square size={16} />
                            )}
                          </button>
                        </td>

                        {/* Name & Company */}
                        <td className="py-3.5 px-4 min-w-[200px]">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 hover:text-indigo-600 transition">
                              {lead.fullName}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {lead.id}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <Building size={11} className="text-slate-400" />
                            <span className="truncate">{lead.company}</span>
                            {lead.jobTitle && (
                              <span className="text-slate-400">· {lead.jobTitle}</span>
                            )}
                          </div>
                        </td>

                        {/* Status (Anti-slop: clean badge with dot) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium border ${statusBadge.bg} ${statusBadge.text} ${statusBadge.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
                            <span>{statusObj?.label || lead.status}</span>
                          </span>
                        </td>

                        {/* Priority */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <span className={`w-1.5 h-1.5 rounded-full ${priorityBadge.dot}`} />
                            <span className={`text-[11px] capitalize ${priorityBadge.text}`}>
                              {priorityBadge.label}
                            </span>
                          </div>
                        </td>

                        {/* Contact */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="space-y-0.5">
                            {lead.email && (
                              <a
                                href={`mailto:${lead.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-slate-600 hover:text-indigo-600 flex items-center gap-1 truncate"
                              >
                                <Mail size={11} className="text-slate-400" />
                                <span>{lead.email}</span>
                              </a>
                            )}
                            {lead.phone && (
                              <a
                                href={`tel:${lead.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="text-[11px] text-slate-500 hover:text-indigo-600 flex items-center gap-1 truncate"
                              >
                                <Phone size={11} className="text-slate-400" />
                                <span>{lead.phone}</span>
                              </a>
                            )}
                          </div>
                        </td>

                        {/* Assigned Rep */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {assignedUser ? (
                            <div className="flex items-center gap-2">
                              <img
                                src={assignedUser.avatar}
                                alt=""
                                className="w-5 h-5 rounded-full object-cover border border-slate-200"
                              />
                              <span className="text-[11px] font-medium text-slate-700">
                                {assignedUser.name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                          )}
                        </td>

                        {/* Next Follow-Up */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {lead.nextFollowUpDate ? (
                            <div>
                              <div
                                className={`text-[11px] font-medium flex items-center gap-1 ${
                                  overdueFollowUp
                                    ? 'text-rose-600 font-bold'
                                    : todayFollowUp
                                    ? 'text-amber-700 font-bold'
                                    : 'text-slate-700'
                                }`}
                              >
                                <Clock size={11} />
                                <span>{formatDate(lead.nextFollowUpDate)}</span>
                              </div>
                              {overdueFollowUp && (
                                <span className="text-[10px] text-rose-500 font-semibold">
                                  Overdue
                                </span>
                              )}
                              {todayFollowUp && (
                                <span className="text-[10px] text-amber-600 font-semibold">
                                  Due Today
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400">—</span>
                          )}
                        </td>

                        {/* Deal Value */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-right font-semibold text-slate-800">
                          {formatCurrency(lead.estimatedValue)}
                        </td>

                        {/* Lead Source */}
                        <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 text-[11px]">
                          {sourceObj?.label || lead.source}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer with Summary */}
          <div className="p-3 bg-slate-50/60 border-t border-slate-200 px-4 flex items-center justify-between text-[11px] text-slate-500">
            <span>
              Showing {sortedLeads.length} of {filteredLeadsForCurrentUser.length} leads
            </span>
            <div className="flex items-center gap-2">
              <span>Internal Lead CRM</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  Bell,
  User as UserIcon,
  ChevronDown,
  Building,
  Mail,
  Phone,
  ArrowRight,
  Clock,
  AlertCircle,
  ExternalLink,
  LogOut,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Lead } from '../../types/crm';
import { formatCurrency, getStatusBadgeClasses, isDueToday, isOverdue } from '../../utils/crmHelpers';

interface NavbarProps {
  onOpenNewLead: () => void;
  onSelectLead: (lead: Lead) => void;
  onOpenProfile: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenNewLead,
  onSelectLead,
  onOpenProfile,
}) => {
  const { currentUser, users, switchUserById, filteredLeadsForCurrentUser, statuses, logout } = useCRM();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const notificationContainerRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcut '/' to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current && (document.activeElement as HTMLElement)?.tagName !== 'INPUT' && (document.activeElement as HTMLElement)?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close search dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notificationContainerRef.current && !notificationContainerRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Global search filtering across Name, Company, Email, Phone, Lead ID
  const searchResults = React.useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return filteredLeadsForCurrentUser.filter((lead) => {
      return (
        lead.fullName.toLowerCase().includes(q) ||
        lead.company.toLowerCase().includes(q) ||
        lead.email.toLowerCase().includes(q) ||
        lead.phone.toLowerCase().includes(q) ||
        lead.id.toLowerCase().includes(q) ||
        (lead.jobTitle && lead.jobTitle.toLowerCase().includes(q))
      );
    }).slice(0, 8);
  }, [searchQuery, filteredLeadsForCurrentUser]);

  // Urgent and Due Follow-ups
  const dueFollowUps = React.useMemo(() => {
    const list: { lead: Lead; type: string; dueDate: string; dueTime: string; overdue: boolean; notes: string }[] = [];
    filteredLeadsForCurrentUser.forEach((lead) => {
      (lead.followUps || []).forEach((f) => {
        if (f.status === 'pending') {
          const overdue = isOverdue(f.dueDate, f.dueTime);
          const today = isDueToday(f.dueDate);
          if (overdue || today) {
            list.push({
              lead,
              type: f.type,
              dueDate: f.dueDate,
              dueTime: f.dueTime,
              overdue,
              notes: f.notes,
            });
          }
        }
      });
    });
    return list;
  }, [filteredLeadsForCurrentUser]);

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between z-20 sticky top-0">
      {/* Global Quick Search */}
      <div ref={searchContainerRef} className="relative w-full max-w-md">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search leads by name, company, email, phone, ID... (Press '/')"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="w-full pl-9 pr-12 py-2 text-xs bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all placeholder:text-slate-400"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 border border-slate-200 bg-white px-1.5 py-0.5 rounded font-mono shadow-2xs">
            /
          </kbd>
        </div>

        {/* Search Results Dropdown */}
        {isSearchOpen && searchQuery.trim().length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-100">
            <div className="p-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between text-[11px] text-slate-500">
              <span className="font-medium">Found {searchResults.length} matching leads</span>
              <span>ESC to dismiss</span>
            </div>

            {searchResults.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500">
                No matching leads found for "{searchQuery}"
              </div>
            ) : (
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {searchResults.map((lead) => {
                  const statusObj = statuses.find((s) => s.id === lead.status);
                  const badge = getStatusBadgeClasses(statusObj?.color || 'slate');
                  return (
                    <button
                      key={lead.id}
                      onClick={() => {
                        onSelectLead(lead);
                        setIsSearchOpen(false);
                        setSearchQuery('');
                      }}
                      className="w-full p-3 text-left hover:bg-slate-50 flex items-center justify-between transition group"
                    >
                      <div className="min-w-0 pr-3">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 group-hover:text-indigo-600 truncate">
                            {lead.fullName}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {lead.id}
                          </span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-medium border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            {statusObj?.label || lead.status}
                          </span>
                        </div>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1 truncate">
                            <Building size={11} className="text-slate-400" />
                            {lead.company}
                          </span>
                          {lead.email && (
                            <span className="flex items-center gap-1 truncate">
                              <Mail size={11} className="text-slate-400" />
                              {lead.email}
                            </span>
                          )}
                          {lead.phone && (
                            <span className="flex items-center gap-1 truncate">
                              <Phone size={11} className="text-slate-400" />
                              {lead.phone}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {lead.estimatedValue ? (
                          <div className="text-xs font-bold text-slate-800">
                            {formatCurrency(lead.estimatedValue)}
                          </div>
                        ) : null}
                        <ArrowRight size={14} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition ml-auto mt-1" />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3">
        {/* Follow-up Reminders Bell */}
        <div ref={notificationContainerRef} className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
            title="Follow-ups due"
          >
            <Bell size={18} />
            {dueFollowUps.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
            )}
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 animate-in fade-in duration-100">
              <div className="p-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Clock size={14} className="text-indigo-600" />
                  <span>Follow-Up Alerts</span>
                </div>
                <span className="text-[11px] font-medium text-slate-500">
                  {dueFollowUps.length} pending
                </span>
              </div>

              {dueFollowUps.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  🎉 No overdue or pending follow-ups for today!
                </div>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                  {dueFollowUps.map((item, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        onSelectLead(item.lead);
                        setIsNotificationsOpen(false);
                      }}
                      className="w-full p-3 text-left hover:bg-slate-50 transition block"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-semibold text-slate-900 truncate">
                          {item.lead.fullName}
                        </span>
                        {item.overdue ? (
                          <span className="text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                            Overdue
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            Due Today
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-600 line-clamp-1">{item.notes}</div>
                      <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
                        <span>{item.lead.company}</span>
                        <span>{item.dueDate} at {item.dueTime}</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Role Quick Indicator */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
          <span className="text-slate-400 text-[11px]">Logged in as:</span>
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-2 hover:bg-slate-100 p-1.5 rounded-lg transition"
          >
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              className="w-6 h-6 rounded-full object-cover border border-slate-200"
            />
            <span className="font-semibold text-slate-800">{currentUser.name}</span>
            <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
              {currentUser.role}
            </span>
          </button>
        </div>

        {/* Primary Action: Add Lead */}
        <button
          onClick={onOpenNewLead}
          className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
        >
          <Plus size={15} />
          <span>Add Lead</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={() => logout()}
          className="px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg flex items-center gap-1.5 transition"
          title="Sign Out of CRM"
        >
          <LogOut size={14} className="text-slate-400 group-hover:text-rose-600" />
          <span className="hidden sm:inline">Logout</span>
        </button>
      </div>
    </header>
  );
};

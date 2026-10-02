import React from 'react';
import {
  LayoutDashboard,
  Users2,
  CalendarCheck2,
  UploadCloud,
  BarChart3,
  ShieldCheck,
  Settings,
  Plus,
  RefreshCw,
  LogOut,
  ChevronRight,
  UserCheck,
} from 'lucide-react';
import { ActiveNavTab } from '../../types/crm';
import { useCRM } from '../../context/CRMContext';
import { isDueToday, isOverdue } from '../../utils/crmHelpers';

interface SidebarProps {
  activeTab: ActiveNavTab;
  setActiveTab: (tab: ActiveNavTab) => void;
  onOpenNewLead: () => void;
  onOpenProfile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewLead,
  onOpenProfile,
}) => {
  const {
    currentUser,
    users,
    switchUserById,
    filteredLeadsForCurrentUser,
    canManageUsers,
    canManageSettings,
    resetToSeedData,
    logout,
  } = useCRM();

  // Due follow-ups count
  const dueFollowUpsCount = filteredLeadsForCurrentUser.reduce((acc, lead) => {
    const active = (lead.followUps || []).filter(
      (f) => f.status === 'pending' && (isDueToday(f.dueDate) || isOverdue(f.dueDate, f.dueTime))
    );
    return acc + active.length;
  }, 0);

  const mainNav = [
    {
      id: 'dashboard' as ActiveNavTab,
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'leads' as ActiveNavTab,
      label: 'Leads',
      icon: Users2,
      badge: filteredLeadsForCurrentUser.length.toString(),
    },
    {
      id: 'tasks' as ActiveNavTab,
      label: 'Tasks & Follow-Ups',
      icon: CalendarCheck2,
      badge: dueFollowUpsCount > 0 ? `${dueFollowUpsCount}` : null,
      badgeHighlight: dueFollowUpsCount > 0,
    },
    {
      id: 'imports' as ActiveNavTab,
      label: 'Bulk Import',
      icon: UploadCloud,
      badge: null,
    },
    {
      id: 'reports' as ActiveNavTab,
      label: 'Reports & Pipeline',
      icon: BarChart3,
      badge: null,
    },
  ];

  const adminNav = [
    ...(canManageUsers || currentUser.role === 'manager'
      ? [
          {
            id: 'users' as ActiveNavTab,
            label: canManageUsers ? 'Team & Access' : 'Team Directory',
            icon: ShieldCheck,
          },
        ]
      : []),
    ...(canManageSettings
      ? [
          {
            id: 'settings' as ActiveNavTab,
            label: 'Settings',
            icon: Settings,
          },
        ]
      : []),
  ];

  return (
    <aside className="w-60 flex-shrink-0 bg-white border-r border-slate-200 flex flex-col h-screen select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xs tracking-wider shadow-xs">
            CRM
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900 leading-tight">Lead CRM</div>
            <div className="text-[11px] text-slate-500">Internal Management</div>
          </div>
        </div>
      </div>

      {/* Primary New Lead Button */}
      <div className="p-3">
        <button
          onClick={onOpenNewLead}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-[0.98]"
        >
          <Plus size={15} />
          <span>New Lead</span>
        </button>
      </div>

      {/* Main Nav Items */}
      <nav className="flex-1 overflow-y-auto px-3 py-1 space-y-0.5">
        <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2.5 py-1.5">
          Workspace
        </div>
        {mainNav.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  size={15}
                  className={isActive ? 'text-indigo-600' : 'text-slate-400'}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                    item.badgeHighlight
                      ? 'bg-amber-100 text-amber-800'
                      : isActive
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {adminNav.length > 0 && (
          <div className="pt-4 space-y-0.5">
            <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 px-2.5 py-1.5">
              Admin & Org
            </div>
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-indigo-50 text-indigo-700 font-semibold'
                      : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      size={15}
                      className={isActive ? 'text-indigo-600' : 'text-slate-400'}
                    />
                    <span>{item.label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </nav>

      {/* Role Impersonation Switcher (Clean, Simple & Compact) */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 space-y-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400">
          <span className="font-semibold uppercase tracking-wider">Active Role</span>
          <span className="capitalize font-bold text-slate-600 px-1.5 py-0.2 bg-white border border-slate-200 rounded">
            {currentUser.role}
          </span>
        </div>
        <select
          value={currentUser.id}
          onChange={(e) => switchUserById(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:border-indigo-500 font-medium"
          title="Switch active user to test roles"
        >
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name} ({u.role.toUpperCase()})
            </option>
          ))}
        </select>
      </div>

      {/* Current User & Logout */}
      <div className="p-3 border-t border-slate-200 space-y-2">
        <button
          onClick={onOpenProfile}
          className="w-full flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 transition text-left min-w-0 group"
          title="View profile & account settings"
        >
          <img
            src={currentUser.avatar}
            alt=""
            className="w-8 h-8 rounded-full object-cover border border-slate-200"
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-semibold text-slate-800 truncate group-hover:text-indigo-600">
              {currentUser.name}
            </div>
            <div className="text-[11px] text-slate-500 truncate">{currentUser.team}</div>
          </div>
        </button>

        <button
          onClick={() => logout()}
          className="w-full py-1.5 px-2.5 text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition flex items-center justify-center gap-1.5"
          title="Log Out of CRM"
        >
          <LogOut size={13} className="text-slate-400 group-hover:text-rose-600" />
          <span>Log Out</span>
        </button>
      </div>
    </aside>
  );
};

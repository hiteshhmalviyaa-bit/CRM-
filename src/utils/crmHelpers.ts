import { LeadStatusConfig, LeadPriority } from '../types/crm';

export function formatCurrency(amount?: number): string {
  if (amount === undefined || amount === null || isNaN(amount)) return '$0';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(isoDate?: string | null): string {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  } catch {
    return isoDate;
  }
}

export function formatDateTime(isoDate?: string | null): string {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    if (isNaN(d.getTime())) return isoDate;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoDate;
  }
}

export function formatRelativeTime(isoDate?: string | null): string {
  if (!isoDate) return '—';
  try {
    const date = new Date(isoDate);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(isoDate);
  } catch {
    return isoDate;
  }
}

export function isOverdue(dueDateStr?: string | null, dueTimeStr?: string): boolean {
  if (!dueDateStr) return false;
  try {
    const datePart = dueDateStr.split('T')[0];
    const timePart = dueTimeStr || '23:59';
    const dueDateTime = new Date(`${datePart}T${timePart}:00`);
    const now = new Date();
    return dueDateTime < now;
  } catch {
    return false;
  }
}

export function isDueToday(dueDateStr?: string | null): boolean {
  if (!dueDateStr) return false;
  try {
    const datePart = dueDateStr.split('T')[0];
    const today = new Date().toISOString().split('T')[0];
    return datePart === today;
  } catch {
    return false;
  }
}

export function getStatusBadgeClasses(color: string): { bg: string; text: string; dot: string; border: string } {
  switch (color) {
    case 'emerald':
    case 'green':
      return { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', border: 'border-emerald-200' };
    case 'rose':
    case 'red':
      return { bg: 'bg-rose-50', text: 'text-rose-700', dot: 'bg-rose-500', border: 'border-rose-200' };
    case 'amber':
    case 'yellow':
      return { bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500', border: 'border-amber-200' };
    case 'blue':
      return { bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500', border: 'border-blue-200' };
    case 'indigo':
      return { bg: 'bg-indigo-50', text: 'text-indigo-700', dot: 'bg-indigo-500', border: 'border-indigo-200' };
    case 'purple':
      return { bg: 'bg-purple-50', text: 'text-purple-700', dot: 'bg-purple-500', border: 'border-purple-200' };
    case 'teal':
    case 'cyan':
      return { bg: 'bg-teal-50', text: 'text-teal-700', dot: 'bg-teal-500', border: 'border-teal-200' };
    case 'zinc':
    case 'slate':
    default:
      return { bg: 'bg-slate-100', text: 'text-slate-700', dot: 'bg-slate-400', border: 'border-slate-200' };
  }
}

export function getPriorityBadge(priority: LeadPriority): { label: string; text: string; dot: string } {
  switch (priority) {
    case 'urgent':
      return { label: 'Urgent', text: 'text-rose-700 font-semibold', dot: 'bg-rose-600' };
    case 'high':
      return { label: 'High', text: 'text-amber-700 font-medium', dot: 'bg-amber-500' };
    case 'medium':
      return { label: 'Medium', text: 'text-slate-600', dot: 'bg-slate-400' };
    case 'low':
      return { label: 'Low', text: 'text-slate-500', dot: 'bg-slate-300' };
  }
}

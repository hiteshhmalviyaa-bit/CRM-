export type UserRole = 'admin' | 'manager' | 'standard';

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  avatar: string;
  team: string;
  active: boolean;
  phone?: string;
  title?: string;
  lastLogin?: string;
  invitedBy?: string;
  tempPasswordIssued?: boolean;
}

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface LeadStatusConfig {
  id: string;
  label: string;
  color: string;
  description: string;
  order: number;
  active: boolean;
  isWon?: boolean;
  isLost?: boolean;
}

export interface LeadSourceConfig {
  id: string;
  label: string;
  active: boolean;
  isSystem?: boolean;
}

export interface TagConfig {
  id: string;
  label: string;
  color: string;
}

export interface Note {
  id: string;
  leadId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  text: string;
  createdAt: string;
}

export type ActivityType =
  | 'call'
  | 'email'
  | 'meeting'
  | 'sms'
  | 'follow-up'
  | 'note'
  | 'status_change'
  | 'reassign'
  | 'import'
  | 'other';

export interface Activity {
  id: string;
  leadId: string;
  type: ActivityType;
  userId: string;
  userName: string;
  description: string;
  outcome?: string;
  nextFollowUpDate?: string;
  createdAt: string;
}

export type FollowUpType = 'call' | 'email' | 'meeting' | 'demo' | 'check-in' | 'proposal';
export type FollowUpStatus = 'pending' | 'completed' | 'cancelled' | 'overdue';

export interface FollowUp {
  id: string;
  leadId: string;
  leadName: string;
  company: string;
  type: FollowUpType;
  assignedUserId: string;
  assignedUserName: string;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:MM
  notes: string;
  status: FollowUpStatus;
  completedAt?: string;
}

export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Task {
  id: string;
  title: string;
  description: string;
  leadId?: string;
  leadName?: string;
  assignedUserId: string;
  assignedUserName: string;
  dueDate: string;
  priority: TaskPriority;
  status: TaskStatus;
  createdAt: string;
  completedAt?: string;
}

export interface Lead {
  id: string; // e.g. "LEAD-1001"
  firstName: string;
  lastName: string;
  fullName: string;
  company: string;
  jobTitle: string;
  email: string;
  secondaryEmail?: string;
  phone: string;
  secondaryPhone?: string;

  // Address
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;

  // CRM Info
  status: string; // id of LeadStatusConfig
  source: string; // id of LeadSourceConfig
  assignedUserId?: string;
  priority: LeadPriority;
  tags: string[];
  createdDate: string; // ISO
  updatedDate: string; // ISO
  lastContactedDate?: string | null;
  nextFollowUpDate?: string | null;
  createdBy: string;
  estimatedValue?: number;

  // Additional Info
  website?: string;
  description?: string;
  notes: Note[];
  activities: Activity[];
  followUps: FollowUp[];
  tasks: Task[];
  customFields?: Record<string, string | number | boolean>;
}

export interface ImportHistoryItem {
  id: string;
  fileName: string;
  totalRows: number;
  importedCount: number;
  updatedCount: number;
  skippedDuplicatesCount: number;
  invalidCount: number;
  date: string;
  importedBy: string;
  strategy: 'skip' | 'update' | 'new';
}

export interface CRMSettings {
  standardUsersCanViewAllLeads: boolean;
  duplicateCheckCriteria: ('email' | 'phone')[];
  allowDuplicateCreationWithWarning: boolean;
  defaultStatus: string;
  defaultSource: string;
  companyName: string;
}

export type ActiveNavTab =
  | 'dashboard'
  | 'leads'
  | 'tasks'
  | 'imports'
  | 'reports'
  | 'users'
  | 'settings';

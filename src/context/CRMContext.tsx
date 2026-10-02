import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import {
  User,
  UserRole,
  Lead,
  LeadStatusConfig,
  LeadSourceConfig,
  TagConfig,
  CRMSettings,
  ImportHistoryItem,
  Note,
  Activity,
  FollowUp,
  FollowUpStatus,
  Task,
  TaskStatus,
} from '../types/crm';
import {
  INITIAL_USERS,
  INITIAL_STATUSES,
  INITIAL_SOURCES,
  INITIAL_TAGS,
  INITIAL_SETTINGS,
  INITIAL_LEADS,
  INITIAL_IMPORT_HISTORY,
} from '../data/seedData';

interface CRMContextType {
  // Current user & Auth
  isAuthenticated: boolean;
  currentUser: User;
  setCurrentUser: (user: User) => void;
  switchUserById: (userId: string) => void;
  login: (email: string, password?: string) => { success: boolean; error?: string };
  signupAdmin: (data: { name: string; email: string; password?: string; companyName?: string }) => { success: boolean; error?: string };
  logout: () => void;
  users: User[];
  updateUser: (id: string, updates: Partial<User>) => void;
  addUser: (userData: Omit<User, 'id'>) => void;
  inviteTeamMember: (data: {
    name: string;
    email: string;
    password?: string;
    role: UserRole;
    team: string;
    title?: string;
    phone?: string;
  }) => User;
  resetUserPassword: (userId: string, newPassword: string) => void;
  toggleUserActive: (id: string) => void;

  // Permissions helpers
  canManageSettings: boolean;
  canManageUsers: boolean;
  canDeleteLeads: boolean;
  canExport: boolean;
  canViewLead: (lead: Lead) => boolean;

  // Leads
  leads: Lead[];
  filteredLeadsForCurrentUser: Lead[];
  getLeadById: (id: string) => Lead | undefined;
  addLead: (
    data: Partial<Lead> & { firstName: string; lastName?: string; company?: string; email?: string; phone?: string },
    initialNote?: string
  ) => { lead: Lead; duplicateWarning?: Lead };
  updateLead: (id: string, updates: Partial<Lead>, logChange?: boolean) => void;
  deleteLead: (id: string) => void;
  bulkUpdateStatus: (leadIds: string[], status: string) => void;
  bulkAssignLeads: (leadIds: string[], userId: string) => void;
  bulkAddTag: (leadIds: string[], tagId: string) => void;
  bulkDeleteLeads: (leadIds: string[]) => void;

  // Duplicate detection
  checkDuplicates: (email?: string, phone?: string, excludeLeadId?: string) => Lead[];

  // Notes, Activities, Follow-ups, Tasks
  addNote: (leadId: string, text: string) => void;
  logActivity: (
    leadId: string,
    activityData: Omit<Activity, 'id' | 'createdAt' | 'userId' | 'userName' | 'leadId'>
  ) => void;
  scheduleFollowUp: (
    followUpData: Omit<FollowUp, 'id' | 'assignedUserName' | 'status'>
  ) => void;
  updateFollowUpStatus: (leadId: string, followUpId: string, status: FollowUpStatus) => void;
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'assignedUserName'>) => void;
  updateTaskStatus: (taskId: string, status: TaskStatus) => void;

  // Configuration
  statuses: LeadStatusConfig[];
  updateStatuses: (newStatuses: LeadStatusConfig[]) => void;
  addStatus: (status: Omit<LeadStatusConfig, 'id' | 'order'>) => void;
  deleteStatus: (statusId: string) => void;

  sources: LeadSourceConfig[];
  updateSources: (newSources: LeadSourceConfig[]) => void;
  addSource: (source: Omit<LeadSourceConfig, 'id'>) => void;

  tags: TagConfig[];
  addTag: (tag: Omit<TagConfig, 'id'>) => void;
  deleteTag: (tagId: string) => void;

  settings: CRMSettings;
  updateSettings: (newSettings: Partial<CRMSettings>) => void;

  // Guided Imports
  importHistory: ImportHistoryItem[];
  executeImport: (
    rows: Partial<Lead>[],
    strategy: 'skip' | 'update' | 'new',
    fileName: string
  ) => { imported: number; updated: number; skipped: number };

  // System
  resetToSeedData: () => void;
}

const CRMContext = createContext<CRMContextType | undefined>(undefined);

const STORAGE_KEYS = {
  AUTH_SESSION: 'crm_auth_session_v1',
  USERS: 'crm_users_v1',
  CURRENT_USER_ID: 'crm_current_user_id_v1',
  LEADS: 'crm_leads_v1',
  STATUSES: 'crm_statuses_v1',
  SOURCES: 'crm_sources_v1',
  TAGS: 'crm_tags_v1',
  SETTINGS: 'crm_settings_v1',
  IMPORT_HISTORY: 'crm_import_history_v1',
};

export const CRMProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 0. Auth state
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.AUTH_SESSION);
      // Require user to be authenticated via explicit session flag
      return saved === 'true';
    } catch {
      return false;
    }
  });

  // 1. Users state
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USERS);
      if (saved) {
        const parsed: User[] = JSON.parse(saved);
        // Ensure every user has password populated
        return parsed.map((u) => ({
          ...u,
          password: u.password || 'password123',
        }));
      }
      return INITIAL_USERS;
    } catch {
      return INITIAL_USERS;
    }
  });

  // Current logged in user
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const savedId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
      const matched = users.find((u) => u.id === savedId);
      return matched || users[0];
    } catch {
      return users[0];
    }
  });

  // 2. Leads state
  const [leads, setLeads] = useState<Lead[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LEADS);
      return saved ? JSON.parse(saved) : INITIAL_LEADS;
    } catch {
      return INITIAL_LEADS;
    }
  });

  // 3. Statuses
  const [statuses, setStatuses] = useState<LeadStatusConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.STATUSES);
      return saved ? JSON.parse(saved) : INITIAL_STATUSES;
    } catch {
      return INITIAL_STATUSES;
    }
  });

  // 4. Sources
  const [sources, setSources] = useState<LeadSourceConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SOURCES);
      return saved ? JSON.parse(saved) : INITIAL_SOURCES;
    } catch {
      return INITIAL_SOURCES;
    }
  });

  // 5. Tags
  const [tags, setTags] = useState<TagConfig[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TAGS);
      return saved ? JSON.parse(saved) : INITIAL_TAGS;
    } catch {
      return INITIAL_TAGS;
    }
  });

  // 6. Settings
  const [settings, setSettings] = useState<CRMSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // 7. Import History
  const [importHistory, setImportHistory] = useState<ImportHistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.IMPORT_HISTORY);
      return saved ? JSON.parse(saved) : INITIAL_IMPORT_HISTORY;
    } catch {
      return INITIAL_IMPORT_HISTORY;
    }
  });

  // Persist effects
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (currentUser?.id) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LEADS, JSON.stringify(leads));
  }, [leads]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.STATUSES, JSON.stringify(statuses));
  }, [statuses]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOURCES, JSON.stringify(sources));
  }, [sources]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TAGS, JSON.stringify(tags));
  }, [tags]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.IMPORT_HISTORY, JSON.stringify(importHistory));
  }, [importHistory]);

  // Permissions helpers
  const canManageSettings = currentUser.role === 'admin';
  const canManageUsers = currentUser.role === 'admin';
  const canDeleteLeads = currentUser.role === 'admin';
  const canExport = currentUser.role === 'admin' || currentUser.role === 'manager';

  const canViewLead = useCallback(
    (lead: Lead) => {
      if (currentUser.role === 'admin' || currentUser.role === 'manager') return true;
      if (settings.standardUsersCanViewAllLeads) return true;
      // Standard user can view if assigned to them or unassigned
      return lead.assignedUserId === currentUser.id || !lead.assignedUserId;
    },
    [currentUser, settings.standardUsersCanViewAllLeads]
  );

  const filteredLeadsForCurrentUser = useMemo(() => {
    return leads.filter(canViewLead);
  }, [leads, canViewLead]);

  const switchUserById = useCallback(
    (userId: string) => {
      const target = users.find((u) => u.id === userId);
      if (target) {
        setCurrentUser(target);
      }
    },
    [users]
  );

  // Auth actions
  const login = useCallback(
    (email: string, password?: string): { success: boolean; error?: string } => {
      const cleanInput = email.trim().toLowerCase();
      // Match by exact email, username prefix, or name
      const user = users.find((u) => {
        const uEmail = u.email.trim().toLowerCase();
        const uName = u.name.trim().toLowerCase();
        const uPrefix = uEmail.split('@')[0];
        return uEmail === cleanInput || uPrefix === cleanInput || uName === cleanInput;
      });

      if (!user) {
        return {
          success: false,
          error: `No user account found matching "${email}". Check spelling or select a 1-click demo account below.`,
        };
      }

      if (!user.active) {
        return {
          success: false,
          error: 'This account has been deactivated. Please contact your system administrator.',
        };
      }

      // Check password if provided
      const expectedPassword = user.password || 'password123';
      if (password && password.trim()) {
        const pInput = password.trim();
        const pExpected = expectedPassword.trim();
        const isMatch = pInput === pExpected || pInput.toLowerCase() === pExpected.toLowerCase() || pInput === 'password123';
        if (!isMatch) {
          return {
            success: false,
            error: `Incorrect password for ${user.name}. (Default password is 'password123')`,
          };
        }
      }

      const now = new Date().toISOString();
      const updatedUser = { ...user, lastLogin: now, active: true };
      setUsers((prev) => prev.map((u) => (u.id === user.id ? updatedUser : u)));
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);

      return { success: true };
    },
    [users]
  );

  const signupAdmin = useCallback(
    (data: { name: string; email: string; password?: string; companyName?: string }): {
      success: boolean;
      error?: string;
    } => {
      const cleanEmail = data.email.trim().toLowerCase();
      const existing = users.find((u) => u.email.trim().toLowerCase() === cleanEmail);

      if (existing) {
        return { success: false, error: 'An account with this email address already exists. Please login instead.' };
      }

      const now = new Date().toISOString();
      const newAdmin: User = {
        id: `usr-${Date.now().toString(36)}`,
        name: data.name.trim(),
        email: cleanEmail,
        password: data.password?.trim() || 'password123',
        role: 'admin',
        team: 'Executive & Admin',
        title: 'System Administrator',
        active: true,
        lastLogin: now,
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      };

      setUsers((prev) => [newAdmin, ...prev]);
      setCurrentUser(newAdmin);
      setIsAuthenticated(true);
      localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'true');
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newAdmin.id);

      if (data.companyName?.trim()) {
        setSettings((prev) => ({ ...prev, companyName: data.companyName!.trim() }));
      }

      return { success: true };
    },
    [users]
  );

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    localStorage.setItem(STORAGE_KEYS.AUTH_SESSION, 'false');
  }, []);

  const inviteTeamMember = useCallback(
    (data: {
      name: string;
      email: string;
      password?: string;
      role: UserRole;
      team: string;
      title?: string;
      phone?: string;
    }): User => {
      const now = new Date().toISOString();
      const randomAvatarNum = 1500000000000 + Math.floor(Math.random() * 10000000);
      const newMember: User = {
        id: `usr-${Date.now().toString(36)}`,
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password?.trim() || 'Welcome123!',
        role: data.role,
        team: data.team || 'Enterprise Sales',
        title: data.title?.trim() || 'Account Executive',
        phone: data.phone?.trim() || undefined,
        active: true,
        lastLogin: now,
        invitedBy: currentUser.name,
        tempPasswordIssued: true,
        avatar: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80`,
      };

      setUsers((prev) => [...prev, newMember]);
      return newMember;
    },
    [currentUser.name]
  );

  const resetUserPassword = useCallback((userId: string, newPassword: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, password: newPassword } : u))
    );
  }, []);

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updated = { ...u, ...updates };
          return updated;
        }
        return u;
      })
    );
    setCurrentUser((prev) => (prev.id === id ? { ...prev, ...updates } : prev));
  }, []);

  const addUser = useCallback((userData: Omit<User, 'id'>) => {
    const newUser: User = {
      ...userData,
      id: `usr-${Date.now().toString(36)}`,
      lastLogin: new Date().toISOString(),
    };
    setUsers((prev) => [...prev, newUser]);
  }, []);

  const toggleUserActive = useCallback((id: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    );
  }, []);

  const getLeadById = useCallback(
    (id: string) => leads.find((l) => l.id === id),
    [leads]
  );

  // Duplicate checking
  const checkDuplicates = useCallback(
    (email?: string, phone?: string, excludeLeadId?: string): Lead[] => {
      const normEmail = email?.trim().toLowerCase();
      const normPhone = phone?.replace(/\D/g, ''); // strip non-numeric

      if (!normEmail && (!normPhone || normPhone.length < 5)) return [];

      return leads.filter((lead) => {
        if (excludeLeadId && lead.id === excludeLeadId) return false;

        const checkEmailMatch =
          Boolean(normEmail) &&
          (lead.email?.trim().toLowerCase() === normEmail ||
            lead.secondaryEmail?.trim().toLowerCase() === normEmail);

        const targetLeadPhoneNorm = lead.phone?.replace(/\D/g, '');
        const targetLeadSecPhoneNorm = lead.secondaryPhone?.replace(/\D/g, '');

        const checkPhoneMatch =
          Boolean(normPhone && normPhone.length >= 7) &&
          (Boolean(targetLeadPhoneNorm && normPhone && targetLeadPhoneNorm.endsWith(normPhone.slice(-7))) ||
            Boolean(targetLeadSecPhoneNorm && normPhone && targetLeadSecPhoneNorm.endsWith(normPhone.slice(-7))));

        return checkEmailMatch || checkPhoneMatch;
      });
    },
    [leads]
  );

  // Add lead
  const addLead = useCallback(
    (
      data: Partial<Lead> & { firstName: string; lastName?: string; company?: string; email?: string; phone?: string },
      initialNote?: string
    ) => {
      const now = new Date().toISOString();
      const nextNum = Math.floor(1000 + Math.random() * 9000);
      const leadId = `LEAD-${nextNum}`;

      // Check duplicates
      const dupMatches = checkDuplicates(data.email, data.phone);
      const duplicateWarning = dupMatches.length > 0 ? dupMatches[0] : undefined;

      const fullName =
        data.fullName ||
        `${data.firstName || ''} ${data.lastName || ''}`.trim() ||
        data.company ||
        'Unnamed Lead';

      const initialActivities: Activity[] = [
        {
          id: `act-${Date.now()}`,
          leadId,
          type: 'status_change',
          userId: currentUser.id,
          userName: currentUser.name,
          description: `Lead created manually by ${currentUser.name}`,
          createdAt: now,
        },
      ];

      const initialNotes: Note[] = [];
      if (initialNote && initialNote.trim()) {
        initialNotes.push({
          id: `note-${Date.now()}`,
          leadId,
          authorId: currentUser.id,
          authorName: currentUser.name,
          text: initialNote.trim(),
          createdAt: now,
        });
      }

      const newLead: Lead = {
        id: leadId,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        fullName,
        company: data.company || 'Individual Prospect',
        jobTitle: data.jobTitle || '',
        email: data.email || '',
        secondaryEmail: data.secondaryEmail || '',
        phone: data.phone || '',
        secondaryPhone: data.secondaryPhone || '',
        addressLine1: data.addressLine1 || '',
        addressLine2: data.addressLine2 || '',
        city: data.city || '',
        state: data.state || '',
        postalCode: data.postalCode || '',
        country: data.country || '',
        status: data.status || settings.defaultStatus || 'new',
        source: data.source || settings.defaultSource || 'manual',
        assignedUserId: data.assignedUserId,
        priority: data.priority || 'medium',
        tags: data.tags || [],
        createdDate: now,
        updatedDate: now,
        lastContactedDate: null,
        nextFollowUpDate: data.nextFollowUpDate || null,
        createdBy: currentUser.id,
        estimatedValue: Number(data.estimatedValue) || 0,
        website: data.website || '',
        description: data.description || '',
        notes: initialNotes,
        activities: initialActivities,
        followUps: [],
        tasks: [],
      };

      setLeads((prev) => [newLead, ...prev]);

      return { lead: newLead, duplicateWarning };
    },
    [checkDuplicates, currentUser, settings.defaultSource, settings.defaultStatus]
  );

  // Update lead
  const updateLead = useCallback(
    (id: string, updates: Partial<Lead>, logChange = true) => {
      const now = new Date().toISOString();
      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== id) return lead;

          const updatedLead = { ...lead, ...updates, updatedDate: now };

          // If status changed, automatically log activity
          if (logChange && updates.status && updates.status !== lead.status) {
            const oldStatusLabel = statuses.find((s) => s.id === lead.status)?.label || lead.status;
            const newStatusLabel = statuses.find((s) => s.id === updates.status)?.label || updates.status;

            const changeActivity: Activity = {
              id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              leadId: id,
              type: 'status_change',
              userId: currentUser.id,
              userName: currentUser.name,
              description: `Status changed from "${oldStatusLabel}" to "${newStatusLabel}"`,
              createdAt: now,
            };
            updatedLead.activities = [changeActivity, ...(updatedLead.activities || [])];
          }

          // If assigned user changed, log assignment
          if (logChange && updates.assignedUserId !== undefined && updates.assignedUserId !== lead.assignedUserId) {
            const newAssignee = users.find((u) => u.id === updates.assignedUserId);
            const assignDesc = newAssignee
              ? `Reassigned to ${newAssignee.name}`
              : `Lead unassigned`;
            const assignAct: Activity = {
              id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
              leadId: id,
              type: 'reassign',
              userId: currentUser.id,
              userName: currentUser.name,
              description: assignDesc,
              createdAt: now,
            };
            updatedLead.activities = [assignAct, ...(updatedLead.activities || [])];
          }

          return updatedLead;
        })
      );
    },
    [currentUser, statuses, users]
  );

  // Delete lead
  const deleteLead = useCallback((id: string) => {
    setLeads((prev) => prev.filter((l) => l.id !== id));
  }, []);

  // Bulk actions
  const bulkUpdateStatus = useCallback(
    (leadIds: string[], status: string) => {
      leadIds.forEach((id) => {
        updateLead(id, { status }, true);
      });
    },
    [updateLead]
  );

  const bulkAssignLeads = useCallback(
    (leadIds: string[], userId: string) => {
      leadIds.forEach((id) => {
        updateLead(id, { assignedUserId: userId || undefined }, true);
      });
    },
    [updateLead]
  );

  const bulkAddTag = useCallback((leadIds: string[], tagId: string) => {
    const now = new Date().toISOString();
    setLeads((prev) =>
      prev.map((lead) => {
        if (leadIds.includes(lead.id)) {
          if (!lead.tags.includes(tagId)) {
            return {
              ...lead,
              tags: [...lead.tags, tagId],
              updatedDate: now,
            };
          }
        }
        return lead;
      })
    );
  }, []);

  const bulkDeleteLeads = useCallback((leadIds: string[]) => {
    setLeads((prev) => prev.filter((l) => !leadIds.includes(l.id)));
  }, []);

  // Notes
  const addNote = useCallback(
    (leadId: string, text: string) => {
      const now = new Date().toISOString();
      const newNote: Note = {
        id: `note-${Date.now()}`,
        leadId,
        authorId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        text,
        createdAt: now,
      };

      const noteActivity: Activity = {
        id: `act-${Date.now()}`,
        leadId,
        type: 'note',
        userId: currentUser.id,
        userName: currentUser.name,
        description: `Note added by ${currentUser.name}: "${text.slice(0, 80)}${text.length > 80 ? '...' : ''}"`,
        createdAt: now,
      };

      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== leadId) return lead;
          return {
            ...lead,
            notes: [newNote, ...(lead.notes || [])],
            activities: [noteActivity, ...(lead.activities || [])],
            updatedDate: now,
          };
        })
      );
    },
    [currentUser]
  );

  // Activities
  const logActivity = useCallback(
    (
      leadId: string,
      activityData: Omit<Activity, 'id' | 'createdAt' | 'userId' | 'userName' | 'leadId'>
    ) => {
      const now = new Date().toISOString();
      const newActivity: Activity = {
        ...activityData,
        id: `act-${Date.now()}`,
        leadId,
        userId: currentUser.id,
        userName: currentUser.name,
        createdAt: now,
      };

      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== leadId) return lead;
          return {
            ...lead,
            activities: [newActivity, ...(lead.activities || [])],
            lastContactedDate: now,
            nextFollowUpDate: activityData.nextFollowUpDate || lead.nextFollowUpDate,
            updatedDate: now,
          };
        })
      );
    },
    [currentUser]
  );

  // Follow-ups
  const scheduleFollowUp = useCallback(
    (followUpData: Omit<FollowUp, 'id' | 'assignedUserName' | 'status'>) => {
      const now = new Date().toISOString();
      const assignedUser = users.find((u) => u.id === followUpData.assignedUserId);
      const assignedUserName = assignedUser?.name || currentUser.name;

      const newFollowUp: FollowUp = {
        ...followUpData,
        id: `fol-${Date.now()}`,
        assignedUserName,
        status: 'pending',
      };

      const followUpActivity: Activity = {
        id: `act-${Date.now()}`,
        leadId: followUpData.leadId,
        type: 'follow-up',
        userId: currentUser.id,
        userName: currentUser.name,
        description: `Scheduled ${followUpData.type.toUpperCase()} follow-up for ${followUpData.dueDate} ${followUpData.dueTime || ''} with ${assignedUserName}`,
        createdAt: now,
      };

      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== followUpData.leadId) return lead;
          return {
            ...lead,
            followUps: [newFollowUp, ...(lead.followUps || [])],
            activities: [followUpActivity, ...(lead.activities || [])],
            nextFollowUpDate: `${followUpData.dueDate}T${followUpData.dueTime || '09:00'}:00Z`,
            updatedDate: now,
          };
        })
      );
    },
    [currentUser, users]
  );

  const updateFollowUpStatus = useCallback(
    (leadId: string, followUpId: string, status: FollowUpStatus) => {
      const now = new Date().toISOString();
      setLeads((prev) =>
        prev.map((lead) => {
          if (lead.id !== leadId) return lead;
          const updatedFollowUps = (lead.followUps || []).map((f) => {
            if (f.id === followUpId) {
              return {
                ...f,
                status,
                completedAt: status === 'completed' ? now : undefined,
              };
            }
            return f;
          });

          // Log completion in activity
          const targetFollowUp = lead.followUps.find((f) => f.id === followUpId);
          const act: Activity = {
            id: `act-${Date.now()}`,
            leadId,
            type: 'follow-up',
            userId: currentUser.id,
            userName: currentUser.name,
            description: `Follow-up (${targetFollowUp?.type || 'action'}) marked as ${status.toUpperCase()}`,
            createdAt: now,
          };

          return {
            ...lead,
            followUps: updatedFollowUps,
            activities: [act, ...(lead.activities || [])],
            updatedDate: now,
          };
        })
      );
    },
    [currentUser]
  );

  // Tasks
  const addTask = useCallback(
    (taskData: Omit<Task, 'id' | 'createdAt' | 'assignedUserName'>) => {
      const now = new Date().toISOString();
      const assignedUser = users.find((u) => u.id === taskData.assignedUserId);
      const newTask: Task = {
        ...taskData,
        id: `tsk-${Date.now()}`,
        assignedUserName: assignedUser?.name || 'Unassigned',
        createdAt: now,
      };

      if (taskData.leadId) {
        setLeads((prev) =>
          prev.map((lead) => {
            if (lead.id !== taskData.leadId) return lead;
            return {
              ...lead,
              tasks: [newTask, ...(lead.tasks || [])],
              updatedDate: now,
            };
          })
        );
      }
    },
    [users]
  );

  const updateTaskStatus = useCallback((taskId: string, status: TaskStatus) => {
    const now = new Date().toISOString();
    setLeads((prev) =>
      prev.map((lead) => {
        if (!lead.tasks?.some((t) => t.id === taskId)) return lead;
        return {
          ...lead,
          tasks: (lead.tasks || []).map((t) =>
            t.id === taskId ? { ...t, status, completedAt: status === 'completed' ? now : undefined } : t
          ),
          updatedDate: now,
        };
      })
    );
  }, []);

  // Configuration updates
  const updateStatuses = useCallback((newStatuses: LeadStatusConfig[]) => {
    setStatuses(newStatuses);
  }, []);

  const addStatus = useCallback((statusData: Omit<LeadStatusConfig, 'id' | 'order'>) => {
    const id = statusData.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setStatuses((prev) => [
      ...prev,
      {
        ...statusData,
        id,
        order: prev.length + 1,
      },
    ]);
  }, []);

  const deleteStatus = useCallback((statusId: string) => {
    setStatuses((prev) => prev.filter((s) => s.id !== statusId));
  }, []);

  const updateSources = useCallback((newSources: LeadSourceConfig[]) => {
    setSources(newSources);
  }, []);

  const addSource = useCallback((sourceData: Omit<LeadSourceConfig, 'id'>) => {
    const id = sourceData.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setSources((prev) => [...prev, { ...sourceData, id }]);
  }, []);

  const addTag = useCallback((tagData: Omit<TagConfig, 'id'>) => {
    const id = tagData.label.toLowerCase().replace(/[^a-z0-9]/g, '_');
    setTags((prev) => [...prev, { ...tagData, id }]);
  }, []);

  const deleteTag = useCallback((tagId: string) => {
    setTags((prev) => prev.filter((t) => t.id !== tagId));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<CRMSettings>) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  }, []);

  // Guided bulk import execution
  const executeImport = useCallback(
    (
      rows: Partial<Lead>[],
      strategy: 'skip' | 'update' | 'new',
      fileName: string
    ) => {
      let imported = 0;
      let updated = 0;
      let skipped = 0;
      const now = new Date().toISOString();

      setLeads((currentLeads) => {
        let updatedList = [...currentLeads];

        rows.forEach((row) => {
          const email = row.email?.trim().toLowerCase();
          const phone = row.phone?.replace(/\D/g, '');

          // Check if exists
          const existingIdx = updatedList.findIndex((l) => {
            const matchEmail = email && (l.email?.trim().toLowerCase() === email || l.secondaryEmail?.trim().toLowerCase() === email);
            const lPhone = l.phone?.replace(/\D/g, '');
            const matchPhone = phone && phone.length >= 7 && lPhone && lPhone.endsWith(phone.slice(-7));
            return matchEmail || matchPhone;
          });

          if (existingIdx >= 0) {
            if (strategy === 'skip') {
              skipped++;
              return;
            }
            if (strategy === 'update') {
              const target = updatedList[existingIdx];
              updatedList[existingIdx] = {
                ...target,
                ...row,
                updatedDate: now,
                activities: [
                  {
                    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                    leadId: target.id,
                    type: 'import',
                    userId: currentUser.id,
                    userName: currentUser.name,
                    description: `Updated record during bulk import from "${fileName}"`,
                    createdAt: now,
                  },
                  ...(target.activities || []),
                ],
              };
              updated++;
              return;
            }
          }

          // Otherwise import as new
          const randomSuffix = Math.floor(1000 + Math.random() * 9000);
          const newLeadId = `LEAD-${randomSuffix}`;
          const fullName =
            row.fullName ||
            `${row.firstName || ''} ${row.lastName || ''}`.trim() ||
            row.company ||
            'Imported Prospect';

          const newLead: Lead = {
            id: newLeadId,
            firstName: row.firstName || '',
            lastName: row.lastName || '',
            fullName,
            company: row.company || 'Unknown Company',
            jobTitle: row.jobTitle || '',
            email: row.email || '',
            secondaryEmail: row.secondaryEmail || '',
            phone: row.phone || '',
            secondaryPhone: row.secondaryPhone || '',
            addressLine1: row.addressLine1 || '',
            city: row.city || '',
            state: row.state || '',
            postalCode: row.postalCode || '',
            country: row.country || '',
            status: row.status || settings.defaultStatus || 'new',
            source: row.source || 'csv_import',
            assignedUserId: row.assignedUserId,
            priority: row.priority || 'medium',
            tags: row.tags || [],
            createdDate: now,
            updatedDate: now,
            lastContactedDate: null,
            nextFollowUpDate: row.nextFollowUpDate || null,
            createdBy: currentUser.id,
            estimatedValue: Number(row.estimatedValue) || 0,
            website: row.website || '',
            description: row.description || '',
            notes: [],
            activities: [
              {
                id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                leadId: newLeadId,
                type: 'import',
                userId: currentUser.id,
                userName: currentUser.name,
                description: `Imported via bulk file "${fileName}"`,
                createdAt: now,
              },
            ],
            followUps: [],
            tasks: [],
          };

          updatedList = [newLead, ...updatedList];
          imported++;
        });

        return updatedList;
      });

      // Record in import history
      const historyItem: ImportHistoryItem = {
        id: `imp-${Date.now()}`,
        fileName,
        totalRows: rows.length,
        importedCount: imported,
        updatedCount: updated,
        skippedDuplicatesCount: skipped,
        invalidCount: 0,
        date: now,
        importedBy: currentUser.name,
        strategy,
      };

      setImportHistory((prev) => [historyItem, ...prev]);

      return { imported, updated, skipped };
    },
    [currentUser, settings.defaultStatus]
  );

  // Reset to seed data
  const resetToSeedData = useCallback(() => {
    setUsers(INITIAL_USERS);
    setCurrentUser(INITIAL_USERS[0]);
    setLeads(INITIAL_LEADS);
    setStatuses(INITIAL_STATUSES);
    setSources(INITIAL_SOURCES);
    setTags(INITIAL_TAGS);
    setSettings(INITIAL_SETTINGS);
    setImportHistory(INITIAL_IMPORT_HISTORY);

    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.LEADS);
    localStorage.removeItem(STORAGE_KEYS.STATUSES);
    localStorage.removeItem(STORAGE_KEYS.SOURCES);
    localStorage.removeItem(STORAGE_KEYS.TAGS);
    localStorage.removeItem(STORAGE_KEYS.SETTINGS);
    localStorage.removeItem(STORAGE_KEYS.IMPORT_HISTORY);
  }, []);

  return (
    <CRMContext.Provider
      value={{
        isAuthenticated,
        currentUser,
        setCurrentUser,
        switchUserById,
        login,
        signupAdmin,
        logout,
        inviteTeamMember,
        resetUserPassword,
        users,
        updateUser,
        addUser,
        toggleUserActive,

        canManageSettings,
        canManageUsers,
        canDeleteLeads,
        canExport,
        canViewLead,

        leads,
        filteredLeadsForCurrentUser,
        getLeadById,
        addLead,
        updateLead,
        deleteLead,
        bulkUpdateStatus,
        bulkAssignLeads,
        bulkAddTag,
        bulkDeleteLeads,

        checkDuplicates,

        addNote,
        logActivity,
        scheduleFollowUp,
        updateFollowUpStatus,
        addTask,
        updateTaskStatus,

        statuses,
        updateStatuses,
        addStatus,
        deleteStatus,

        sources,
        updateSources,
        addSource,

        tags,
        addTag,
        deleteTag,

        settings,
        updateSettings,

        importHistory,
        executeImport,

        resetToSeedData,
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error('useCRM must be used within a CRMProvider');
  }
  return context;
};

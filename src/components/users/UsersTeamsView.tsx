import React, { useState } from 'react';
import {
  Users2,
  ShieldCheck,
  Plus,
  Mail,
  Phone,
  Check,
  X,
  Lock,
  UserCheck,
  UserX,
  Edit,
  ShieldAlert,
  KeyRound,
  Copy,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { User, UserRole } from '../../types/crm';
import { formatDateTime } from '../../utils/crmHelpers';

export const UsersTeamsView: React.FC = () => {
  const {
    users,
    updateUser,
    toggleUserActive,
    currentUser,
    canManageUsers,
    inviteTeamMember,
    resetUserPassword,
  } = useCRM();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');

  // New user form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Welcome123!');
  const [role, setRole] = useState<UserRole>('standard');
  const [team, setTeam] = useState('Enterprise Sales');
  const [phone, setPhone] = useState('');
  const [title, setTitle] = useState('');

  // Newly created credential sharing modal
  const [credentialCard, setCredentialCard] = useState<{
    name: string;
    email: string;
    password: string;
    role: string;
    team: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let res = 'Lead!';
    for (let i = 0; i < 6; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(res);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    const created = inviteTeamMember({
      name: name.trim(),
      email: email.trim(),
      password: password.trim(),
      role,
      team,
      phone: phone.trim() || undefined,
      title: title.trim() || undefined,
    });

    setCredentialCard({
      name: created.name,
      email: created.email,
      password: password.trim(),
      role: created.role,
      team: created.team,
    });

    setName('');
    setEmail('');
    setPassword('Welcome123!');
    setPhone('');
    setTitle('');
    setShowAddModal(false);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    updateUser(editingUser.id, {
      role: editingUser.role,
      team: editingUser.team,
      title: editingUser.title,
      phone: editingUser.phone,
    });
    setEditingUser(null);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser || !newPasswordVal.trim()) return;

    resetUserPassword(resettingUser.id, newPasswordVal.trim());
    setCredentialCard({
      name: resettingUser.name,
      email: resettingUser.email,
      password: newPasswordVal.trim(),
      role: resettingUser.role,
      team: resettingUser.team,
    });

    setResettingUser(null);
    setNewPasswordVal('');
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const getFullInvitationText = () => {
    if (!credentialCard) return '';
    return `Hello ${credentialCard.name},

Your account on the Internal Lead Management CRM is ready!

Login Credentials:
- CRM Portal: ${window.location.origin}
- Email: ${credentialCard.email}
- Password: ${credentialCard.password}
- Assigned Role: ${credentialCard.role.toUpperCase()} (${credentialCard.team})

Please sign in and start managing your leads and follow-ups.`;
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Users & Teams Management</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
              RBAC Directory
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Create user accounts, set credentials, and provision access for internal staff
          </p>
        </div>

        {canManageUsers && (
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-3.5 rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
          >
            <Plus size={15} />
            <span>Invite Team Member (Set Password)</span>
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <span className="text-xs font-bold text-slate-800">
            Internal Staff Directory ({users.length} members)
          </span>
          <span className="text-xs text-slate-400">
            {canManageUsers
              ? 'Admin Mode: Full editing, credential reset & activation privileges'
              : 'View-Only Directory'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Member Name & Title</th>
                <th className="py-3 px-4">System Role</th>
                <th className="py-3 px-4">Department / Team</th>
                <th className="py-3 px-4">Login Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Last Active</th>
                {canManageUsers && <th className="py-3 px-4 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={user.avatar}
                        alt=""
                        className="w-8 h-8 rounded-full object-cover border border-slate-200"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-400">{user.title || 'Team Member'}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                        user.role === 'admin'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : user.role === 'manager'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                          : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-medium">{user.team}</td>
                  <td className="py-3.5 px-4 text-slate-600">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Mail size={11} className="text-slate-400" />
                        <span>{user.email}</span>
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-1 text-[11px] text-slate-400">
                          <Phone size={11} className="text-slate-400" />
                          <span>{user.phone}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="py-3.5 px-4">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        user.active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {user.active ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                    {formatDateTime(user.lastLogin)}
                  </td>
                  {canManageUsers && (
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Reset / Set Password */}
                        <button
                          onClick={() => {
                            setResettingUser(user);
                            setNewPasswordVal('Welcome123!');
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                          title="Reset Password & Give to User"
                        >
                          <KeyRound size={14} />
                        </button>

                        {/* Edit Role & Team */}
                        <button
                          onClick={() => setEditingUser(user)}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded transition"
                          title="Edit Role & Team"
                        >
                          <Edit size={14} />
                        </button>

                        {/* Activate / Deactivate */}
                        {user.id !== currentUser.id && (
                          <button
                            onClick={() => toggleUserActive(user.id)}
                            className={`p-1.5 rounded transition ${
                              user.active
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={user.active ? 'Deactivate Account' : 'Reactivate Account'}
                          >
                            {user.active ? <UserX size={14} /> : <UserCheck size={14} />}
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Role & Permission Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Role & Access Control Matrix (PRD)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Explicit permission boundary enforcement across Administrator, Manager, and Standard User
          </p>
        </div>

        <div className="overflow-x-auto border border-slate-200 rounded-xl">
          <table className="w-full text-left text-xs divide-y divide-slate-200">
            <thead className="bg-slate-50 font-semibold text-slate-600">
              <tr>
                <th className="py-2.5 px-4">Feature / Permission</th>
                <th className="py-2.5 px-4 text-center">Administrator</th>
                <th className="py-2.5 px-4 text-center">Manager</th>
                <th className="py-2.5 px-4 text-center">Standard User (Sales Rep)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {[
                { feature: 'View Assigned Leads', admin: true, manager: true, rep: true },
                { feature: 'View All / Unassigned Leads', admin: true, manager: true, rep: 'Configurable' },
                { feature: 'Create & Edit Leads', admin: true, manager: true, rep: true },
                { feature: 'Add Notes & Log Activities', admin: true, manager: true, rep: true },
                { feature: 'Schedule Follow-Ups', admin: true, manager: true, rep: true },
                { feature: 'Reassign Leads to Team', admin: true, manager: true, rep: false },
                { feature: 'Bulk Import (.csv, .xlsx)', admin: true, manager: true, rep: false },
                { feature: 'Bulk Export Leads', admin: true, manager: true, rep: false },
                { feature: 'Delete / Archive Leads', admin: true, manager: false, rep: false },
                { feature: 'Configure Statuses & Sources', admin: true, manager: false, rep: false },
                { feature: 'Manage Users & Set Passwords', admin: true, manager: false, rep: false },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50">
                  <td className="py-2.5 px-4 font-medium text-slate-800">{row.feature}</td>
                  <td className="py-2.5 px-4 text-center">
                    <Check size={14} className="text-emerald-600 mx-auto" />
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.manager ? (
                      <Check size={14} className="text-emerald-600 mx-auto" />
                    ) : (
                      <X size={14} className="text-slate-300 mx-auto" />
                    )}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {row.rep === true ? (
                      <Check size={14} className="text-emerald-600 mx-auto" />
                    ) : row.rep === false ? (
                      <X size={14} className="text-slate-300 mx-auto" />
                    ) : (
                      <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded">
                        {row.rep}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Invite Team Member (Admin sets Email and Password directly) */}
      {showAddModal && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Invite & Create Team Account</h3>
                <p className="text-xs text-slate-500">
                  Set their login email and password to give to them
                </p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Hayes"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Login Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="jordan.hayes@company.internal"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              {/* Password configuration */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">
                    Initial Password for User *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <Sparkles size={11} />
                    <span>Generate Strong Password</span>
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-lg p-2 text-xs font-mono font-medium text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-500">
                  You will be able to copy and share these credentials immediately after creation.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    System Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs capitalize"
                  >
                    <option value="standard">Standard User (Sales Rep)</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Team / Dept
                  </label>
                  <select
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  >
                    <option value="Enterprise Sales">Enterprise Sales</option>
                    <option value="Mid-Market Sales">Mid-Market Sales</option>
                    <option value="Inbound Growth">Inbound Growth</option>
                    <option value="Sales Development (SDR)">Sales Development</option>
                    <option value="Executive & RevOps">Executive & RevOps</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Job Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Account Executive"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                    Direct Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm"
                >
                  Create & Issue Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Reset User Password */}
      {resettingUser && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Reset Password for {resettingUser.name}
              </h3>
              <button onClick={() => setResettingUser(null)} className="text-slate-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  New Password
                </label>
                <input
                  type="text"
                  required
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs"
                >
                  Save & View Credentials
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Credentials Sharing Card (To give to the user) */}
      {credentialCard && (
        <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 border border-indigo-100">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Check size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Login Credentials Ready to Share
                  </h3>
                  <p className="text-xs text-slate-500">
                    Provide these details to {credentialCard.name}
                  </p>
                </div>
              </div>
              <button onClick={() => setCredentialCard(null)} className="text-slate-400">
                <X size={16} />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Login Email
                </span>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                  <span className="font-mono text-xs text-slate-800 font-semibold truncate">
                    {credentialCard.email}
                  </span>
                  <button
                    onClick={() => copyToClipboard(credentialCard.email, 'email')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 flex-shrink-0 ml-2"
                  >
                    {copiedKey === 'email' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'email' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-0.5">
                  Password
                </span>
                <div className="flex items-center justify-between bg-white px-3 py-2 rounded-lg border border-slate-200">
                  <span className="font-mono text-xs text-slate-800 font-bold tracking-wide">
                    {credentialCard.password}
                  </span>
                  <button
                    onClick={() => copyToClipboard(credentialCard.password, 'pwd')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 flex-shrink-0 ml-2"
                  >
                    {copiedKey === 'pwd' ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedKey === 'pwd' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-500 pt-1">
                Role: <strong className="uppercase">{credentialCard.role}</strong> · Team:{' '}
                <strong>{credentialCard.team}</strong>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => copyToClipboard(getFullInvitationText(), 'all')}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
              >
                {copiedKey === 'all' ? <Check size={14} /> : <Copy size={14} />}
                <span>
                  {copiedKey === 'all'
                    ? 'Copied Complete Invitation!'
                    : 'Copy Full Invitation Message'}
                </span>
              </button>

              <button
                onClick={() => setCredentialCard(null)}
                className="w-full py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Done / Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Edit Member: {editingUser.name}
              </h3>
              <button onClick={() => setEditingUser(null)} className="text-slate-400">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  System Role
                </label>
                <select
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({ ...editingUser, role: e.target.value as any })
                  }
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs capitalize"
                >
                  <option value="standard">Standard User (Sales Rep)</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Team / Department
                </label>
                <input
                  type="text"
                  value={editingUser.team}
                  onChange={(e) => setEditingUser({ ...editingUser, team: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  value={editingUser.title || ''}
                  onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-2xs"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

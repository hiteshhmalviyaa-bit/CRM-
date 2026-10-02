import React, { useState } from 'react';
import {
  Settings,
  Shield,
  Tag,
  Share2,
  Sliders,
  Plus,
  Trash2,
  Edit,
  Check,
  RefreshCw,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Lock,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { LeadStatusConfig, LeadSourceConfig, TagConfig } from '../../types/crm';
import { getStatusBadgeClasses } from '../../utils/crmHelpers';

export const SettingsView: React.FC = () => {
  const {
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
    resetToSeedData,
    currentUser,
    canManageSettings,
  } = useCRM();

  // Active sub-tab: 'statuses' | 'sources' | 'tags' | 'general'
  const [activeSubTab, setActiveSubTab] = useState<'statuses' | 'sources' | 'tags' | 'general'>(
    'statuses'
  );

  // New status state
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusColor, setNewStatusColor] = useState('blue');
  const [newStatusDesc, setNewStatusDesc] = useState('');

  // New source state
  const [newSourceLabel, setNewSourceLabel] = useState('');

  // New tag state
  const [newTagLabel, setNewTagLabel] = useState('');
  const [newTagColor, setNewTagColor] = useState('blue');

  if (!canManageSettings) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto space-y-4">
        <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
          <Lock size={22} />
        </div>
        <h2 className="text-base font-bold text-slate-900">Restricted Administrator Area</h2>
        <p className="text-xs text-slate-500">
          Only users with the <span className="font-semibold text-rose-700">Administrator</span>{' '}
          role can modify CRM system pipeline stages, sources, tags, and security policies.
        </p>
        <p className="text-xs text-slate-400">
          Use the User Switcher in the top or sidebar to test as Elena Vance (Admin).
        </p>
      </div>
    );
  }

  // Status Handlers
  const handleAddStatus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStatusLabel.trim()) return;
    addStatus({
      label: newStatusLabel.trim(),
      color: newStatusColor,
      description: newStatusDesc.trim() || 'Custom workflow stage',
      active: true,
    });
    setNewStatusLabel('');
    setNewStatusDesc('');
  };

  const handleToggleStatusActive = (id: string) => {
    updateStatuses(
      statuses.map((s) => (s.id === id ? { ...s, active: !s.active } : s))
    );
  };

  const handleMoveStatus = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= statuses.length) return;
    const newStatuses = [...statuses];
    const temp = newStatuses[idx];
    newStatuses[idx] = newStatuses[targetIdx];
    newStatuses[targetIdx] = temp;
    // Re-assign order numbers
    newStatuses.forEach((s, i) => {
      s.order = i + 1;
    });
    updateStatuses(newStatuses);
  };

  // Source Handlers
  const handleAddSource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSourceLabel.trim()) return;
    addSource({
      label: newSourceLabel.trim(),
      active: true,
    });
    setNewSourceLabel('');
  };

  const handleToggleSourceActive = (id: string) => {
    updateSources(
      sources.map((src) => (src.id === id ? { ...src, active: !src.active } : src))
    );
  };

  // Tag Handlers
  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagLabel.trim()) return;
    addTag({
      label: newTagLabel.trim(),
      color: newTagColor,
    });
    setNewTagLabel('');
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <span>CRM Configuration & Settings</span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
            Admin Only
          </span>
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Customize lead statuses, marketing sources, tags, and standard user visibility policies
        </p>
      </div>

      {/* Sub-nav Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {[
          { id: 'statuses', label: 'Lead Statuses (Pipeline)' },
          { id: 'sources', label: 'Lead Sources' },
          { id: 'tags', label: 'Tags & Labels' },
          { id: 'general', label: 'Security & Duplicate Rules' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeSubTab === tab.id
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: Lead Statuses (PRD Section 9) */}
      {activeSubTab === 'statuses' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Configured Lead Stages
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reorder, rename, or define colors. Historical lead data remains intact when a stage is disabled.
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {statuses.map((status, idx) => {
                const badge = getStatusBadgeClasses(status.color);
                return (
                  <div
                    key={status.id}
                    className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex flex-col gap-0.5">
                        <button
                          disabled={idx === 0}
                          onClick={() => handleMoveStatus(idx, 'up')}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Move Up"
                        >
                          <ArrowUp size={12} />
                        </button>
                        <button
                          disabled={idx === statuses.length - 1}
                          onClick={() => handleMoveStatus(idx, 'down')}
                          className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20"
                          title="Move Down"
                        >
                          <ArrowDown size={12} />
                        </button>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold border ${badge.bg} ${badge.text} ${badge.border}`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                            <span>{status.label}</span>
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {status.id}
                          </span>
                          {status.isWon && (
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 uppercase">
                              Won Flag
                            </span>
                          )}
                          {status.isLost && (
                            <span className="text-[9px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200 uppercase">
                              Lost Flag
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">{status.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleStatusActive(status.id)}
                        className={`text-[11px] font-semibold px-2 py-1 rounded border transition ${
                          status.active
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                            : 'bg-slate-100 border-slate-200 text-slate-400'
                        }`}
                      >
                        {status.active ? 'Enabled' : 'Disabled'}
                      </button>
                      {statuses.length > 2 && (
                        <button
                          onClick={() => deleteStatus(status.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded transition"
                          title="Remove stage"
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Add Stage Form */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Add New Custom Status
            </h4>
            <form onSubmit={handleAddStatus} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Stage Label
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Under Contract Review"
                  value={newStatusLabel}
                  onChange={(e) => setNewStatusLabel(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Accent Color
                </label>
                <select
                  value={newStatusColor}
                  onChange={(e) => setNewStatusColor(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs capitalize"
                >
                  <option value="blue">Blue</option>
                  <option value="indigo">Indigo</option>
                  <option value="purple">Purple</option>
                  <option value="amber">Amber</option>
                  <option value="emerald">Emerald</option>
                  <option value="rose">Rose</option>
                  <option value="teal">Teal</option>
                  <option value="slate">Slate</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">
                  Description
                </label>
                <input
                  type="text"
                  placeholder="Stage milestone objective..."
                  value={newStatusDesc}
                  onChange={(e) => setNewStatusDesc(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
                >
                  Add Status
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 2: Lead Sources (PRD Section 11) */}
      {activeSubTab === 'sources' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Marketing & Ingestion Sources
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sources.map((src) => (
                <div
                  key={src.id}
                  className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-semibold text-slate-800">{src.label}</span>
                    <span className="text-[10px] text-slate-400 block font-mono">{src.id}</span>
                  </div>
                  <button
                    onClick={() => handleToggleSourceActive(src.id)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      src.active ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-500'
                    }`}
                  >
                    {src.active ? 'Active' : 'Disabled'}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Source */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Add New Lead Source
            </h4>
            <form onSubmit={handleAddSource} className="flex gap-3">
              <input
                type="text"
                required
                placeholder="e.g. Podcast Sponsorship, Podcast Q4"
                value={newSourceLabel}
                onChange={(e) => setNewSourceLabel(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
              >
                Add Source
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: Tags & Labels (PRD Section 12) */}
      {activeSubTab === 'tags' && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              System Tags
            </h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <div
                  key={tag.id}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-2"
                >
                  <span className="text-xs font-semibold text-slate-800">{tag.label}</span>
                  <button
                    onClick={() => deleteTag(tag.id)}
                    className="text-slate-400 hover:text-rose-600"
                    title="Remove tag"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Tag */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Create New Tag
            </h4>
            <form onSubmit={handleAddTag} className="flex gap-3">
              <input
                type="text"
                required
                placeholder="e.g. Q4 Priority, High Net Worth"
                value={newTagLabel}
                onChange={(e) => setNewTagLabel(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-2xs"
              >
                Create Tag
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB 4: General Security & Policies (PRD Section 3.3 & 13) */}
      {activeSubTab === 'general' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Standard User Visibility Policy (PRD Section 3.3)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Control whether standard sales representatives can view only their own assigned leads, or all leads across the company.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.standardUsersCanViewAllLeads}
                onChange={(e) =>
                  updateSettings({ standardUsersCanViewAllLeads: e.target.checked })
                }
                className="w-4 h-4 text-indigo-600 rounded border-slate-300"
              />
              <span className="text-xs font-semibold text-slate-800">
                Allow Standard Users to view leads assigned to other team members
              </span>
            </label>

            <div className="pt-4 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
                Duplicate Record Prevention (PRD Section 13)
              </h4>
              <p className="text-xs text-slate-500 mb-3">
                Fields checked when adding leads manually or importing in bulk.
              </p>
              <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-slate-700">
                  <Check size={14} className="text-emerald-600" />
                  <span>Primary and Secondary Email Match</span>
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <Check size={14} className="text-emerald-600" />
                  <span>Primary and Secondary Phone Match (last 7 digits normalized)</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Reset System Demo Data</span>
                <span className="text-xs text-slate-400">
                  Reseed CRM with fresh sample records and default configuration
                </span>
              </div>
              <button
                onClick={() => resetToSeedData()}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <RefreshCw size={13} />
                <span>Reset Demo Database</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

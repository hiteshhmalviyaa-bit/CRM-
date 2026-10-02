import React, { useState, useEffect } from 'react';
import {
  X,
  AlertTriangle,
  Building,
  User,
  Mail,
  Phone,
  DollarSign,
  Tag as TagIcon,
  Globe,
  MapPin,
  FileText,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { Lead, LeadPriority } from '../../types/crm';

interface LeadFormModalProps {
  initialLead?: Lead | null;
  onClose: () => void;
  onSelectExistingLead?: (lead: Lead) => void;
}

export const LeadFormModal: React.FC<LeadFormModalProps> = ({
  initialLead,
  onClose,
  onSelectExistingLead,
}) => {
  const {
    addLead,
    updateLead,
    checkDuplicates,
    statuses,
    sources,
    tags,
    users,
    currentUser,
    settings,
  } = useCRM();

  const isEdit = Boolean(initialLead);

  // Form states
  const [firstName, setFirstName] = useState(initialLead?.firstName || '');
  const [lastName, setLastName] = useState(initialLead?.lastName || '');
  const [company, setCompany] = useState(initialLead?.company || '');
  const [jobTitle, setJobTitle] = useState(initialLead?.jobTitle || '');
  const [email, setEmail] = useState(initialLead?.email || '');
  const [secondaryEmail, setSecondaryEmail] = useState(initialLead?.secondaryEmail || '');
  const [phone, setPhone] = useState(initialLead?.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState(initialLead?.secondaryPhone || '');

  const [addressLine1, setAddressLine1] = useState(initialLead?.addressLine1 || '');
  const [addressLine2, setAddressLine2] = useState(initialLead?.addressLine2 || '');
  const [city, setCity] = useState(initialLead?.city || '');
  const [state, setState] = useState(initialLead?.state || '');
  const [postalCode, setPostalCode] = useState(initialLead?.postalCode || '');
  const [country, setCountry] = useState(initialLead?.country || 'United States');

  const [status, setStatus] = useState(initialLead?.status || settings.defaultStatus || 'new');
  const [source, setSource] = useState(initialLead?.source || settings.defaultSource || 'manual');
  const [priority, setPriority] = useState<LeadPriority>(initialLead?.priority || 'medium');
  const [assignedUserId, setAssignedUserId] = useState(
    initialLead?.assignedUserId !== undefined ? initialLead.assignedUserId : currentUser.id
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(initialLead?.tags || []);
  const [estimatedValue, setEstimatedValue] = useState<number | string>(
    initialLead?.estimatedValue || ''
  );
  const [website, setWebsite] = useState(initialLead?.website || '');
  const [description, setDescription] = useState(initialLead?.description || '');
  const [initialNote, setInitialNote] = useState('');

  // Real-time Duplicate Detection (PRD Section 13)
  const [duplicateWarning, setDuplicateWarning] = useState<Lead | null>(null);
  const [dismissDuplicate, setDismissDuplicate] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (dismissDuplicate) return;
    const dups = checkDuplicates(email, phone, initialLead?.id);
    if (dups.length > 0) {
      setDuplicateWarning(dups[0]);
    } else {
      setDuplicateWarning(null);
    }
  }, [email, phone, checkDuplicates, initialLead?.id, dismissDuplicate]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((t) => t !== tagId) : [...prev, tagId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validation per PRD Section 13:
    // Minimum required: First Name or Company, AND Phone and/or Email
    if (!firstName.trim() && !company.trim()) {
      setFormError('Please provide at least a First Name or a Company Name.');
      return;
    }
    if (!email.trim() && !phone.trim()) {
      setFormError('Please provide at least an Email address or a Phone number.');
      return;
    }

    if (isEdit && initialLead) {
      updateLead(
        initialLead.id,
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          fullName: `${firstName.trim()} ${lastName.trim()}`.trim() || company.trim(),
          company: company.trim() || 'Individual Prospect',
          jobTitle: jobTitle.trim(),
          email: email.trim(),
          secondaryEmail: secondaryEmail.trim(),
          phone: phone.trim(),
          secondaryPhone: secondaryPhone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          status,
          source,
          priority,
          assignedUserId: assignedUserId || undefined,
          tags: selectedTags,
          estimatedValue: Number(estimatedValue) || 0,
          website: website.trim(),
          description: description.trim(),
        },
        true
      );
      onClose();
    } else {
      // Add lead
      addLead(
        {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          company: company.trim(),
          jobTitle: jobTitle.trim(),
          email: email.trim(),
          secondaryEmail: secondaryEmail.trim(),
          phone: phone.trim(),
          secondaryPhone: secondaryPhone.trim(),
          addressLine1: addressLine1.trim(),
          addressLine2: addressLine2.trim(),
          city: city.trim(),
          state: state.trim(),
          postalCode: postalCode.trim(),
          country: country.trim(),
          status,
          source,
          priority,
          assignedUserId: assignedUserId || undefined,
          tags: selectedTags,
          estimatedValue: Number(estimatedValue) || 0,
          website: website.trim(),
          description: description.trim(),
        },
        initialNote
      );
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl overflow-hidden my-8 animate-in zoom-in-95 duration-150 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">
              {isEdit ? `Edit Lead: ${initialLead?.fullName}` : 'Create New Lead'}
            </h2>
            <p className="text-xs text-slate-500">
              {isEdit
                ? 'Update lead details, contact attributes, and pipeline parameters'
                : 'Fast data entry with automatic duplicate detection'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Error Banner */}
        {formError && (
          <div className="bg-rose-50 border-b border-rose-200 p-3 px-5 flex items-center justify-between gap-3 text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-rose-600 flex-shrink-0" />
              <span className="font-semibold">{formError}</span>
            </div>
            <button
              type="button"
              onClick={() => setFormError(null)}
              className="text-xs text-rose-600 hover:text-rose-900 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Real-time Duplicate Detection Banner (PRD Section 13) */}
        {duplicateWarning && (
          <div className="bg-amber-50 border-b border-amber-200 p-3 px-5 flex items-start justify-between gap-3 text-xs text-amber-900">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={18} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Potential Duplicate Record Found: </span>
                <span>
                  A lead with matching email or phone already exists:{' '}
                  <strong className="underline">{duplicateWarning.fullName}</strong> at{' '}
                  <strong>{duplicateWarning.company}</strong> (ID: {duplicateWarning.id}).
                </span>
                {onSelectExistingLead && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onSelectExistingLead(duplicateWarning);
                    }}
                    className="ml-2 font-bold text-amber-800 underline hover:text-amber-950 inline-flex items-center gap-1"
                  >
                    <span>View Existing Lead</span>
                    <ExternalLink size={11} />
                  </button>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={() => setDismissDuplicate(true)}
              className="text-[11px] font-semibold text-amber-800 hover:text-amber-950 underline flex-shrink-0"
            >
              Proceed Anyway
            </button>
          </div>
        )}

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Basic Information */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              1. Basic Information
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Elena"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vance"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company / Organization *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Sterling Logistics Inc."
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Job Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chief Technology Officer"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 2. Contact Information */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              2. Contact Information (At least Email or Phone required)
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Email *
                </label>
                <input
                  type="email"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setDismissDuplicate(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Primary Phone *
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 000-0000"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setDismissDuplicate(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secondary Email
                </label>
                <input
                  type="email"
                  placeholder="alt.contact@company.com"
                  value={secondaryEmail}
                  onChange={(e) => setSecondaryEmail(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Secondary Phone
                </label>
                <input
                  type="tel"
                  placeholder="+1 (555) 111-2222"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Company Website
                </label>
                <input
                  type="url"
                  placeholder="https://company.example.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* 3. CRM Information */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              3. CRM & Pipeline Attributes
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lead Status *
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {statuses.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Lead Source *
                </label>
                <select
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  {sources.map((src) => (
                    <option key={src.id} value={src.id}>
                      {src.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Priority
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 capitalize"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Representative
                </label>
                <select
                  value={assignedUserId || ''}
                  onChange={(e) => setAssignedUserId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                >
                  <option value="">Unassigned</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.team})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Estimated Deal Value ($)
                </label>
                <input
                  type="number"
                  placeholder="25000"
                  value={estimatedValue}
                  onChange={(e) => setEstimatedValue(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tags & Categories
                </label>
                <div className="flex flex-wrap gap-2 pt-1">
                  {tags.map((t) => {
                    const isSelected = selectedTags.includes(t.id);
                    return (
                      <button
                        type="button"
                        key={t.id}
                        onClick={() => toggleTag(t.id)}
                        className={`text-xs px-2.5 py-1 rounded-lg border transition ${
                          isSelected
                            ? 'bg-indigo-600 text-white border-indigo-600 font-medium'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {t.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* 4. Physical Address */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              4. Address & Location
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  placeholder="100 Market St, Suite 400"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  placeholder="San Francisco"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  State / Province
                </label>
                <input
                  type="text"
                  placeholder="CA"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Postal / ZIP Code
                </label>
                <input
                  type="text"
                  placeholder="94105"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Country</label>
                <input
                  type="text"
                  placeholder="United States"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs"
                />
              </div>
            </div>
          </div>

          {/* 5. Additional Description & Initial Note */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
              5. Description & Initial Notes
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Background Description
              </label>
              <textarea
                rows={2}
                placeholder="Key requirements, company size, tech stack, timeline..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
              />
            </div>

            {!isEdit && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Initial Internal Note (optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="Record immediate notes from first outreach or call..."
                  value={initialNote}
                  onChange={(e) => setInitialNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs"
                />
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-sm transition active:scale-95"
            >
              {isEdit ? 'Save Changes' : 'Create Lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

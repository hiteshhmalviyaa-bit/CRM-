/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { CRMProvider, useCRM } from './context/CRMContext';
import { ActiveNavTab, Lead } from './types/crm';
import { Sidebar } from './components/layout/Sidebar';
import { Navbar } from './components/layout/Navbar';
import { DashboardView } from './components/dashboard/DashboardView';
import { LeadListView } from './components/leads/LeadListView';
import { TasksFollowUpsView } from './components/tasks/TasksFollowUpsView';
import { BulkImportView } from './components/imports/BulkImportView';
import { ReportsView } from './components/reports/ReportsView';
import { UsersTeamsView } from './components/users/UsersTeamsView';
import { SettingsView } from './components/settings/SettingsView';
import { LeadDetailModal } from './components/leads/LeadDetailModal';
import { LeadFormModal } from './components/leads/LeadFormModal';
import { MyProfileModal } from './components/profile/MyProfileModal';
import { AuthView } from './components/auth/AuthView';

const CRMMainApp: React.FC = () => {
  const { isAuthenticated } = useCRM();

  const [activeTab, setActiveTab] = useState<ActiveNavTab>('dashboard');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [showNewLeadModal, setShowNewLeadModal] = useState(false);
  const [editingLead, setEditingLead] = useState<Lead | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [statusFilterForLeads, setStatusFilterForLeads] = useState<string | undefined>(undefined);

  if (!isAuthenticated) {
    return <AuthView />;
  }

  const handleSelectLead = (lead: Lead) => {
    setSelectedLeadId(lead.id);
  };

  const handleNavigateToLeads = (statusFilter?: string) => {
    setStatusFilterForLeads(statusFilter);
    setActiveTab('leads');
  };

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Sidebar Navigation (PRD Section 5) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setStatusFilterForLeads(undefined);
          setActiveTab(tab);
        }}
        onOpenNewLead={() => setShowNewLeadModal(true)}
        onOpenProfile={() => setShowProfileModal(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar with Quick Search and Reminder Alert */}
        <Navbar
          onOpenNewLead={() => setShowNewLeadModal(true)}
          onSelectLead={handleSelectLead}
          onOpenProfile={() => setShowProfileModal(true)}
        />

        {/* View Router */}
        <main className="flex-1 overflow-y-auto bg-slate-50/60">
          {activeTab === 'dashboard' && (
            <DashboardView
              onSelectLead={handleSelectLead}
              onNavigateToLeads={handleNavigateToLeads}
              onNavigateToTasks={() => setActiveTab('tasks')}
              onNavigateToImports={() => setActiveTab('imports')}
            />
          )}

          {activeTab === 'leads' && (
            <LeadListView
              key={statusFilterForLeads || 'all'}
              onSelectLead={handleSelectLead}
              onOpenNewLead={() => setShowNewLeadModal(true)}
              initialStatusFilter={statusFilterForLeads}
            />
          )}

          {activeTab === 'tasks' && (
            <TasksFollowUpsView onSelectLead={handleSelectLead} />
          )}

          {activeTab === 'imports' && <BulkImportView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'users' && <UsersTeamsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Lead Detail Slide-over / Modal (PRD Section 18) */}
      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onEditLead={(lead) => {
            setSelectedLeadId(null);
            setEditingLead(lead);
          }}
        />
      )}

      {/* Create Lead Modal (PRD Section 13 with Real-time Duplicate Warning) */}
      {showNewLeadModal && (
        <LeadFormModal
          onClose={() => setShowNewLeadModal(false)}
          onSelectExistingLead={handleSelectLead}
        />
      )}

      {/* Edit Lead Modal */}
      {editingLead && (
        <LeadFormModal
          initialLead={editingLead}
          onClose={() => setEditingLead(null)}
          onSelectExistingLead={handleSelectLead}
        />
      )}

      {/* My Profile Modal (PRD Section 4 & 5) */}
      {showProfileModal && (
        <MyProfileModal onClose={() => setShowProfileModal(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <CRMProvider>
      <CRMMainApp />
    </CRMProvider>
  );
}

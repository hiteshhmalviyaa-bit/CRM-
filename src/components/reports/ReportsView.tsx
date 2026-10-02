import React from 'react';
import {
  BarChart3,
  TrendingUp,
  Award,
  Users,
  Target,
  ArrowUpRight,
  PieChart,
  DollarSign,
  Download,
} from 'lucide-react';
import { useCRM } from '../../context/CRMContext';
import { formatCurrency } from '../../utils/crmHelpers';

export const ReportsView: React.FC = () => {
  const { leads, statuses, sources, users } = useCRM();

  const totalLeads = leads.length;
  const wonLeads = leads.filter((l) => l.status === 'won');
  const lostLeads = leads.filter((l) => l.status === 'lost');
  const qualifiedLeads = leads.filter((l) => l.status === 'qualified');

  const totalWonValue = wonLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
  const totalPipelineValue = leads
    .filter((l) => l.status !== 'won' && l.status !== 'lost' && l.status !== 'invalid')
    .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

  const winRate =
    wonLeads.length + lostLeads.length > 0
      ? Math.round((wonLeads.length / (wonLeads.length + lostLeads.length)) * 100)
      : 0;

  const avgDealSize = wonLeads.length > 0 ? Math.round(totalWonValue / wonLeads.length) : 0;

  // Pipeline stage breakdown
  const stageBreakdown = statuses.map((status) => {
    const stageLeads = leads.filter((l) => l.status === status.id);
    const value = stageLeads.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
    const pct = totalLeads > 0 ? Math.round((stageLeads.length / totalLeads) * 100) : 0;
    return {
      id: status.id,
      label: status.label,
      count: stageLeads.length,
      value,
      pct,
    };
  });

  // Team performance table
  const repPerformance = users
    .filter((u) => u.active)
    .map((user) => {
      const userLeads = leads.filter((l) => l.assignedUserId === user.id);
      const userWon = userLeads.filter((l) => l.status === 'won');
      const userContacted = userLeads.filter(
        (l) => l.status !== 'new' && l.status !== 'invalid'
      );
      const wonValue = userWon.reduce((sum, l) => sum + (l.estimatedValue || 0), 0);
      const activeValue = userLeads
        .filter((l) => l.status !== 'won' && l.status !== 'lost')
        .reduce((sum, l) => sum + (l.estimatedValue || 0), 0);

      let totalFollowUps = 0;
      let completedFollowUps = 0;
      userLeads.forEach((l) => {
        (l.followUps || []).forEach((f) => {
          totalFollowUps++;
          if (f.status === 'completed') completedFollowUps++;
        });
      });

      return {
        user,
        leadsCount: userLeads.length,
        contactedCount: userContacted.length,
        wonCount: userWon.length,
        wonValue,
        activeValue,
        followUpRate:
          totalFollowUps > 0 ? Math.round((completedFollowUps / totalFollowUps) * 100) : 100,
      };
    });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Executive & Team Reports</span>
            <span className="text-xs font-semibold px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-200">
              Live Pipeline
            </span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Conversion metrics, team productivity, and revenue forecast visibility
          </p>
        </div>
      </div>

      {/* Top 4 Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Closed Won Revenue</div>
          <div className="text-2xl font-bold text-emerald-700">{formatCurrency(totalWonValue)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            Across {wonLeads.length} closed customer accounts
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Active Pipeline</div>
          <div className="text-2xl font-bold text-indigo-700">
            {formatCurrency(totalPipelineValue)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Open opportunities & qualified leads</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-slate-900">{winRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">Ratio of won vs closed lost leads</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-medium text-slate-500 mb-1">Average Deal Size</div>
          <div className="text-2xl font-bold text-slate-900">
            {formatCurrency(avgDealSize)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Average contract ARR</div>
        </div>
      </div>

      {/* Pipeline Funnel Distribution */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div>
          <h2 className="text-sm font-bold text-slate-900">Pipeline Velocity & Funnel Health</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Volume and dollar value distribution across each lifecycle stage
          </p>
        </div>

        <div className="space-y-3">
          {stageBreakdown.map((stage) => (
            <div key={stage.id} className="space-y-1">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-800">{stage.label}</span>
                <div className="flex items-center gap-3">
                  <span className="text-slate-500">{stage.count} leads</span>
                  <span className="font-bold text-slate-900">{formatCurrency(stage.value)}</span>
                  <span className="text-slate-400 w-10 text-right">{stage.pct}%</span>
                </div>
              </div>
              <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${Math.max(2, stage.pct)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Team Productivity & Scorecard */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sales Representative Scorecard
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Individual account executive performance and pipeline ownership
            </p>
          </div>
          <span className="text-xs text-slate-400">{repPerformance.length} Active Reps</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Representative</th>
                <th className="py-3 px-4">Team</th>
                <th className="py-3 px-4 text-center">Assigned Leads</th>
                <th className="py-3 px-4 text-center">Contacted</th>
                <th className="py-3 px-4 text-center">Won Deals</th>
                <th className="py-3 px-4 text-right">Closed Won Value</th>
                <th className="py-3 px-4 text-right">Active Pipeline</th>
                <th className="py-3 px-4 text-center">Follow-Up Compliance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {repPerformance.map((rep) => (
                <tr key={rep.user.id} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900 flex items-center gap-2.5">
                    <img
                      src={rep.user.avatar}
                      alt=""
                      className="w-7 h-7 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div>{rep.user.name}</div>
                      <div className="text-[10px] text-slate-400 font-normal">{rep.user.email}</div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-600">{rep.user.team}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {rep.leadsCount}
                  </td>
                  <td className="py-3.5 px-4 text-center text-slate-700">
                    {rep.contactedCount}
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                    {rep.wonCount}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-emerald-800">
                    {formatCurrency(rep.wonValue)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-semibold text-slate-800">
                    {formatCurrency(rep.activeValue)}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded ${
                        rep.followUpRate >= 80
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-amber-50 text-amber-700'
                      }`}
                    >
                      {rep.followUpRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

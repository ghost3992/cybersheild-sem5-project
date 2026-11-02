import React, { useEffect, useState } from 'react';
import axiosClient from '../../api/axiosClient';
import { Users, Shield, UserCheck, CheckCircle2, ShieldAlert } from 'lucide-react';
import { useNotification } from '../../components/NotificationContext';

export default function UserManagementPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { showNotification } = useNotification();

  const loadUsers = async () => {
    try {
      setLoading(true);
      const res = await axiosClient.get('/users');
      setUsers(res.data.users || []);
    } catch (err) {
      showNotification('Failed to load user catalog.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await axiosClient.patch(`/users/${userId}/role`, { role: newRole });
      showNotification(`User role updated to [${newRole.toUpperCase()}]`, 'success');
      loadUsers();
    } catch (err) {
      showNotification('Failed to update role.', 'error');
    }
  };

  const roleStyles = {
    admin: 'bg-purple-950 text-purple-300 border-purple-800/80',
    analyst: 'bg-blue-950 text-blue-300 border-blue-800/80',
    employee: 'bg-slate-900 text-slate-300 border-slate-700',
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-5 h-5 text-cyan-400" />
            <span>Role-Based Access Control (RBAC) Administration</span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Manage enterprise permissions, SOC analyst credentials, and administrative authority across CyberShield.
          </p>
        </div>
      </div>

      <div className="bg-[#111726] border border-slate-800/90 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0e1422] text-[10px] uppercase tracking-wider text-slate-400 border-b border-slate-800 font-mono">
              <tr>
                <th className="px-5 py-3">UID</th>
                <th className="px-5 py-3">Identity Name</th>
                <th className="px-5 py-3">Email Address</th>
                <th className="px-5 py-3">Department & Designation</th>
                <th className="px-5 py-3">Assigned Role</th>
                <th className="px-5 py-3 text-right">Access Level Reconfiguration</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/70">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-slate-500">
                    Querying identity directory...
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-slate-500">#{u.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-100">{u.name}</td>
                    <td className="px-5 py-3.5 font-mono text-slate-400">{u.email}</td>
                    <td className="px-5 py-3.5 text-slate-300">
                      <div>{u.department}</div>
                      <div className="text-[11px] text-slate-500">{u.designation || 'Staff'}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`text-[10px] uppercase font-mono font-bold tracking-wider px-2 py-0.5 rounded border ${
                          roleStyles[u.role] || roleStyles.employee
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <select
                        value={u.role}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                      >
                        <option value="employee">Employee (Reporter)</option>
                        <option value="analyst">SOC Analyst</option>
                        <option value="admin">Administrator</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

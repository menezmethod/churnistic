'use client';

import { useAuth } from '@/lib/auth/AuthContext';
import { UserRole } from '@/lib/auth/types';

import AdminDashboard from './components/AdminDashboard';
import ContributorDashboard from './components/ContributorDashboard';
import SuperAdminDashboard from './components/SuperAdminDashboard';

export default function AdminPage() {
  const { hasRole, isSuperAdmin } = useAuth();

  if (isSuperAdmin()) {
    return <SuperAdminDashboard />;
  }

  if (hasRole(UserRole.CONTRIBUTOR)) {
    return <ContributorDashboard />;
  }

  // Default admin dashboard (already implemented)
  return <AdminDashboard />;
}

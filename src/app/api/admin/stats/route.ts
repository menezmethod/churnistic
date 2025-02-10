import { NextResponse } from 'next/server';

import { createServerSupabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('📥 GET /api/admin/stats - Starting request');
    const supabase = await createServerSupabaseAdmin();

    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: newUsers },
      { data: roleDistribution },
      { data: recentActivity },
    ] = await Promise.all([
      supabase.auth.admin
        .listUsers({ perPage: 1 })
        .then((res) => ({ count: res.data.users.length })),
      supabase.auth.admin.listUsers({ perPage: 1000 }).then((res) => ({
        count: res.data.users.filter(
          (u) =>
            new Date(u.last_sign_in_at || 0) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
      })),
      supabase.auth.admin.listUsers({ perPage: 1000 }).then((res) => ({
        count: res.data.users.filter(
          (u) => new Date(u.created_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)
        ).length,
      })),
      supabase.from('user_roles').select('role, count').group('role'),
      supabase.auth.admin.listUsers({
        perPage: 5,
        sortBy: { column: 'created_at', order: 'desc' },
      }),
    ]);

    const roleStats = {
      total: roleDistribution?.length || 0,
      distribution:
        roleDistribution?.map((r) => ({
          role: r.role,
          count: parseInt(r.count as string),
          percentage: (parseInt(r.count as string) / (totalUsers || 1)) * 100,
        })) || [],
    };

    const activity = recentActivity.data.users.map((user) => ({
      id: user.id,
      user: user.email,
      action: 'Created account',
      timestamp: new Date(user.created_at).toLocaleDateString(),
      type: 'create' as const,
    }));

    const stats = {
      users: {
        total: totalUsers || 0,
        active_24h: activeUsers || 0,
        new_today: newUsers || 0,
      },
      roles: roleStats,
      recent_activity: activity,
    };

    console.log('✅ Admin stats:', stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('❌ Error in GET /api/admin/stats:', error);
    return NextResponse.json({ error: 'Failed to fetch admin stats' }, { status: 500 });
  }
}

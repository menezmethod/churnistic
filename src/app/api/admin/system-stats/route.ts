import { NextResponse } from 'next/server';

import { createServerSupabaseAdmin } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('📥 GET /api/admin/system-stats - Starting request');
    const supabase = await createServerSupabaseAdmin();

    const [
      { count: totalUsers },
      { count: activeUsers },
      { count: totalOpportunities },
      { count: stagedOffers },
      { count: trackedOffers },
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
      supabase.from('opportunities').select('*', { count: 'exact', head: true }),
      supabase.from('staged_offers').select('*', { count: 'exact', head: true }),
      supabase.from('user_offers').select('*', { count: 'exact', head: true }),
    ]);

    // Mock system health data (replace with real monitoring in production)
    const systemHealth = {
      cpu_usage: Math.random() * 100,
      memory_usage: Math.random() * 100,
      api_latency: Math.random() * 1000,
    };

    const stats = {
      total_users: totalUsers || 0,
      active_users_24h: activeUsers || 0,
      total_opportunities: totalOpportunities || 0,
      staged_offers: stagedOffers || 0,
      tracked_offers: trackedOffers || 0,
      system_health: systemHealth,
    };

    console.log('✅ System stats:', stats);
    return NextResponse.json(stats);
  } catch (error) {
    console.error('❌ Error in GET /api/admin/system-stats:', error);
    return NextResponse.json({ error: 'Failed to fetch system stats' }, { status: 500 });
  }
}

import { BaseRepository } from '../base.repository';
import type {
    ActivityLog,
    CreateActivityLogInput,
    PaginatedResult,
} from '@/types/admin.types';

/**
 * Admin Activity Repository
 * Data access for activity logs, user engagement stats, and most active users.
 * Uses service role key (bypasses RLS) — must only be used server-side.
 */
export class AdminActivityRepository extends BaseRepository {

    async logActivity(input: CreateActivityLogInput) {
        const { error } = await this.client
            .from('activity_logs')
            .insert({
                user_id: input.user_id || null,
                action: input.action,
                entity_type: input.entity_type || null,
                entity_id: input.entity_id || null,
                metadata: input.metadata || {},
                ip_address: input.ip_address || null,
            });

        // Silently fail — logging should not break the main flow
        if (error) {
            console.error('Failed to log activity:', error.message);
        }
    }

    async getRecentActivity(page: number, pageSize: number): Promise<PaginatedResult<ActivityLog>> {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        const { data, error, count } = await this.client
            .from('activity_logs')
            .select(`
                id, user_id, action, entity_type, entity_id, metadata, ip_address, created_at,
                profiles(full_name, email)
            `, { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (error) this.handleError(error, 'AdminActivityRepository.getRecentActivity');

        const logs: ActivityLog[] = (data || []).map((l: any) => ({
            id: l.id,
            user_id: l.user_id,
            action: l.action,
            entity_type: l.entity_type,
            entity_id: l.entity_id,
            metadata: l.metadata || {},
            ip_address: l.ip_address,
            created_at: l.created_at,
            user_name: l.profiles?.full_name || null,
            user_email: l.profiles?.email || null,
        }));

        const total = count || 0;
        return { data: logs, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    async getUserActivityFeed(
        page: number,
        pageSize: number,
        filters?: { userId?: string; action?: string; userRole?: string }
    ) {
        const from = (page - 1) * pageSize;
        const to = from + pageSize - 1;

        let query = this.client
            .from('user_activity_logs')
            .select('*', { count: 'exact' })
            .order('created_at', { ascending: false })
            .range(from, to);

        if (filters?.userId) query = query.eq('user_id', filters.userId);
        if (filters?.action) query = query.eq('action', filters.action);
        if (filters?.userRole) query = query.eq('user_role', filters.userRole);

        const { data, error, count } = await query;
        if (error) console.error('getUserActivityFeed error:', error.message);

        // Enrich with user info from profiles
        const userIds = [...new Set((data || []).map((d: any) => d.user_id))] as string[];
        const { data: profiles } = await this.client
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds.length > 0 ? userIds : ['__none__']);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        const enriched = (data || []).map((log: any) => ({
            ...log,
            user_name: profileMap.get(log.user_id)?.full_name || null,
            user_email: profileMap.get(log.user_id)?.email || null,
        }));

        const total = count || 0;
        return { data: enriched, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
    }

    async getUserEngagementStats() {
        const now = new Date();
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const [dau, wau, mau, totalLogs, actionBreakdown] = await Promise.all([
            this.client.from('user_activity_logs').select('user_id', { count: 'exact' }).gte('created_at', oneDayAgo),
            this.client.from('user_activity_logs').select('user_id', { count: 'exact' }).gte('created_at', sevenDaysAgo),
            this.client.from('user_activity_logs').select('user_id', { count: 'exact' }).gte('created_at', thirtyDaysAgo),
            this.client.from('user_activity_logs').select('*', { count: 'exact', head: true }),
            this.client.from('user_activity_logs').select('action').gte('created_at', thirtyDaysAgo),
        ]);

        const dauUsers = new Set((dau.data || []).map((d: any) => d.user_id));
        const wauUsers = new Set((wau.data || []).map((d: any) => d.user_id));
        const mauUsers = new Set((mau.data || []).map((d: any) => d.user_id));

        const actionCounts: Record<string, number> = {};
        (actionBreakdown.data || []).forEach((d: any) => {
            actionCounts[d.action] = (actionCounts[d.action] || 0) + 1;
        });

        return {
            dau: dauUsers.size,
            wau: wauUsers.size,
            mau: mauUsers.size,
            totalLogs: totalLogs.count || 0,
            actionBreakdown: Object.entries(actionCounts)
                .sort(([, a], [, b]) => b - a)
                .map(([action, count]) => ({ action, count })),
        };
    }

    async getMostActiveUsers(limit = 10) {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

        const { data, error } = await this.client
            .from('user_activity_logs')
            .select('user_id, action, created_at')
            .gte('created_at', thirtyDaysAgo);

        if (error) console.error('getMostActiveUsers error:', error.message);

        const userMap: Record<string, { count: number; lastActive: string; role: string }> = {};
        (data || []).forEach((d: any) => {
            if (!userMap[d.user_id]) {
                userMap[d.user_id] = { count: 0, lastActive: d.created_at, role: d.user_role || 'customer' };
            }
            userMap[d.user_id].count++;
            if (d.created_at > userMap[d.user_id].lastActive) {
                userMap[d.user_id].lastActive = d.created_at;
            }
        });

        const sorted = Object.entries(userMap)
            .sort(([, a], [, b]) => b.count - a.count)
            .slice(0, limit);

        const userIds = sorted.map(([id]) => id);
        const { data: profiles } = await this.client
            .from('profiles')
            .select('id, full_name, email')
            .in('id', userIds.length > 0 ? userIds : ['__none__']);

        const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));

        return sorted.map(([userId, info]) => ({
            userId,
            fullName: profileMap.get(userId)?.full_name || null,
            email: profileMap.get(userId)?.email || null,
            actionCount: info.count,
            lastActive: info.lastActive,
            role: info.role,
        }));
    }
}

import { useQuery } from '@tanstack/react-query';
import laravelClient, { Asset, MaintenanceTicket, Profile } from '@/integrations/laravel/client';

export interface ReportFilters {
    start_date?: string;
    end_date?: string;
    status?: string;
    type?: string;
    priority?: string;
    asset_id?: string;
    assigned_technician_id?: string;
    location?: string;
}

export interface TechnicianStats {
    assigned_technician_id: string;
    assigned_technician?: Profile;
    total_assigned: number;
    completed_count: number;
    avg_rating?: number | string | null;
    avg_completion_days?: number | string | null;
}

export interface PerformanceReport {
    summary?: {
        total_tickets: number;
        completed_tickets: number;
        in_progress_tickets: number;
        overdue_tickets: number;
        completion_rate: number;
        avg_completion_days: number;
    };
    tickets_by_status?: Array<{ status: string; count: number }>;
    tickets_by_priority?: Array<{ priority: string; count: number }>;
    tickets_by_type?: Array<{ type: string; count: number }>;
    technician_stats?: TechnicianStats[];
}

function cleanFilters(filters: ReportFilters): Record<string, string> {
    const params: Record<string, string> = {};
    for (const [key, value] of Object.entries(filters)) {
        if (value && value !== 'all') {
            params[key] = value;
        }
    }
    return params;
}

export function useTicketReport(filters: ReportFilters) {
    return useQuery<MaintenanceTicket[]>({
        queryKey: ['reports', 'tickets', filters],
        queryFn: async () => {
            const response = await laravelClient.get('/reports/tickets', { params: cleanFilters(filters) });
            return response.data;
        },
    });
}

export function useAssetReport(filters: ReportFilters) {
    return useQuery<Asset[]>({
        queryKey: ['reports', 'assets', filters],
        queryFn: async () => {
            const response = await laravelClient.get('/reports/assets', { params: cleanFilters(filters) });
            return response.data;
        },
    });
}

export function usePerformanceReport(filters: ReportFilters) {
    return useQuery<PerformanceReport>({
        queryKey: ['reports', 'performance', filters],
        queryFn: async () => {
            const response = await laravelClient.get('/reports/performance', { params: cleanFilters(filters) });
            return response.data;
        },
    });
}

export async function downloadTicketReportCsv(filters: ReportFilters) {
    try {
        const response = await laravelClient.get('/reports/export/tickets', {
            params: cleanFilters(filters),
            responseType: 'blob',
        });

        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `tickets_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading ticket report:', error);
        throw error;
    }
}

export async function downloadAssetReportCsv(filters: ReportFilters) {
    try {
        const response = await laravelClient.get('/reports/export/assets', {
            params: cleanFilters(filters),
            responseType: 'blob',
        });

        // Create blob link to download
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `assets_report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error downloading asset report:', error);
        throw error;
    }
}

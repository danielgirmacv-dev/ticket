import { useQuery } from '@tanstack/react-query';
import laravelClient from '@/integrations/laravel/client';

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

export function useTicketReport(filters: ReportFilters) {
    return useQuery({
        queryKey: ['reports', 'tickets', filters],
        queryFn: async () => {
            const response = await laravelClient.get('/reports/tickets', { params: filters });
            return response.data;
        },
    });
}

export function useAssetReport(filters: ReportFilters) {
    return useQuery({
        queryKey: ['reports', 'assets', filters],
        queryFn: async () => {
            const response = await laravelClient.get('/reports/assets', { params: filters });
            return response.data;
        },
    });
}

export function usePerformanceReport(filters: ReportFilters) {
    return useQuery({
        queryKey: ['reports', 'performance', filters],
        queryFn: async () => {
            const response = await laravelClient.get('/reports/performance', { params: filters });
            return response.data;
        },
    });
}

export async function downloadTicketReportCsv(filters: ReportFilters) {
    try {
        const response = await laravelClient.get('/reports/export/tickets', {
            params: filters,
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
            params: filters,
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

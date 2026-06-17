export interface MaintenanceSchedule {
    id: string;
    title: string;
    description?: string;
    asset_id: string;
    type: 'maintenance' | 'inspection' | 'other';
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    next_run_date: string;
    last_run_date?: string;
    is_active: boolean;
    created_by: string;
    asset?: {
        id: string;
        name: string;
        serial_number: string;
    };
    creator?: {
        id: string;
        name: string;
        email: string;
    };
    created_at: string;
    updated_at: string;
}

export interface Notification {
    id: number;
    user_id: number;
    sender_id?: number;
    title: string;
    message: string;
    type: string;
    data?: any;
    read_at?: string;
    created_at: string;
}

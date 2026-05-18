export interface User {
    num_cni: any;
    created_at: string | number | Date;
    id: number;
    matricule: string;
    nom?: string;
    prenom?: string;
    username?: string;
    email?: string;
    date_naissance?: string;
    telephone: string;
    station_id: number;
    role_user: 'ADMIN' | 'CLIENT' | 'CHEF_AGENCE' | 'CHAUFFEUR' | 'AGENT'| 'PROPRIETAIRE';
    sexe: 'M' | 'F' | string;
    statut?: string,
    is_subscribed: number;
    subscription_expires_at: string;
    kyc_status?: string;
    profil_url?: string;
    google_id?: string;
    updated_at?: string;
}

export interface User {
    id: number;
    num_cni?: string;
    nom: string;
    prenom: string;
    email: string;
    date_naissance?: string;
    telephone: string;
    station_id: number;
    role_user: 'ADMIN' | 'CLIENT' | 'CHEF_AGENCE' | 'CHAUFFEUR' | 'AGENT' | 'CONTROLEUR' | 'PROPRIETAIRE';
    sexe: 'M' | 'F' | string;
    statut?: string,
    is_subscribed: number;
    subscription_expires_at: string;
    kyc_status?: string;
    updated_at?: string;
}

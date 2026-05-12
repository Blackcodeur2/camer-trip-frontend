import { Station } from "./station";
import { Trajet } from "./trajet";
import { User } from "./user";
import { Voyage } from "./voyage";

export interface Colis {
    user?: User;
    user_id?: number;
    nom_expediteur?: string;
    tel_expediteur?: string;
    nom_colis: string;
    description?: string;
    nom_destinataire: string;
    tel_destinataire: string;
    destination: string;
    trajet_id: number;
    trajet?: Trajet;
    prix: string | number;
    poids: number;
    created_at: string | number | Date;
    statut: string;
    station?: Station;
    station_id?: number;
    id: number;
    agent?: User;
    modified_by?: User;
}

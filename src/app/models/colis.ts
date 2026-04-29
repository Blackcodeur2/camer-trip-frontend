import { Trajet } from "./trajet";
import { User } from "./user";
import { Voyage } from "./voyage";

export interface Colis {
    user?: User;
    nom_colis: string;
    nom_destinataire: string;
    tel_destinataire: string;
    voyage?: Voyage;
    voyage_id?: number;
    prix: string | number;
    poids: number;
    created_at: string | number | Date;
    statut: string;
    trajet?: Trajet;
    id: number;
    user_id: number;
}

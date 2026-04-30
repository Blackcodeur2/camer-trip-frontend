import { User } from "./user";
import { Voyage } from "./voyage";

export interface Reservation {
    created_at: string | number | Date;
    place: any;
    num_reservation: any;
    id: number;
    statut: string;
    prix: number;
    voyage: Voyage;
    user?: User; 
}

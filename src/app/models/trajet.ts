import { Ville } from './ville';

export interface Trajet {
  id: number;
  station_id?: number;
  depart?: number | string;
  arrivee?: number | string;
  duree_heure?: number;
  type_trajet?: string;
  prix?: number;
  villeDepart?: Ville;
  villeArrivee?: Ville;
}


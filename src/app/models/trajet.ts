export interface Trajet {
  id: number;
  station_id?: number;
  depart?:  string;
  arrivee?: string;
  duree_heure?: number;
  type_trajet?: string;
  prix?: number;
  distance_km: number;
}


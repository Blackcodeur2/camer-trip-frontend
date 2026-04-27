import { Bus } from './bus';
import { Trajet } from './trajet';
import { User } from './user';

export interface Voyage {
  code_bus: any;
  places_disponibles: any;
  ville_depart: any;
  ville_arrivee: any;
  vehicule_immatriculation: any;
  id: number;
  num_voyage?: string;
  station_id?: number;
  trajet_id?: number;
  bus_id?: number;
  chauffeur_id?: number;
  date_depart?: string;
  heure_depart?: string;
  date_arrivee?: string;
  prix?: number;
  statut?: string;
  promo?: boolean;
  trajet?: Trajet;
  bus?: Bus;
  chauffeur?: User;
}


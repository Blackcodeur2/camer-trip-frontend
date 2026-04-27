import { Voyage } from './voyage';

export interface Station {
agence_nom: any;
ville_nom: any;
  ville: any;
  quartier: any;
  id: number;
  agence_id?: number;
  nom?: string;
  adresse?: string;
  telephone?: string;
  voyages?: Voyage[];
}


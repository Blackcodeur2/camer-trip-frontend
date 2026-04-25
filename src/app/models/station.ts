import { Voyage } from './voyage';

export interface Station {
  ville: any;
  quartier: any;
  id: number;
  agence_id?: number;
  nom?: string;
  adresse?: string;
  telephone?: string;
  voyages?: Voyage[];
}


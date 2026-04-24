import { Voyage } from './voyage';

export interface Station {
  id: number;
  agence_id?: number;
  nom?: string;
  adresse?: string;
  telephone?: string;
  voyages?: Voyage[];
}


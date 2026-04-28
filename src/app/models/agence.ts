import { Station } from './station';

export interface Agence {
statut: string;
  id: number;
  proprietaire_id?: number;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  logo?: string;
  ville: string;
  stations?: Station[];
}


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
  logo_url?: string;
  ville: string;
  stations?: Station[];
}


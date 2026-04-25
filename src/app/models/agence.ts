import { Station } from './station';

export interface Agence {
statut: any;
gares: any;
  id: number;
  proprietaire_id?: number;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  logo?: string;
  stations?: Station[];
}


import { User } from "./user";

export type KycDocType = 'cni_recto' | 'cni_verso' | 'selfie' | 'patente' | 'carte_grise' |
  'rccm' | 'dfe' | 'statuts' | 'pv_nomination' | 'rib' | 'gerant_id_recto' | 'gerant_id_verso' | 'gerant_selfie';

export type KycStatus = 'en attente' | 'approuve' | 'rejete';
export interface DocumentKYC {
  id: number;
  user_id: number;
  type: KycDocType | string;
  chemin_fichier: string;
  statut: KycStatus;
  commentaire: string;
  created_at: string;
  updated_at: string;
  user?: User;
}

/** Interface pour grouper les documents par utilisateur dans l'UI Admin */
export interface KycGroupedByUser {
  user: User;
  documents: DocumentKYC[];
  statutGlobal: KycStatus;
  isBusiness?: boolean;
}

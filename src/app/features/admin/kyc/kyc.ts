import { Component, inject, signal } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';
import { AdminService } from '../../../services/admin/admin-service';
import { DocumentKYC, KycGroupedByUser, KycStatus } from '../../../models/document-kyc';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { computed } from '@angular/core';

@Component({
  selector: 'app-kyc',
  imports: [MatIconModule, CommonModule, PaginationComponent],
  templateUrl: './kyc.html',
  styleUrl: './kyc.css',
})
export class Kyc {
   private adminService = inject(AdminService);

  private sanitizer = inject(DomSanitizer);

  submissions = signal<KycGroupedByUser[]>([]);
  isLoading = signal(true);
  isProcessing = signal(false);

  currentPage = signal(1);
  pageSize = signal(10);

  paginatedSubmissions = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.submissions().slice(start, end);
  });

  // Modal de prévisualisation
  previewDocument = signal<{ url: SafeResourceUrl | string, rawUrl: string, type: string, comment: string, isPdf: boolean, doc: DocumentKYC } | null>(null);
  selectedSubmission = signal<KycGroupedByUser | null>(null);

  ngOnInit() {
    this.loadPendingKyc();
  }

  loadPendingKyc() {
    this.isLoading.set(true);
    this.adminService.getPendingKyc().subscribe({
      next: (data: DocumentKYC[]) => {
        const list = Array.isArray(data) ? data : (data as any).data ?? [];
        this.submissions.set(this.groupDocumentsByUser(list));
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger les dossiers KYC.', 'error');
      }
    });
  }

  private groupDocumentsByUser(docs: DocumentKYC[]): KycGroupedByUser[] {
    const groups: { [key: number]: KycGroupedByUser } = {};

    docs.forEach(doc => {
      if (!doc.user) return;
      const userId = doc.user.id;
      if (!groups[userId]) {
        groups[userId] = {
          user: doc.user,
          documents: [],
          statutGlobal: 'en attente'
        };
      }
      groups[userId].documents.push(doc);
    });

    return Object.values(groups).map(group => {
      const hasPending = group.documents.some(d => d.statut === 'en attente');
      const hasRejected = group.documents.some(d => d.statut === 'rejete');
      const allApproved = group.documents.every(d => d.statut === 'approuve');

      let status: KycStatus = 'en attente';
      if (allApproved) status = 'approuve';
      else if (hasRejected && !hasPending) status = 'rejete';
      else if (hasPending) status = 'en attente';

      return {
        ...group,
        statutGlobal: status,
        isBusiness: group.documents.some(doc => ['rccm', 'dfe', 'statuts', 'rib'].includes(doc.type))
      };
    });
  }

  getDocUrl(doc: DocumentKYC): string {
    const storageUrl = environment.storageUrl || 'http://localhost:8000/storage';
    return doc.chemin_fichier.startsWith('http') 
      ? doc.chemin_fichier 
      : `${storageUrl}/${doc.chemin_fichier}`;
  }

  getDocLabel(type: string): string {
    const labels: Record<string, string> = {
      'cni_recto': 'CNI (Recto)',
      'cni_verso': 'CNI (Verso)',
      'selfie': 'Selfie',
      'passport_recto': 'Passeport (Page 1)',
      'passport_verso': 'Passeport (Page 2)',
      'residence_permit_recto': 'Permis Séjour (Recto)',
      'residence_permit_verso': 'Permis Séjour (Verso)',
      'rccm': 'Registre Commerce (RCCM)',
      'dfe': 'Décl. Existence (DFE)',
      'statuts': 'Statuts Société',
      'pv_nomination': 'PV Nomination',
      'rib': 'RIB Entreprise',
      'gerant_id_recto': 'ID Gérant (Recto)',
      'gerant_id_verso': 'ID Gérant (Verso)',
      'gerant_selfie': 'Selfie Gérant'
    };
    return labels[type] || type.replace(/_/g, ' ').toUpperCase();
  }

  viewDocument(doc: DocumentKYC) {
    const storageUrl = environment.storageUrl || 'http://localhost:8000/storage';
    // Le chemin peut être complet ou relatif
    const fullUrl = doc.chemin_fichier.startsWith('http') 
      ? doc.chemin_fichier 
      : `${storageUrl}/${doc.chemin_fichier}`;
      
    const isPdf = fullUrl.toLowerCase().endsWith('.pdf');
    const safeUrl = isPdf ? this.sanitizer.bypassSecurityTrustResourceUrl(fullUrl) : fullUrl;
    
    this.previewDocument.set({
      url: safeUrl,
      rawUrl: fullUrl,
      type: doc.type,
      comment: doc.commentaire,
      isPdf: isPdf,
      doc: doc // reference to the original document
    });
  }

  openSubmission(sub: KycGroupedByUser) {
    this.selectedSubmission.set(sub);
  }

  closeSubmission() {
    this.selectedSubmission.set(null);
  }

  closePreview() {
    this.previewDocument.set(null);
  }

  approveDocument(doc: DocumentKYC) {
    doc.statut = 'approuve';
    doc.commentaire = '';
    
    const sub = this.selectedSubmission();
    if (sub) {
      this.selectedSubmission.set({...sub});
    }
    
    this.closePreview();
  }

  rejectDocument(doc: DocumentKYC) {
    Swal.fire({
      title: 'Rejeter ce document ?',
      text: 'Veuillez saisir le motif du rejet :',
      input: 'textarea',
      inputPlaceholder: 'Document illisible, expiré, etc.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Rejeter',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#ef4444',
      preConfirm: (reason) => {
        if (!reason) {
          Swal.showValidationMessage('Un motif est obligatoire');
        }
        return reason;
      }
    }).then((result) => {
      if (result.isConfirmed && result.value) {
        doc.statut = 'rejete';
        doc.commentaire = result.value;
        
        const sub = this.selectedSubmission();
        if (sub) {
          this.selectedSubmission.set({...sub});
        }
        
        this.closePreview();
      }
    });
  }

  submitDecision(sub: KycGroupedByUser) {
    const hasPending = sub.documents.some(d => d.statut === 'en attente');
    if (hasPending) {
        Swal.fire('Attention', 'Veuillez traiter tous les documents avant de soumettre.', 'warning');
        return;
    }

    Swal.fire({
      title: 'Soumettre la décision ?',
      text: `Vous êtes sur le point d'envoyer votre décision finale pour ce dossier.`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Oui, soumettre',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#10b981'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isProcessing.set(true);
        const docsPayload = sub.documents.map(d => ({
            id: d.id,
            statut: d.statut,
            commentaire: d.commentaire
        }));

        this.adminService.processKyc(sub.user.id, docsPayload).subscribe({
            next: () => {
                this.isProcessing.set(false);
                this.submissions.update(list => list.filter(item => item.user.id !== sub.user.id));
                this.closeSubmission();
                Swal.fire('Succès', 'La décision a été enregistrée et un email a été envoyé si nécessaire.', 'success');
                this.loadPendingKyc();
            },
            error: () => {
                this.isProcessing.set(false);
                Swal.fire('Erreur', 'Impossible de soumettre la décision.', 'error');
            }
        });
      }
    });
  }

  isAnyDocPending(docs: DocumentKYC[]): boolean {
    return docs.some(d => d.statut === 'en attente');
  }
}

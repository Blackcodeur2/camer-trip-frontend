import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-kyc',
  imports: [CommonModule, MatIconModule],
  templateUrl: './kyc.html',
  styleUrl: './kyc.css',
})
export class Kyc {
  private proprietaireService = inject(ProprietaireService);

  documents = signal<any[]>([]);
  kycStatus = signal('');
  isLoading = signal(true);
  isUploading = signal<number | null>(null);

  ngOnInit() {
    this.loadKYC();
  }

  loadKYC() {
    this.isLoading.set(true);
    this.proprietaireService.getKYCDocuments().subscribe({
      next: (res) => {
        this.documents.set(res.data);
        this.kycStatus.set(res.kyc_status);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger vos documents KYC', 'error');
      }
    });
  }

  onFileSelected(event: any, docId: number) {
    const file = event.target.files[0];
    if (file) {
      this.resubmit(docId, file);
    }
  }

  resubmit(docId: number, file: File) {
    this.isUploading.set(docId);
    this.proprietaireService.resubmitKYCDocument(docId, file).subscribe({
      next: () => {
        this.isUploading.set(null);
        Swal.fire('Succès', 'Document renvoyé avec succès', 'success');
        this.loadKYC();
      },
      error: (err) => {
        this.isUploading.set(null);
        Swal.fire('Erreur', err.error?.message || 'Erreur lors du renvoi', 'error');
      }
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'approuve': return 'Approuvé';
      case 'rejete': return 'Rejeté';
      case 'en attente': return 'En attente';
      default: return 'Non soumis';
    }
  }
}

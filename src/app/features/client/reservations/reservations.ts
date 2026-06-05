import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Reservation } from '../../../models/reservation';
import { Router } from '@angular/router';
import { ClientService } from '../../../services/client/client-service';
import { TicketService } from '../../../services/ticket/ticket-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class Reservations implements OnInit {
  private clientService = inject(ClientService);
  private router = inject(Router);
  private ticketService = inject(TicketService);

  reservations = signal<Reservation[]>([]);
  searchTerm = signal<string>('');
  activeFilter = signal<'all' | 'validee' | 'en attente' | 'annule'>('all');
  isLoading = signal<boolean>(false);
  isPaying = signal<boolean>(false);

  stats = computed(() => {
    const all = this.reservations();
    const validated = all.filter(r => r.statut === 'validee');
    const totalSpent = validated.reduce((sum, r) => sum + Number(r.prix), 0);
    return {
      total: all.length,
      spent: totalSpent,
      validated: validated.length,
      pending: all.filter(r => r.statut === 'en attente').length
    };
  });

  filteredReservations = computed(() => {
    let list = this.reservations();
    const filter = this.activeFilter();
    const search = this.searchTerm().toLowerCase();

    if (filter !== 'all') {
      list = list.filter(r => r.statut === filter);
    }

    if (search) {
      list = list.filter(r =>
        r.num_reservation.toLowerCase().includes(search) ||
        (r.voyage?.trajet?.depart || '').toLowerCase().includes(search) ||
        (r.voyage?.trajet?.arrivee || '').toLowerCase().includes(search)
      );
    }

    return list;
  });

  ngOnInit(): void {
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading.set(true);
    this.clientService.getMyReservations().subscribe({
      next: (data) => {
        this.reservations.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  setFilter(filter: 'all' | 'validee' | 'en attente' | 'annule'): void {
    this.activeFilter.set(filter);
  }

  onPayReservation(reservation: Reservation): void {
    this.processPayment(reservation.id);
  }

  async processPayment(reservationId: number) {
    const { value: phone } = await Swal.fire({
      title: 'Paiement Mobile',
      text: 'Entrez votre numéro de téléphone de paiement',
      input: 'text',
      inputPlaceholder: '6XXXXXXXX',
      showCancelButton: true,
      confirmButtonText: 'Payer maintenant',
      confirmButtonColor: '#2563eb',
      inputValidator: (value) => {
        if (!value) return 'Le numéro est requis';
        return null;
      }
    });

    if (phone) {
      let formattedPhone = phone.trim();
      if (/^6\d{8}$/.test(formattedPhone)) {
        formattedPhone = '237' + formattedPhone;
      }

      Swal.fire({
        title: 'Initialisation...',
        text: 'Veuillez confirmer le paiement sur votre téléphone',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      this.clientService.initiatePayment(reservationId, formattedPhone).subscribe({
        next: (res) => {
          this.pollPaymentStatus(res.reference);
        },
        error: (err) => {
          Swal.fire('Erreur', err.error?.message || 'Échec de l\'initialisation du paiement.', 'error');
        }
      });
    }
  }

  pollPaymentStatus(reference: string) {
    const interval = setInterval(() => {
      this.clientService.checkPaymentStatus(reference).subscribe({
        next: (res) => {
          if (res.statut === 'SUCCESSFUL') {
            clearInterval(interval);
            Swal.fire('Succès', 'Paiement réussi ! Votre billet est prêt.', 'success').then(() => {
              this.loadReservations();
            });
          } else if (res.statut === 'FAILED' || res.statut === 'echoue') {
            clearInterval(interval);
            Swal.fire('Échec', 'Le paiement a échoué.', 'error');
          }
        },
        error: () => {}
      });
    }, 3000);

    setTimeout(() => clearInterval(interval), 120000);
  }

  goToVoyages(): void {
    this.router.navigate(['/client/agences']);
  }

  downloadTicket(reservationId: number): void {
    this.ticketService.downloadTicket(reservationId);
  }

  canSignalerEmpechement(reservation: Reservation): boolean {
    if (!['validee', 'en attente'].includes(reservation.statut)) return false;
    if (reservation.empechement_signale_at) return false;
    const voyageStatut = reservation.voyage.statut.toLowerCase();
    return !voyageStatut || !['en cours', 'termine', 'terminé', 'annule', 'annulé'].includes(voyageStatut);
  }

  async onSignalerEmpechement(reservation: Reservation) {
    const { value: motif } = await Swal.fire({
      title: 'Signaler un empêchement',
      html: '<p style="font-size:0.9rem;color:#64748b;margin-bottom:1rem;">Vous ne pourrez pas effectuer ce voyage. Décrivez brièvement la raison.</p>',
      input: 'textarea',
      inputPlaceholder: 'Ex: Problème de santé, urgence familiale...',
      inputAttributes: { maxlength: '1000' },
      showCancelButton: true,
      confirmButtonText: 'Envoyer le signalement',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#f59e0b',
      inputValidator: (value) => {
        if (!value || value.trim().length < 10) {
          return 'Veuillez décrire votre empêchement (au moins 10 caractères).';
        }
        return null;
      }
    });

    if (!motif) return;

    Swal.fire({
      title: 'Envoi en cours...',
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    this.clientService.signalerEmpechement(reservation.id, motif.trim()).subscribe({
      next: () => {
        Swal.fire(
          'Signalé',
          'Votre empêchement a été transmis à l\'agence. Vous serez contacté si nécessaire.',
          'success'
        ).then(() => this.loadReservations());
      },
      error: (err) => {
        Swal.fire('Erreur', err.error?.message || 'Impossible d\'envoyer le signalement.', 'error');
      }
    });
  }

  async onReportIncident(reservation: Reservation) {
    const { value: formValues } = await Swal.fire({
      title: 'Signaler un incident',
      html: `
        <select id="swal-input-type" class="swal2-input" style="width: 80%; max-width: 100%;">
          <option value="" disabled selected>Type d'incident...</option>
          <option value="panne">Panne</option>
          <option value="accident">Accident</option>
          <option value="retard">Retard important</option>
          <option value="perte">Perte de bagage</option>
          <option value="autre">Autre</option>
        </select>
        <textarea id="swal-input-desc" class="swal2-textarea" placeholder="Description détaillée de l'incident..." style="width: 80%; max-width: 100%;"></textarea>
        <div style="margin-top: 15px; text-align: left; width: 80%; max-width: 100%; margin-left: auto; margin-right: auto;">
          <label style="font-size: 0.9em; font-weight: bold;">Preuve en photo (Requise)</label>
          <input type="file" id="swal-input-file" class="swal2-file" accept="image/*" style="width: 100%; margin-top: 8px;">
        </div>
      `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Signaler',
      cancelButtonText: 'Annuler',
      confirmButtonColor: '#E21E26',
      preConfirm: () => {
        const type = (document.getElementById('swal-input-type') as HTMLSelectElement).value;
        const desc = (document.getElementById('swal-input-desc') as HTMLTextAreaElement).value;
        const fileInput = document.getElementById('swal-input-file') as HTMLInputElement;
        const file = fileInput.files ? fileInput.files[0] : null;

        if (!type || !desc || !file) {
          Swal.showValidationMessage('Veuillez remplir tous les champs et joindre une photo.');
          return false;
        }
        
        if (file.size > 2 * 1024 * 1024) {
          Swal.showValidationMessage('La taille de la photo ne doit pas dépasser 2 Mo.');
          return false;
        }

        return { type, desc, file };
      }
    });

    if (formValues) {
      Swal.fire({
        title: 'Envoi en cours...',
        text: 'Veuillez patienter pendant le téléchargement de la photo.',
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const formData = new FormData();
      formData.append('voyage_id', String(reservation.voyage.id));
      formData.append('type', formValues.type);
      formData.append('description', formValues.desc);
      formData.append('niveau_gravite', 'MOYEN'); // Par défaut pour les clients
      formData.append('photo', formValues.file);

      this.clientService.reportIncident(formData).subscribe({
        next: () => {
          Swal.fire('Signalé !', 'L\'incident a été transmis à l\'agence avec succès.', 'success');
        },
        error: (err) => {
          Swal.fire('Erreur', err.error?.message || 'Impossible d\'envoyer le signalement.', 'error');
        }
      });
    }
  }
}

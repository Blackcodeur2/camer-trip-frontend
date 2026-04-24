import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import Swal from 'sweetalert2';
import { AuthService } from '../../../services/auth/auth-service';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';

interface Stats {
  agences: number;
  gares: number;
  buses: number;
  trajets: number;
  voyages: number;
  utilisateurs: number;
  chauffeurs: number;
  agents: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private authService = inject(AuthService);
  private proprietaireService = inject(ProprietaireService);

  userName = signal('');
  kycStatus = signal('');
  isSubscribed = signal(false);
  isRestricted = signal(false);
  stats = signal<Stats | null>(null);
  isLoading = signal(true);
  isPaying = signal(false);

  statItems = [
    { key: 'agences', label: 'Agences', icon: 'business', color: '#2563eb' },
    { key: 'gares', label: 'Gares', icon: 'location_on', color: '#f59e0b' },
    { key: 'buses', label: 'Bus', icon: 'directions_bus', color: '#f59e0b' },
    { key: 'trajets', label: 'Trajets', icon: 'route', color: '#8b5cf6' },
    { key: 'voyages', label: 'Voyages', icon: 'flight_takeoff', color: '#06b6d4' },
    { key: 'utilisateurs', label: 'Utilisateurs', icon: 'people', color: '#10b981' },
  ];

  ngOnInit() {
    // Refresh user data to get latest KYC/Subscription status
    this.authService.fetchUser().subscribe({
      next: (user) => {
        if (user) {
          this.userName.set(`${user.prenom} ${user.nom}`);
          this.kycStatus.set(user.kyc_status || user.statut || '');
          this.isSubscribed.set(!!user.is_subscribed);

          const restricted = (user.kyc_status !== 'APPROVED' && user.statut !== 'approuve') || !user.is_subscribed;
          this.isRestricted.set(restricted);

          if (!restricted) {
            this.loadStats();
          } else {
            this.isLoading.set(false);
          }
        }
      },
      error: () => {
        // Fallback to local user if fetch fails
        const user = this.authService.currentUser();
        if (user) {
          this.userName.set(`${user.prenom} ${user.nom}`);
          this.kycStatus.set(user.kyc_status || user.statut || '');
          this.isSubscribed.set(!!user.is_subscribed);
          this.isRestricted.set((user.kyc_status !== 'APPROVED' && user.statut !== 'approuve') || !user.is_subscribed);
        }
        this.isLoading.set(false);
      }
    });
  }

  onLogout() {
    this.authService.logout().subscribe(() => {
      this.authService.clearSession();
      window.location.href = '/auth/login';
    });
  }

  subscribe() {
    Swal.fire({
      title: 'Souscrire à l\'abonnement',
      text: 'L\'abonnement annuel coûte 50,000 FCFA. Entrez votre numéro Mobile Money (237...)',
      input: 'text',
      inputPlaceholder: '2376xxxxxxxx',
      showCancelButton: true,
      confirmButtonText: 'Payer',
      showLoaderOnConfirm: true,
      preConfirm: (phone) => {
        if (!phone.startsWith('237') || phone.length < 12) {
          Swal.showValidationMessage('Numéro invalide. Format: 237xxxxxxxxx');
          return false;
        }
        return phone;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        this.isPaying.set(true);
        this.proprietaireService.initiateSubscriptionPayment(result.value).subscribe({
          next: (res) => {
            this.isPaying.set(false);
            Swal.fire('Succès', 'Demande envoyée. Validez sur votre téléphone.', 'success');
          },
          error: (err) => {
            this.isPaying.set(false);
            Swal.fire('Erreur', 'Impossible d\'initier le paiement.', 'error');
          }
        });
      }
    });
  }

  loadStats() {
    this.isLoading.set(true);
    this.proprietaireService.getMyStatistics().subscribe({
      next: (data) => {
        const statsData = data.data || data;
        this.stats.set(statsData);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger les statistiques.', 'error');
      }
    });
  }

  getStatValue(key: string): number {
    const stat = this.stats();
    if (!stat) return 0;
    return (stat as any)[key] || 0;
  }
}

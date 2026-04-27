import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import Chart from 'chart.js/auto';
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
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private authService = inject(AuthService);
  private proprietaireService = inject(ProprietaireService);

  userName = signal('');
  kycStatus = signal('');
  isSubscribed = signal(false);
  stats = signal<Stats | null>(null);
  isLoading = signal(true);
  isPaying = signal(false);

  statItems = [
    { key: 'agences', label: 'Agences', icon: 'business' },
    { key: 'gares', label: 'Gares', icon: 'location_on' },
    { key: 'buses', label: 'Bus', icon: 'directions_bus' },
    { key: 'trajets', label: 'Trajets', icon: 'route' },
    { key: 'voyages', label: 'Voyages', icon: 'flight_takeoff' },
    { key: 'utilisateurs', label: 'Utilisateurs', icon: 'people' },
  ];

  ngOnInit() {
    const localUser = this.authService.currentUser();

    if (localUser) {
      // Données déjà disponibles depuis le login — on les utilise directement
      this.userName.set(`${localUser.prenom || ''} ${localUser.nom || ''}`.trim());
      this.kycStatus.set(localUser.kyc_status || localUser.statut || '');
      this.isSubscribed.set(!!localUser.is_subscribed);
      this.loadStats();
    } else {
      // Aucune donnée locale — tenter un refresh depuis l'API
      this.authService.fetchUser().subscribe({
        next: (user) => {
          if (user && user.role_user === 'PROPRIETAIRE') {
            this.userName.set(`${user.prenom || ''} ${user.nom || ''}`.trim());
            this.kycStatus.set(user.kyc_status || user.statut || '');
            this.isSubscribed.set(!!user.is_subscribed);
            this.loadStats();
          } else {
            this.isLoading.set(false);
          }
        },
        error: () => this.isLoading.set(false)
      });
    }
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
      text: 'L\'abonnement annuel coûte 100,000 FCFA. Entrez votre numéro Mobile Money (237...)',
      input: 'text',
      inputPlaceholder: '6xxxxxxxx',
      showCancelButton: true,
      confirmButtonText: 'Payer',
      showLoaderOnConfirm: true,
      preConfirm: (phone) => {
        if (!phone.startsWith('6') || phone.length < 9) {
          Swal.showValidationMessage('Numéro invalide. Format: 6xxxxxxxx');
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
    
    // Simulation des données en attendant que la route soit disponible
    setTimeout(() => {
      const mockStats: Stats = {
        agences: 1,
        gares: 2,
        buses: 6,
        trajets: 5,
        voyages: 7,
        utilisateurs: 13,
        chauffeurs: 5,
        agents: 3
      };
      
      this.stats.set(mockStats);
      this.isLoading.set(false);
      setTimeout(() => this.initChart(), 0);
    }, 800);
  }

  getStatValue(key: string): number {
    const stat = this.stats();
    if (!stat) return 0;
    return (stat as any)[key] || 0;
  }

  chart: any;

  initChart() {
    const ctx = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const gradient = ctx.getContext('2d')?.createLinearGradient(0, 0, 0, 400);
    if (gradient) {
      gradient.addColorStop(0, 'rgba(0, 102, 68, 0.4)');
      gradient.addColorStop(1, 'rgba(0, 102, 68, 0)');
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        datasets: [{
          label: 'Réservations de vos Agences',
          data: [45, 80, 110, 90, 85, 130, 180, 160, 100, 75, 95, 120],
          borderColor: '#006644',
          backgroundColor: gradient || 'rgba(0, 102, 68, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#006644',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#1e293b',
            titleFont: { size: 14, weight: 'bold' },
            padding: 12,
            cornerRadius: 12,
            displayColors: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: { font: { size: 11 } }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }
}

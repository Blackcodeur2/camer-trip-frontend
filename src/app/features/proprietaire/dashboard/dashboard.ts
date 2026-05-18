import { CommonModule } from '@angular/common';
import { Component, inject, signal, effect, AfterViewInit, computed } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
import { AuthService } from '../../../services/auth/auth-service';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';

interface Stats {
  agences: number;
  stations: number;
  buses: number;
  trajets: number;
  voyages: number;
  utilisateurs: number;
  chauffeurs: number;
  agents: number;
  chefs_agence: number;
}

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements AfterViewInit {
  private authService = inject(AuthService);
  private proprietaireService = inject(ProprietaireService);

  userName = signal('');
  kycStatus = signal('');
  isSubscribed = signal(false);
  stats = signal<Stats | null>(null);
  revenueHistory = signal<any[]>([]);
  subscription = signal<any>(null);
  isLoading = signal(true);
  isPaying = signal(false);

  // Informations sur le plan d'abonnement actif
  planNom = signal('Plan Annuel');
  planMontant = signal(50000);
  planDuree = signal(12);

  constructor() {
    effect(() => {
      const history = this.revenueHistory();
      const stats = this.stats();
      const loading = this.isLoading();

      if (!loading) {
        setTimeout(() => {
          if (history.length >= 0) {
            if (!this.chart) {
              this.initActivityChart();
            } else {
              this.updateActivityChart(history);
            }
          }
          if (stats) {
            this.initPersonnelChart();
          }
        }, 0);
      }
    });
  }

  statItems = [
    { key: 'agences', label: 'Agences', icon: 'business' },
    { key: 'stations', label: 'Stations', icon: 'location_on' },
    { key: 'buses', label: 'Bus', icon: 'directions_bus' },
    { key: 'utilisateurs', label: 'Employés', icon: 'people' },
  ];

  ngOnInit() {
    this.isLoading.set(true);
    this.loadSubscriptionPlan();
    
    // On commence par charger ce qu'on a en local pour un affichage rapide
    const localUser = this.authService.currentUser();
    if (localUser) {
      this.userName.set(`${localUser.prenom || ''} ${localUser.nom || ''}`.trim());
      this.kycStatus.set(localUser.kyc_status || localUser.statut || '');
      this.isSubscribed.set(!!localUser.is_subscribed);
    }

    // Mais on force TOUJOURS un fetch pour avoir le statut réel (abonnement, KYC)
    this.authService.fetchUser().subscribe({
      next: (user) => {
        if (user && user.role_user === 'PROPRIETAIRE') {
          this.userName.set(`${user.prenom || ''} ${user.nom || ''}`.trim());
          this.kycStatus.set(user.kyc_status || user.statut || '');
          this.isSubscribed.set(!!user.is_subscribed);
          
          if (user.is_subscribed && this.kycStatus() === 'approuve') {
            this.loadStats();
            this.loadStations();
          } else {
            this.isLoading.set(false);
          }
        } else {
          this.isLoading.set(false);
        }
      },
      error: () => {
        // En cas d'erreur réseau, on tente quand même de charger les stats si le local dit qu'on est abonné
        if (localUser?.is_subscribed && this.kycStatus() === 'approuve') {
          this.loadStats();
          this.loadStations();
        } else {
          this.isLoading.set(false);
        }
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
    const formattedPrice = new Intl.NumberFormat('fr-FR').format(this.planMontant());
    const periodLabel = this.planDuree() === 12 ? 'annuel' : `${this.planDuree()} mois`;

    Swal.fire({
      title: 'Souscrire à l\'abonnement',
      text: `L'abonnement ${periodLabel} coûte ${formattedPrice} FCFA. Entrez votre numéro Mobile Money (237...)`,
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
        return '237'+ phone;
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
            Swal.fire('Erreur', err.error?.message || 'Impossible d\'initier le paiement.', 'error');
          }
        });
      }
    });
  }

  loadSubscriptionPlan() {
    this.proprietaireService.getSubscriptionPlan().subscribe({
      next: (plan) => {
        if (plan) {
          this.planNom.set(plan.nom || 'Plan Annuel');
          this.planMontant.set(Number(plan.montant ?? 50000));
          this.planDuree.set(Number(plan.duree ?? 12));
        }
      },
      error: (err) => console.error('Erreur chargement plan d\'abonnement', err)
    });
  }

  stations = signal<any[]>([]);
  selectedStationId = signal<number | null>(null);

  loadStats(stationId?: number) {
    // On ne montre le loader principal que lors du tout premier chargement
    // Pour les filtres, on évite de détruire tout le DOM pour préserver les charts
    const isInitialLoad = !this.stats();
    if (isInitialLoad) {
      this.isLoading.set(true);
    }

    this.proprietaireService.getMyStatistics(stationId).subscribe({
      next: (data) => {
        this.stats.set(data.stats);
        this.revenueHistory.set(data.revenue_history);
        
        if (data.isSubscribed !== undefined) {
          this.isSubscribed.set(!!data.isSubscribed);
        }

        if (this.isSubscribed()) {
          this.loadSubscription();
        }

        setTimeout(() => {
          if (isInitialLoad) {
            this.initCharts();
            this.isLoading.set(false);
          } else {
            // Si ce n'est pas le chargement initial, l'effect se chargera d'appeler updateActivityChart
            // Mais on peut forcer une mise à jour ici au cas où
            this.updateActivityChart(data.revenue_history);
            this.initPersonnelChart();
          }
        }, 100);
      },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire('Erreur', err.error?.message || 'Impossible de charger les statistiques.', 'error');
      }
    });
  }

  loadSubscription() {
    this.proprietaireService.getMySubscription().subscribe({
      next: (sub) => this.subscription.set(sub),
      error: (err) => console.error('Error fetching subscription', err)
    });
  }

  loadStations() {
    this.proprietaireService.getMyStations().subscribe({
      next: (stations) => this.stations.set(stations),
      error: (err) => console.error('Error loading stations', err)
    });
  }

  onStationChange(event: Event) {
    const value = (event.target as HTMLSelectElement).value;
    const stationId = value ? parseInt(value, 10) : undefined;
    this.selectedStationId.set(stationId || null);
    this.loadStats(stationId);
  }

  getStatValue(key: string): number {
    const stat = this.stats();
    if (!stat) return 0;
    return (stat as any)[key] || 0;
  }

  chart: any;
  doughnutChart: any;

  initCharts() {
    this.initActivityChart();
    this.initPersonnelChart();
  }

  ngAfterViewInit() {
    this.initCharts();
  }

  initActivityChart() {
    const canvas = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, 'rgba(0, 102, 68, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 102, 68, 0)');

    const history = this.revenueHistory();

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: history.length > 0 ? history.map(h => h.label) : ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        datasets: [{
          label: 'Revenus (FCFA)',
          data: history.length > 0 ? history.map(h => h.amount) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderColor: '#006644',
          backgroundColor: gradient,
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
            displayColors: false,
            callbacks: {
              label: (context) => {
                let label = context.dataset.label || '';
                if (label) label += ': ';
                if (context.parsed.y !== null) {
                  label += new Intl.NumberFormat('fr-FR').format(context.parsed.y) + ' FCFA';
                }
                return label;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              font: { size: 11 },
              callback: (value) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(value as number)
            }
          },
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }

  private updateActivityChart(history: any[]) {
    if (!this.chart) {
      this.initActivityChart();
      return;
    }
    
    // Vérifier si le canvas de la chart actuelle est toujours dans le DOM
    if (!document.body.contains(this.chart.canvas)) {
      this.chart.destroy();
      this.initActivityChart();
      return;
    }

    this.chart.data.labels = history.length > 0 ? history.map(h => h.label) : ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    this.chart.data.datasets[0].data = history.length > 0 ? history.map(h => h.amount) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    this.chart.update();
  }

  initPersonnelChart() {
    const ctx = document.getElementById('personnelChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.doughnutChart) {
      this.doughnutChart.destroy();
    }

    const chauffeurs = this.getStatValue('chauffeurs');
    const agents = this.getStatValue('agents');
    const chefsAgences = this.getStatValue('chefs_agence');

    // S'il n'y a aucune donnée, on met des valeurs fictives légères pour ne pas avoir un chart vide
    const dataValues = (chauffeurs === 0 && agents === 0 && chefsAgences === 0) ? [1, 1, 1] : [chauffeurs, agents, chefsAgences];

    this.doughnutChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Chauffeurs', 'Agents', 'Chefs d\'Agences'],
        datasets: [{
          data: dataValues,
          backgroundColor: [
            '#12674bff', // Blue
            '#d63547ff', // Purple
            '#f1db18ff'  // Yellow
          ],
          borderWidth: 0,
          hoverOffset: 4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '75%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { size: 13, family: "'Inter', sans-serif" }
            }
          },
          tooltip: {
            backgroundColor: '#1e293b',
            padding: 12,
            cornerRadius: 12,
            callbacks: {
              label: function(context) {
                let label = context.label || '';
                if (label) {
                  label += ': ';
                }
                if (context.raw !== null) {
                  // Si données fictives, on affiche 0
                  if (chauffeurs === 0 && agents === 0) {
                     label += 0;
                  } else {
                     label += context.raw;
                  }
                }
                return label;
              }
            }
          }
        }
      }
    });
  }
}

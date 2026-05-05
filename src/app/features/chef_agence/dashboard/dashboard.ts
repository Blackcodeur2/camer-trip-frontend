import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal, effect, AfterViewInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { ChefAgenceService } from '../../../services/chef_agence/chef-agence-service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements AfterViewInit {
  private authService = inject(AuthService);
  private chefAgenceService = inject(ChefAgenceService);
  private router = inject(Router);
  chart: any;

  constructor() {
    // Reactively update the chart when revenue data changes
    effect(() => {
      const data = this.revenueChart();
      if (data.length > 0 && this.chart) {
        this.updateChart(data);
      }
    });
  }
  isLoading = signal(true);
  dashboardData = signal<any>(null);
  user = this.authService.currentUser;

  recentReservations = signal<any[]>([]);

  agencyName = computed(() => {
    if (this.user()?.prenom) {
      return `Tableau de bord de ${this.user()?.prenom}`;
    }
    return 'Tableau de bord Agence';
  });

  agencyStatus = computed(() => {
    if (this.isLoading()) {
      return 'Chargement des données de l’agence…';
    }
    return `${this.totalBuses()} bus · ${this.totalRoutes()} trajets · ${this.totalStaff()} membres actifs`;
  });

  totalBuses = computed(() => this.dashboardData()?.stats?.total_buses ?? 0);
  totalStaff = computed(() => this.dashboardData()?.stats?.total_staff ?? 0);
  totalRoutes = computed(() => this.dashboardData()?.stats?.total_trajets ?? 0);
  ticketsSoldToday = computed(() => this.dashboardData()?.stats?.tickets_today ?? 0);
  dailyRevenue = computed(() => this.dashboardData()?.stats?.revenue_today ?? 0);

  busesOnRoad = computed(() => {
    const raw = this.dashboardData()?.fleet_status ?? [];
    const match = raw.find((r: any) => r.statut === 'en voyage');
    return match ? parseInt(match.count) : 0;
  });

  busUsage = computed(() => this.totalBuses() > 0 ? Math.round((this.busesOnRoad() / this.totalBuses()) * 100) : 0);
  activeStaff = computed(() => this.totalStaff());

  revenueChart = computed(() => {
    const history = this.dashboardData()?.revenue_history ?? [];
    const maxAmount = Math.max(...history.map((h: any) => h.amount), 50000); // Scale relative to max or 50k

    return history.map((item: any) => {
      const date = new Date(item.date);
      const label = date.toLocaleDateString('fr-FR', { weekday: 'short' });
      return {
        day: label,
        amount: item.amount,
        height: Math.min(100, Math.max(12, Math.round((item.amount / maxAmount) * 100)))
      };
    });
  });



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

    const revenueData = this.revenueChart();
    const labels = revenueData.map((d: any) => d.day);
    const amounts = revenueData.map((d: any) => d.amount);

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels.length > 0 ? labels : ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [{
          label: 'Revenus (FCFA)',
          data: amounts.length > 0 ? amounts : [0, 0, 0, 0, 0, 0, 0],
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

  private updateChart(data: any[]) {
    if (!this.chart) return;
    this.chart.data.labels = data.map((d: any) => d.day);
    this.chart.data.datasets[0].data = data.map((d: any) => d.amount);
    this.chart.update();
  }

  fleetStatus = computed(() => {
    const raw = this.dashboardData()?.fleet_status ?? [];
    const total = Math.max(this.totalBuses(), 1);

    const statusConfig: any = {
      'en voyage': { label: 'En route', color: '#60A5FA' },
      'disponible': { label: 'Disponible', color: '#34D399' },
      'en maintenance': { label: 'Maintenance', color: '#FBBF24' },
      'indisponible': { label: 'Indisponible', color: '#F87171' }
    };

    return Object.keys(statusConfig).map(statut => {
      const match = raw.find((r: any) => r.statut === statut);
      const count = match ? parseInt(match.count) : 0;
      return {
        label: statusConfig[statut].label,
        count: count,
        percentage: Math.round((count / total) * 100),
        color: statusConfig[statut].color
      };
    });
  });

  maintenanceCount = computed(() => this.fleetStatus().find(s => s.label === 'Maintenance')?.count ?? 0);

  liveTrips = computed(() => this.dashboardData()?.live_trips ?? []);

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    this.initActivityChart();
  }

  navigateTo(path: string) {
    void this.router.navigate([path]);
  }

  private loadStats() {
    this.isLoading.set(true);

    this.chefAgenceService.getDashboardStats().subscribe({
      next: (data: any) => {
        this.dashboardData.set(data);
        this.recentReservations.set(data.recent_reservations);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
      }
    });
  }
}

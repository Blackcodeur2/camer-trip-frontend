import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private authService = inject(AuthService);
  private router = inject(Router);

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

  navigateTo(path: string) {
    void this.router.navigate([path]);
  }

  private loadStats() {
    this.isLoading.set(true);
    this.dashboardData.set([]);
    this.recentReservations.set([]);
    this.isLoading.set(false);
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject, signal, effect, AfterViewInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { catchError, of } from 'rxjs';
import { AgentService } from '../../../services/agent/agent-service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements AfterViewInit {
  private agentService = inject(AgentService);
  private router = inject(Router);

  isLoading = signal(true);
  stats = signal({ salesToday: 0, activeReservations: 0, revenueToday: 0, pendingValidations: 0 });
  revenueHistory = signal<any[]>([]);
  liveTrips = signal<any[]>([]);
  exportingVoyageId = signal<number | null>(null);
  chart: any;

  constructor() {
    effect(() => {
      const history = this.revenueHistory();
      const loading = this.isLoading();
      if (!loading && history.length >= 0) {
        setTimeout(() => {
          
        }, 0);
      }
    });
  }

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
  
  }

  navigateTo(path: string) {
    void this.router.navigate([path]);
  }

  private loadStats() {
    this.agentService.getDashboardStats()
      .pipe(catchError((err: any) => {
        console.error('Error loading dashboard stats:', err);
        return of({ stats: { sales_today: 0, active_reservations: 0, revenue_today: 0, pending_validations: 0 }, revenue_history: [] });
      }))
      .subscribe((data: any) => {
        const stats = data.stats || data;
        this.stats.set({
          salesToday: stats.sales_today || 0,
          activeReservations: stats.active_reservations || 0,
          revenueToday: stats.revenue_today || 0,
          pendingValidations: stats.pending_validations || 0
        });
        const formattedHistory = (data.revenue_history || []).map((h: any) => {
          const [year, month, day] = h.date.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          let label = date.toLocaleDateString('fr-FR', { weekday: 'short' }).replace('.', '');
          label = label.charAt(0).toUpperCase() + label.slice(1);
          return { ...h, label };
        });
        this.revenueHistory.set(formattedHistory);
        this.liveTrips.set(data.live_trips || []);
        this.isLoading.set(false);
      });
  }

  exportManifeste(voyageId: number) {
    this.exportingVoyageId.set(voyageId);
    this.agentService.exportPassagersPdf(voyageId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `manifeste_voyage_${voyageId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.exportingVoyageId.set(null);
      },
      error: () => {
        this.exportingVoyageId.set(null);
        // SweetAlert n'est peut être pas importé, mais si on l'ajoute on peut l'utiliser
        // Swal.fire('Erreur', 'Impossible de générer le manifeste', 'error');
        alert('Impossible de générer le manifeste');
      }
    });
  }
}

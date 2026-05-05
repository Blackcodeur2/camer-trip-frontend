import { Component, inject, signal, effect, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../services/admin/admin-service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard implements AfterViewInit {
  private adminService = inject(AdminService);

  totalUsers = signal(0);
  totalAgencies = signal(0);
  totalStations = signal(0);
  totalBuses = signal(0);
  totalVoyages = signal(0);
  totalRevenue = signal(0);

  revenueHistory = signal<any[]>([]);
  isLoading = signal(true);
  chart: any;

  constructor() {
    effect(() => {
      const history = this.revenueHistory();
      const loading = this.isLoading();
      
      if (!loading && history.length >= 0) {
        // We need a small timeout to let Angular render the @else block
        setTimeout(() => {
          if (!this.chart) {
            this.initChart();
          } else {
            this.updateChart(history);
          }
        }, 0);
      }
    });
  }

  ngOnInit() {
    this.loadStats();
  }

  ngAfterViewInit() {
    this.initChart();
  }

  loadStats() {
    this.isLoading.set(true);

    this.adminService.getDashboardStats().subscribe({
      next: (data: any) => {
        const stats = data.stats;
        this.totalUsers.set(stats.total_users || 0);
        this.totalAgencies.set(stats.total_agencies || 0);
        this.totalStations.set(stats.total_stations || 0);
        this.totalBuses.set(stats.total_buses || 0);
        this.totalVoyages.set(stats.total_voyages || 0);
        this.totalRevenue.set(stats.total_revenue || 0);
        
        this.revenueHistory.set(data.revenue_history || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error("Erreur Dashboard Admin:", err);
        this.isLoading.set(false);
      }
    });
  }

  initChart() {
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
          label: 'Revenus Global (FCFA)',
          data: history.length > 0 ? history.map(h => h.amount) : [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
          borderColor: '#006644',
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointBackgroundColor: '#006644',
          pointBorderColor: '#fff',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#0f172a',
            padding: 12,
            titleFont: { size: 14, weight: 'bold' },
            bodyFont: { size: 13 },
            cornerRadius: 12,
            displayColors: false,
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return value !== null ? new Intl.NumberFormat('fr-FR').format(value) + ' FCFA' : '';
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            ticks: {
              callback: (value) => new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(value as number)
            }
          },
          x: {
            grid: { display: false }
          }
        }
      }
    });
  }

  private updateChart(history: any[]) {
    if (!this.chart) return;
    this.chart.data.labels = history.map(h => h.label);
    this.chart.data.datasets[0].data = history.map(h => h.amount);
    this.chart.update();
  }
}

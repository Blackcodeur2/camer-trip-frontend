import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AdminService } from '../../../services/admin/admin-service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css'],
})
export class Dashboard {
  private adminService = inject(AdminService);


  totalUsers = signal(0);
  totalAgencies = signal(0);
  totalGares = signal(0);
  totalTrips = signal(0);
  totalBuses = signal(0);

  isLoading = signal(true);

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.isLoading.set(true);

    forkJoin({
      users: this.adminService.getUsers(),
      agencies: this.adminService.getAgences()
    }).subscribe({
      next: (res: any) => {
        const usersList = Array.isArray(res.users) ? res.users : (res.users?.data || []);
        const agenciesList = Array.isArray(res.agencies) ? res.agencies : (res.agencies?.data || []);

        this.totalUsers.set(usersList.length);
        this.totalAgencies.set(agenciesList.length);

        // Calcul robuste des gares à travers toutes les agences
        let garesCount = 0;
        agenciesList.forEach((a: any) => {
          if (Array.isArray(a.stations)) {
            garesCount += a.stations.length;
          } else if (a.nb_gares) { // Fallback si le backend renvoie juste le compte
            garesCount += Number(a.nb_gares);
          }
        });
        this.totalGares.set(garesCount);

        // Statistiques simulées basées sur les entités réelles
        const baseTrips = agenciesList.length;
        this.totalTrips.set(baseTrips > 0 ? baseTrips  : 0);
        this.totalBuses.set(agenciesList.length );

        this.isLoading.set(false);
        setTimeout(() => this.initChart(), 0);

      },
      error: (err) => {
        console.error("Erreur Dashboard Admin:", err);
        this.isLoading.set(false);
      }
    });
  }

  chart: any;

  initChart() {
    const ctx = document.getElementById('activityChart') as HTMLCanvasElement;
    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        datasets: [{
          label: 'Réservations',
          data: [120, 190, 300, 250, 200, 320, 400, 380, 210, 150, 180, 240],
          borderColor: '#006644',
          backgroundColor: 'rgba(0, 102, 68, 0.1)',
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
            displayColors: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: { color: '#f1f5f9' },
            border: { display: false }
          },
          x: {
            grid: { display: false },
            border: { display: false }
          }
        }
      }
    });
  }
}

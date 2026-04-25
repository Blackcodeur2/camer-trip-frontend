import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AgenceService } from '../../../services/agence/agence-service';
import { UserService } from '../../../services/users/user-service';
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
  private userService = inject(UserService);
  private agenceService = inject(AgenceService);

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
      users: this.userService.getUsers(),
      agencies: this.agenceService.getAgences()
    }).subscribe({
      next: (res: any) => {
        const usersList = Array.isArray(res.users) ? res.users : (res.users?.data || []);
        const agenciesList = Array.isArray(res.agencies) ? res.agencies : (res.agencies?.data || []);

        this.totalUsers.set(usersList.length);
        this.totalAgencies.set(agenciesList.length);

        // Calcul robuste des gares à travers toutes les agences
        let garesCount = 0;
        agenciesList.forEach((a: any) => {
          if (Array.isArray(a.gares)) {
            garesCount += a.gares.length;
          } else if (a.nb_gares) { // Fallback si le backend renvoie juste le compte
            garesCount += Number(a.nb_gares);
          }
        });
        this.totalGares.set(garesCount);

        // Statistiques simulées basées sur les entités réelles
        const baseTrips = agenciesList.length * 15;
        this.totalTrips.set(baseTrips > 0 ? baseTrips + 3 : 0);
        this.totalBuses.set(agenciesList.length * 8);

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
      type: 'bar',
      data: {
        labels: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
        datasets: [{
          label: 'Réservations & Voyages (Simulé)',
          data: [120, 190, 300, 250, 200, 320, 400, 380, 210, 150, 180, 240],
          backgroundColor: '#006644',
          borderRadius: 6,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              color: '#e2e8f0',
            },
            border: {
              dash: [4, 4]
            }
          },
          x: {
            grid: {
              display: false
            }
          }
        }
      }
    });
  }
}

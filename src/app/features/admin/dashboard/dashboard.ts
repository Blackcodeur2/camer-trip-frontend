import { Component, inject, signal } from '@angular/core';
import { forkJoin } from 'rxjs';
import { AgenceService } from '../../../services/agence/agence-service';
import { UserService } from '../../../services/users/user-service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
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
      },
      error: (err) => {
        console.error("Erreur Dashboard Admin:", err);
        this.isLoading.set(false);
      }
    });
  }
}

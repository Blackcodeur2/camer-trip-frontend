import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { Reservation } from '../../../models/reservation';
import { User } from '../../../models/user';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-home',
  imports: [CommonModule, MatIconModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private authService = inject(AuthService);
  private router = inject(Router);

  // Signals
  currentUser = signal<User | null>(null);
  reservations = signal<Reservation[]>([]);
  isLoading = signal<boolean>(false);

  // Dynamic Greeting
  greeting = computed(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  });

  // Derived Statistics
  stats = computed(() => {
    const all = this.reservations();
    const confirmed = all.filter(r => r.statut === 'validee').length;
    const pending = all.filter(r => r.statut === 'en_attente').length;
    const spent = all.filter(r => r.statut === 'validee')
      .reduce((sum, r) => sum + Number(r.prix || 0), 0);

    return {
      active: confirmed + pending,
      confirmed,
      pending,
      spent
    };
  });

  // Curated Upcoming Trips
  upcomingTrips = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.reservations()
      .filter(r => r.statut === 'validee' && r.voyage.date_depart.split('T')[0] >= today)
      .sort((a, b) => new Date(a.voyage.date_depart).getTime() - new Date(b.voyage.date_depart).getTime())
      .slice(0, 3);
  });

  ngOnInit(): void {
    this.currentUser.set(this.authService.currentUser());
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading.set(true);
    this.reservations.set([]);
    this.isLoading.set(false);
  }

  navigate(route: string): void {
    this.router.navigate([route]);
  }

  onLogout(): void {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      this.authService.logout().subscribe({
        next: () => {
          this.router.navigate(['/auth/login']);
        },
        error: () => {
          this.router.navigate(['/auth/login']);
        }
      });
    }
  }
}

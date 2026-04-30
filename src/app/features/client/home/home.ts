import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { Reservation } from '../../../models/reservation';
import { User } from '../../../models/user';
import { AuthService } from '../../../services/auth/auth-service';
import { ClientService } from '../../../services/client/client-service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private authService = inject(AuthService);
  private clientService = inject(ClientService);
  private router = inject(Router);

  // Signals
  currentUser = signal<User | null>(null);
  reservations = signal<Reservation[]>([]);
  isLoading = signal<boolean>(true);

  // Derived Statistics
  stats = computed(() => {
    const all = this.reservations();
    const confirmed = all.filter(r => r.statut === 'validee');
    const spent = confirmed.reduce((sum, r) => sum + Number(r.prix || 0), 0);

    return {
      active: confirmed.length,
      spent
    };
  });

  // Recent Activity
  recentReservations = computed(() => {
    return this.reservations().slice(0, 3);
  });

  ngOnInit(): void {
    this.currentUser.set(this.authService.currentUser());
    this.loadReservations();
  }

  loadReservations(): void {
    this.isLoading.set(true);
    this.clientService.getMyReservations().subscribe({
      next: (data) => {
        this.reservations.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  goToSearch() {
    this.router.navigate(['/client/agences']);
  }
}

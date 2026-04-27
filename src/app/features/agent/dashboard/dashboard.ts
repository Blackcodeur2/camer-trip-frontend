import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [CommonModule, MatIconModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private router = inject(Router);

  isLoading = signal(true);
  stats = signal({ salesToday: 0, activeReservations: 0, revenueToday: 0, pendingValidations: 0 });

  ngOnInit() {
    this.loadStats();
  }

  navigateTo(path: string) {
    void this.router.navigate([path]);
  }

  private loadStats() {
    this.stats.set({
      salesToday: 0,
      activeReservations: 0,
      revenueToday: 0,
      pendingValidations: 0
    });
    this.isLoading.set(false);
  }
}

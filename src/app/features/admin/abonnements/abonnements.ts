import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe, NgClass } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../services/admin/admin-service';

import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';

@Component({
  selector: 'app-abonnements',
  standalone: true,
  imports: [CommonModule, MatIconModule, DatePipe, CurrencyPipe, NgClass, PaginationComponent],
  templateUrl: './abonnements.html',
  styleUrl: './abonnements.css'
})
export class Abonnements implements OnInit {
  private adminService = inject(AdminService);

  abonnements = signal<any[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);
  searchQuery = signal('');
  currentPage = signal(1);
  pageSize = signal(4);

  filteredAbonnements = computed(() => {
    const q = this.searchQuery().toLowerCase();
    const list = q 
      ? this.abonnements().filter(a => `${a.nom} ${a.prenom} ${a.email}`.toLowerCase().includes(q))
      : this.abonnements();
    return list;
  });

  paginatedAbonnements = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredAbonnements().slice(start, end);
  });

  stats = computed(() => {
    const list = this.abonnements();
    const now = new Date();
    const expiringSoon = list.filter(a => {
      if (!a.subscription_expires_at) return false;
      const exp = new Date(a.subscription_expires_at);
      const diff = (exp.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diff >= 0 && diff <= 30;
    });
    const active = list.filter(a => a.abonnement?.statut === 'en cours');
    const totalRevenue = list.reduce((sum, a) => sum + Number(a.abonnement?.montant ?? 0), 0);
    return { total: list.length, active: active.length, expiringSoon: expiringSoon.length, revenue: totalRevenue };
  });

  ngOnInit() { this.loadAbonnements(); }

  loadAbonnements() {
    this.isLoading.set(true);
    this.error.set(null);
    this.adminService.getAbonnements().subscribe({
      next: (data) => { this.abonnements.set(data); this.isLoading.set(false); },
      error: () => { this.error.set('Impossible de charger les abonnements.'); this.isLoading.set(false); }
    });
  }

  getDaysRemaining(expiresAt: string): number {
    if (!expiresAt) return 0;
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }

  getExpiryClass(expiresAt: string): string {
    const days = this.getDaysRemaining(expiresAt);
    if (days < 0) return 'expiry-expired';
    if (days <= 30) return 'expiry-soon';
    return 'expiry-ok';
  }
}

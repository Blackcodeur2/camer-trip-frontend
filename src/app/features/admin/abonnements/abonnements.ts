import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AdminService } from '../../../services/admin/admin-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-abonnements',
  standalone: true,
  imports: [CommonModule, MatIconModule, DatePipe, CurrencyPipe],
  templateUrl: './abonnements.html',
  styleUrl: './abonnements.css'
})
export class Abonnements implements OnInit {
  private adminService = inject(AdminService);

  abonnements = signal<any[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  // Statistics
  stats = computed(() => {
    const list = this.abonnements();
    return {
      total: list.length,
      active: list.filter(a => a.statut === 'en cours').length,
      expired: list.filter(a => a.statut === 'termine').length,
      revenue: list.reduce((sum, a) => sum + Number(a.montant || 0), 0)
    };
  });

  ngOnInit() {
    this.loadAbonnements();
  }

  loadAbonnements() {
    this.isLoading.set(true);
    this.error.set(null);
    this.adminService.getAbonnements().subscribe({
      next: (data) => {
        this.abonnements.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement abonnements:', err);
        this.error.set('Impossible de charger les abonnements.');
        this.isLoading.set(false);
      }
    });
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'en cours': return 'status-active';
      case 'termine': return 'status-expired';
      default: return 'status-unknown';
    }
  }
}

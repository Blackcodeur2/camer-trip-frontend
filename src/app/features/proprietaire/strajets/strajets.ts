import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';

@Component({
  selector: 'app-strajets',
  imports: [CommonModule, MatIconModule],
  templateUrl: './strajets.html',
  styleUrl: './strajets.css',
})
export class Strajets {
  private proprietaireService = inject(ProprietaireService);

  routes = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadRoutes();
  }

  loadRoutes() {
    this.isLoading.set(true);
    this.proprietaireService.getMyTrajets().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : (data as any).data ?? [];
        this.routes.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger les trajets.', 'error');
      }
    });
  }
}

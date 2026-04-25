import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';

@Component({
  selector: 'app-bus',
  imports: [CommonModule, MatIconModule],
  templateUrl: './bus.html',
  styleUrl: './bus.css',
})
export class Bus {
  private proprietaireService = inject(ProprietaireService);

  buses = signal<any[]>([]);
  isLoading = signal(true);

  ngOnInit() {
    this.loadBuses();
  }

  loadBuses() {
    this.isLoading.set(true);
    this.proprietaireService.getMyBuses().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : (data as any).data ?? [];
        this.buses.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger les bus.', 'error');
      }
    });
  }
}

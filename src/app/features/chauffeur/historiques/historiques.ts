import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { ChauffeurService } from '../../../services/chauffeur/chauffeur-service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-historiques',
  standalone: true,
  imports: [CommonModule, MatIconModule, PaginationComponent],
  templateUrl: './historiques.html',
  styleUrl: './historiques.css',
})
export class Historiques implements OnInit {
  private chauffeurService = inject(ChauffeurService);

  history = signal<any[]>([]);
  isLoading = signal(true);
  currentPage = signal(1);
  pageSize = signal(10);

  paginatedHistory = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.history().slice(start, end);
  });

  ngOnInit() {
    this.loadHistory();
  }

  private loadHistory() {
    this.isLoading.set(true);

    forkJoin({
      voyages: this.chauffeurService.getMyVoyages(),
      reservations: this.chauffeurService.getMyReservations()
    }).subscribe({
      next: ({ voyages, reservations }) => {
        const finishedVoyages = voyages
          .filter((v: any) => v.statut === 'termine' || v.statut === 'annule')
          .map((v: any) => ({ ...v, typeEntry: 'VOYAGE' }));

        const personalReservations = reservations.map((r: any) => ({
          ...r,
          typeEntry: 'RESERVATION',
          date_depart: r.voyage?.date_depart,
          heure_depart: r.voyage?.heure_depart,
          trajet: r.voyage?.trajet,
          num_voyage: r.num_reservation,
          bus: r.voyage?.bus,
          created_at: r.created_at
        }));

        const combined = [...finishedVoyages, ...personalReservations].sort((a, b) => 
          new Date(b.created_at || b.date_depart).getTime() - new Date(a.created_at || a.date_depart).getTime()
        );

        this.history.set(combined);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }
}

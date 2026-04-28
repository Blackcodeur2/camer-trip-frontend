import { ChangeDetectionStrategy, Component, HostListener, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ClientService } from '../../services/client/client-service';
import { Agence } from '../../models/agence';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-landing',
  imports: [CommonModule, FormsModule, RouterLink, MatIcon],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  private readonly clientService = inject(ClientService);


  isScrolled = false;
  agences = signal<Agence[]>([]);
  search = signal('');
  loading = signal(false);
  error = signal('');

  filteredAgences = computed(() => {
    const query = this.search().toLowerCase().trim();
    if (!query) {
      return this.agences();
    }

    return this.agences().filter((agence) => {
      const agencyMatch = [agence.nom, agence.email, agence.telephone, agence.adresse]
        .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
        .some((value) => value.toLowerCase().includes(query));

      const stationMatch = agence.stations?.some((station) => {
        const stationName = [station.nom, station.adresse]
          .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
          .join(' ');
        const voyageMatch = station.voyages?.some((voyage) => {
          const trajetLabel = [
            voyage.trajet?.depart,
            voyage.trajet?.arrivee,
          ]
            .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
            .join(' ');
          return [voyage.num_voyage, voyage.statut, trajetLabel]
            .filter((value): value is string => typeof value === 'string' && value.trim().length > 0)
            .some((value) => value.toLowerCase().includes(query));
        });
        return stationName.toLowerCase().includes(query) || !!voyageMatch;
      });

      return agencyMatch || !!stationMatch;
    });
  });

  constructor() {
    this.loadAgences();
  }

  @HostListener('window:scroll', [])
  onWindowsScroll() {
    this.isScrolled = window.scrollY > 50;
  }

  loadAgences(): void {
    this.loading.set(true);
    this.clientService.getAgences().subscribe({
      next: (agences) => {
        this.agences.set(agences);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les agences pour le moment.');
        this.loading.set(false);
      },
    });
  }
}

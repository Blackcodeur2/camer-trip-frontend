import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ClientService } from '../../../services/client/client-service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-agences',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './agences.html',
  styleUrl: './agences.css',
})
export class Agences {
  private clientService = inject(ClientService);
  private router = inject(Router);
  private filterChange$ = new Subject<void>();

  // Filtres
  filterDepart  = '';
  filterArrivee = '';
  filterDate    = '';

  voyages   = signal<any[]>([]);
  isLoading = signal(false);

  ngOnInit() {
    // Debounce : déclenche la recherche 400ms après le dernier changement
    this.filterChange$.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(() => this.search());

    this.search();
  }

  onFilterChange() {
    this.filterChange$.next();
  }

  search() {
    this.isLoading.set(true);
    const payload: any = {};
    if (this.filterDepart.trim())  payload['depart']  = this.filterDepart.trim();
    if (this.filterArrivee.trim()) payload['arrivee'] = this.filterArrivee.trim();
    if (this.filterDate)           payload['date']    = this.filterDate;

    this.clientService.searchTrips(payload).subscribe({
      next: (data) => {
        this.voyages.set(data ?? []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  clearFilters() {
    this.filterDepart  = '';
    this.filterArrivee = '';
    this.filterDate    = '';
    this.search();
  }

  hasActiveFilters(): boolean {
    return !!(this.filterDepart || this.filterArrivee || this.filterDate);
  }

  selectVoyage(id: number) {
    this.router.navigate(['/client/new-reservation', id]);
  }
}

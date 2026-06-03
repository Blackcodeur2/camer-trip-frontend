import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { ChauffeurService } from '../../../services/chauffeur/chauffeur-service';

@Component({
  selector: 'app-chauffeur-booking',
  standalone: true,
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './chauffeur-booking.html',
  styleUrl: './chauffeur-booking.css',
})
export class ChauffeurBooking {
  private chauffeurService = inject(ChauffeurService);
  private router = inject(Router);

  searchQuery = '';
  voyages = signal<any[]>([]);
  isLoading = signal(false);

  ngOnInit() {
    this.loadAllAvailableVoyages();
  }

  loadAllAvailableVoyages() {
    this.isLoading.set(true);
    this.chauffeurService.searchVoyages({}).subscribe({
      next: (data) => {
        this.voyages.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
  }

  getRoutePrefix(): string {
    const url = this.router.url;
    if (url.includes('/proprietaire')) return '/proprietaire';
    if (url.includes('/chef_agence')) return '/chef_agence';
    if (url.includes('/agent')) return '/agent';
    return '/chauffeur';
  }

  selectVoyage(id: number) {
    const prefix = this.getRoutePrefix();
    this.router.navigate([`${prefix}/reservations/self/new`, id]);
  }
}

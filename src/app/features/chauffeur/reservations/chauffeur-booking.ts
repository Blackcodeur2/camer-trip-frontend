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

  selectVoyage(id: number) {
    this.router.navigate(['/chauffeur/reservations/new', id]);
  }
}

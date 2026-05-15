import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Agence } from '../../../models/agence';
import { AdminService } from '../../../services/admin/admin-service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { AppButton } from '../../../shared/button/app-button/app-button';

@Component({
  selector: 'app-agences',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './agences.html',
  styleUrl: './agences.css',
})
export class Agences {
  private adminService = inject(AdminService);


  agences = signal<Agence[]>([]);
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(4);

  paginatedAgences = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.agences().slice(start, end);
  });

  // Accordéon : id de l'agence dépliée
  expandedAgenceId = signal<number | null>(null);

  toggleExpand(agenceId: number) {
    this.expandedAgenceId.update(id => id === agenceId ? null : agenceId);
  }

  ngOnInit() {
    this.loadAgences();
  }

  loadAgences() {
    this.isLoading.set(true);
    this.error.set(null);
    this.adminService.getAgences().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data.data || []);
        this.agences.set(list);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error("Erreur de chargement des agences", err);
        this.error.set("Impossible de charger la liste des agences.");
        this.isLoading.set(false);
      }
    });
  }
}

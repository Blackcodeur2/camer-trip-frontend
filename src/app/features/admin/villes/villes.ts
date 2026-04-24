import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Ville } from '../../../models/ville';
import { AuthService } from '../../../services/auth/auth-service';
import { VilleService } from '../../../services/villes/ville-service';
import { AppButton } from '../../../shared/button/app-button/app-button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';

@Component({
  selector: 'app-villes',
  imports: [AppButton,CommonModule, MatIconModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './villes.html',
  styleUrl: './villes.css',
})
export class Villes {
  private villeService = inject(VilleService);
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  villes = signal<Ville[]>([]);
  showForm = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  isExporting = signal(false);
  editId = signal<number | null>(null);

  currentPage = signal(1);
  pageSize = signal(5);

  paginatedV = computed(() => {
    const list = this.villes();
    if (!Array.isArray(list)) return [];
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return list.slice(start, end);
  });

  totalVilles = computed(() => this.villes().length);

  villeForm = this.fb.group({
    nom: ['', Validators.required],
    region: ['', Validators.required],
  });


  ngOnInit() {
    const user = this.authService.currentUser();
    this.loadVilles();
  }

  loadVilles() {
    this.villeService.getVilles().subscribe({
      next: (data: Ville[]) => {
        this.villes.set(data || []);
      },
      error: () => this.villes.set([])
    });
  }

  toggleForm() {
    if (this.showForm()) {
      this.isEditing.set(false);
      this.editId.set(null);
    }
    this.showForm.update(v => !v);
  }

  editVille(ville: Ville) {
    this.isEditing.set(true);
    this.editId.set(ville.id || null);
    this.villeForm.patchValue({
      nom: ville.nom,
      region: ville.region,
    });
    this.showForm.set(true);
  }


  onSubmit() {
    if (this.villeForm.invalid) return;
    this.isSubmitting.set(true);

    const villeData = this.villeForm.value as any;
    const request = this.isEditing()
      ? this.villeService.updateVille({ ...villeData, id: this.editId() })
      : this.villeService.createVille(villeData);

    request.subscribe({
      next: (res: Ville) => {
        if (this.isEditing()) {
          this.villes.update((list: Ville[]) => list.map((r: Ville) => r.id === this.editId() ? res : r));
          Swal.fire({ icon: 'success', title: 'Succès', text: 'Ville mise à jour', timer: 2000, showConfirmButton: false });
        } else {
          this.villes.update((list: Ville[]) => [res, ...list]);
          Swal.fire({ icon: 'success', title: 'Succès', text: 'Ville créée', timer: 2000, showConfirmButton: false });
        }

        this.showForm.set(false);
        this.isSubmitting.set(false);
        this.isEditing.set(false);
        this.editId.set(null);
        this.villeForm.reset();
      },
      error: (error) => {
        this.isSubmitting.set(false);
        let errorMsg = 'Impossible d\'enregistrer la ville';
        if (error.status === 422 && error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.status === 422 && error.error?.errors) {
          errorMsg = Object.values(error.error.errors).flat().join('\n');
        }
        Swal.fire({ icon: 'error', title: 'Erreur', text: errorMsg });
      }
    });
  }

  deleteVille(id: number | undefined) {
    if (!id) return;

    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: "Voulez-vous vraiment supprimer cette ville ?",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Oui, supprimer !',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.villeService.deleteVille(id).subscribe({
          next: () => {
            this.villes.update(list => list.filter(v => v.id !== id));
            Swal.fire({ icon: 'success', title: 'Supprimé !', text: 'La ville a été supprimée.', timer: 2000, showConfirmButton: false });
          },
          error: (error) => {
            let errorMsg = 'Impossible de supprimer la ville.';
            if (error.error?.message) errorMsg = error.error.message;
            Swal.fire({ icon: 'error', title: 'Erreur', text: errorMsg });
          }
        });
      }
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { Ville } from '../../../models/ville';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';
import { Station } from '../../../models/station';

type FormMode = 'none' | 'form';
@Component({
  selector: 'app-stations',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './stations.html',
  styleUrl: './stations.css',
})
export class Stations {
  private proprietaireService = inject(ProprietaireService);

  private fb = inject(FormBuilder);

  gares = signal<Station[]>([]);
  villes = signal<Ville[]>([]);
  // Ville list for the form select


  isLoading = signal(true);
  isSubmitting = signal(false);
  formMode = signal<FormMode>('none');
  editingGare = signal<Station | null>(null);

  gareForm = this.fb.nonNullable.group({
    agence_id: [0, Validators.required],
    ville: ['', Validators.required],
    quartier: ['', Validators.required],
    telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
  });


  ngOnInit() {
    this.loadGares();
    this.loadVilles();
  }

  loadVilles() {
 
  }


  loadGares() {
    this.isLoading.set(true);
    this.proprietaireService.getMyStations().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : (data as any).data ?? [];
        this.gares.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger les gares.', 'error');
      }
    });
  }

  openForm(gare?: Station) {
    this.formMode.set('form');
    if (gare) {
      this.editingGare.set(gare);
      this.gareForm.patchValue({
        agence_id: gare.agence_id,
        ville: gare.ville,
        quartier: gare.adresse,
        telephone: gare.telephone,
      });

    } else {
      this.editingGare.set(null);
      this.gareForm.reset();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm() {
    this.formMode.set('none');
    this.gareForm.reset();
    this.editingGare.set(null);
  }

  onSubmit() {
    if (!this.gareForm.valid) return;

    this.isSubmitting.set(true);
    const payload = this.gareForm.getRawValue();

    const request = this.editingGare()
      ? this.proprietaireService.updateStation(this.editingGare()!.id, payload)
      : this.proprietaireService.createStation(payload);

    request.subscribe({
      next: () => {
        Swal.fire('Succès', 'Gare sauvegardée avec succès', 'success');
        this.isSubmitting.set(false);
        this.closeForm();
        this.loadGares();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        Swal.fire('Erreur', err.error?.message ?? 'Erreur lors de la sauvegarde', 'error');
      }
    });
  }

  delete(id: number) {
    Swal.fire({
      title: 'Êtes-vous sûr ?',
      text: 'Cette action ne peut pas être annulée',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Oui, supprimer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.proprietaireService.deleteStation(id).subscribe({
          next: () => {
            Swal.fire('Supprimée', 'Gare supprimée avec succès', 'success');
            this.loadGares();
          },
          error: () => {
            Swal.fire('Erreur', 'Impossible de supprimer la gare', 'error');
          }
        });
      }
    });
  }
}

import { Component, computed, inject, signal, HostListener } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from "@angular/material/icon";
import Swal from 'sweetalert2';
import { Agence } from '../../../models/agence';
import { Ville } from '../../../models/ville';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';
import { Station } from '../../../models/station';
import { CommonModule } from '@angular/common';
import { AgenceService } from '../../../services/agence/agence-service';
import { HttpClient } from '@angular/common/http';

type FormMode = 'none' | 'agence' | 'gare';
@Component({
  selector: 'app-agences',
  imports: [MatIconModule, CommonModule, ReactiveFormsModule],
  templateUrl: './agences.html',
  styleUrl: './agences.css',
})
export class Agences {
  private proprietaireService = inject(ProprietaireService);
  private agenceService = inject(AgenceService);
  private fb = inject(FormBuilder);
  agencies = signal<Agence[]>([]);
  villes = signal<Ville[]>([]);

  isLoading = signal(true);
  isSubmitting = signal(false);
  formMode = signal<FormMode>('none');
  selectedAgenceId = signal<number | null>(null);

  // Agence en cours d'édition
  editingAgence = signal<Agence | null>(null);

  // Agence dépliée pour voir les stations
  expandedAgenceId = signal<number | null>(null);

  private http = inject(HttpClient);
  allVillesData = signal<{ nom: string }[]>([]);
  filteredVilles = signal<string[]>([]);
  showAutocomplete = signal(false);

  agenceForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
    adresse: [''],
    ville: ['', [Validators.required]], // Nouveau champ Ville
  });

  gareForm = this.fb.nonNullable.group({
    agence_id: [0, Validators.required],
    ville_id: [0, Validators.required],
    quartier: ['', Validators.required],
    telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
  });


  // Computed : agence sélectionnée pour ajouter une gare
  agenceForGare = computed(() =>
    this.agencies().find(a => a.id === this.selectedAgenceId())
  );

  ngOnInit() {
    this.loadAgencies();
    this.loadVilles();
    this.loadVillesFromJson();
    this.agenceForm.controls.ville.valueChanges.subscribe(val => {
      this.filterVilles(val || '');
    });
  }

  loadVillesFromJson() {

    this.http.get<{ nom: string }[]>('assets/villes.json').subscribe({
      next: (data) => {
        this.allVillesData.set(data);
        const currentVal = this.agenceForm.controls.ville.value;
        if (currentVal) {
          this.filterVilles(currentVal);
        }
      },
      error: (err) => console.error('Erreur chargement villes.json', err)
    });
  }

  private normalizeString(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  onVilleFocus() {
    this.filterVilles(this.agenceForm.controls.ville.value || '');
  }

  filterVilles(val: string) {
    const search = this.normalizeString(val);
    if (search.length < 1) {
      this.filteredVilles.set([]);
      this.showAutocomplete.set(false);
      return;
    }

    const filtered = this.allVillesData()
      .filter(v => this.normalizeString(v.nom).includes(search))
      .map(v => v.nom)
      .slice(0, 10);

    this.filteredVilles.set(filtered);
    this.showAutocomplete.set(filtered.length > 0);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.autocomplete-wrap')) {
      this.showAutocomplete.set(false);
    }
  }

  loadVilles() {
    this.agenceService.getVilles().subscribe({
      next: (data) => this.villes.set(data),
      error: () => this.villes.set([])
    });
  }


  loadAgencies() {
    this.isLoading.set(true);
    this.proprietaireService.getMyAgences().subscribe({
      next: (data) => {
        const list = Array.isArray(data) ? data : (data as any).data ?? [];
        this.agencies.set(list);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger vos agences.', 'error');
      }
    });
  }

  // ── Agence Form ──

  openAgenceForm(agence?: Agence) {
    this.formMode.set('agence');
    if (agence) {
      this.editingAgence.set(agence);
      this.agenceForm.patchValue({
        nom: agence.nom,
        email: agence.email,
        telephone: agence.telephone,
        adresse: agence.adresse ?? '',
        ville: (agence as any).ville ?? '', 
      });
    } else {
      this.editingAgence.set(null);
      this.agenceForm.reset();
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  selectVille(ville: string) {
    this.agenceForm.controls.ville.setValue(ville, { emitEvent: false });
    this.showAutocomplete.set(false);
  }

  closeForm() {
    this.formMode.set('none');
    this.agenceForm.reset();
    this.gareForm.reset();
    this.editingAgence.set(null);
    this.selectedAgenceId.set(null);
  }

  onSubmitAgence() {
    if (this.agenceForm.invalid) {
      this.agenceForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const payload = this.agenceForm.getRawValue();
    const editing = this.editingAgence();

    const req$ = editing
      ? this.proprietaireService.updateAgence(editing.id, payload)
      : this.proprietaireService.createAgence(payload);

    req$.subscribe({
      next: (result) => {
        this.isSubmitting.set(false);
        if (editing) {
          this.agencies.update(list => list.map(a => a.id === editing.id ? result : a));
          Swal.fire({ icon: 'success', title: 'Agence mise à jour', timer: 2000, showConfirmButton: false });
        } else {
          this.agencies.update(list => [result, ...list]);
          Swal.fire({ icon: 'success', title: 'Agence créée !', timer: 2000, showConfirmButton: false });
        }
        this.closeForm();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        Swal.fire('Erreur', err.error?.message || 'Impossible de sauvegarder l\'agence.', 'error');
      }
    });
  }

  deleteAgence(agence: Agence) {
    Swal.fire({
      title: 'Supprimer cette agence ?',
      text: `"${agence.nom}" sera définitivement supprimée.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
    }).then(result => {
      if (result.isConfirmed) {
        this.proprietaireService.deleteAgence(agence.id).subscribe({
          next: () => {
            this.agencies.update(list => list.filter(a => a.id !== agence.id));
            Swal.fire({ icon: 'success', title: 'Agence supprimée', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire('Erreur', 'Impossible de supprimer cette agence.', 'error')
        });
      }
    });
  }

  // ── Gare Form ──

  openGareForm(agence: Agence) {
    this.formMode.set('gare');
    this.selectedAgenceId.set(agence.id);
    this.gareForm.reset();
    this.gareForm.patchValue({ agence_id: agence.id });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  onSubmitGare() {
    if (this.gareForm.invalid) {
      this.gareForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const payload = this.gareForm.getRawValue();

    this.proprietaireService.createStation(payload).subscribe({
      next: (newStation: Station) => {
        this.isSubmitting.set(false);
        this.agencies.update(list => list.map(a => {
          if (a.id === newStation.agence_id) {
            return { ...a, stations: [...(a.stations ?? []), newStation] };
          }
          return a;
        }));
        Swal.fire({ icon: 'success', title: 'Gare ajoutée !', timer: 2000, showConfirmButton: false });
        this.closeForm();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        Swal.fire('Erreur', err.error?.message || 'Impossible d\'ajouter la gare.', 'error');
      }
    });
  }

  toggleExpand(id: number) {
    this.expandedAgenceId.update(cur => cur === id ? null : id);
  }

  private getCtrl(form: 'agence' | 'gare', field: string) {
    const fg: import('@angular/forms').AbstractControl =
      form === 'agence' ? this.agenceForm : this.gareForm;
    return fg.get(field);
  }

  shouldShowError(form: 'agence' | 'gare', field: string): boolean {
    const ctrl = this.getCtrl(form, field);
    return !!ctrl && ctrl.touched && ctrl.invalid;
  }

  errorMessage(form: 'agence' | 'gare', field: string): string {
    const errors = this.getCtrl(form, field)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'Champ obligatoire.';
    if (errors['email']) return 'Email invalide.';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères.`;
    if (errors['pattern']) return 'Format invalide (ex: 6xx xxx xxx).';
    return 'Valeur invalide.';
  }
}

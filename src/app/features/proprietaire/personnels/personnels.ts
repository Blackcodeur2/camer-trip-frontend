import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { Agence } from '../../../models/agence';
import { User } from '../../../models/user';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';
import { Station } from '../../../models/station';

@Component({
  selector: 'app-personnels',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './personnels.html',
  styleUrl: './personnels.css',
}) export class Personnels{
  private proprietaireService = inject(ProprietaireService);
  private fb = inject(FormBuilder);

  managers = signal<User[]>([]);
  agencies = signal<Agence[]>([]);
  gares = signal<Station[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  showForm = signal(false);
  showPassword = signal(false);
  editingGerant = signal<User | null>(null);

  gerantForm = this.fb.nonNullable.group({
    prenom:               ['', Validators.required],
    nom:                  ['', Validators.required],
    email:                ['', [Validators.required, Validators.email]],
    telephone:            ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
    num_cni:              ['', Validators.required],
    date_naissance:       ['', Validators.required],
    station_id:           [0,  Validators.required],
    password:             ['', [Validators.minLength(8)]],
    password_confirmation: [''],
  }, { validators: this.passwordMatchValidator });

  private passwordMatchValidator(ctrl: any) {
    const pw  = ctrl.get('password')?.value;
    const cpw = ctrl.get('password_confirmation')?.value;
    if (pw && cpw && pw !== cpw) {
      ctrl.get('password_confirmation')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.proprietaireService.getMyGerants().subscribe({
      next: (data) => {
        this.managers.set(Array.isArray(data) ? data : (data as any).data ?? []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
    this.proprietaireService.getMyAgences().subscribe({
      next: (data) => {
        this.agencies.set(Array.isArray(data) ? data : (data as any).data ?? []);
      }
    });
    this.proprietaireService.getMyStations().subscribe({
      next: (data) => {
        this.gares.set(Array.isArray(data) ? data : (data as any).data ?? []);
      }
    });
  }

  openForm(manager?: User) {
    this.showForm.set(true);
    if (manager) {
      this.editingGerant.set(manager);
      this.gerantForm.patchValue({
        prenom: manager.prenom,
        nom: manager.nom,
        email: manager.email,
        telephone: manager.telephone,
        num_cni: (manager as any).num_cni,
        date_naissance: (manager as any).date_naissance,
        station_id: manager.station_id || 0
      });
      // Mot de passe optionnel en édition
      this.gerantForm.controls.password.clearValidators();
      this.gerantForm.controls.password.setValidators([Validators.minLength(8)]);
    } else {
      this.editingGerant.set(null);
      this.gerantForm.reset();
      this.gerantForm.controls.password.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.gerantForm.controls.password.updateValueAndValidity();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm() {
    this.showForm.set(false);
    this.gerantForm.reset();
  }

  togglePassword() {
    this.showPassword.update(v => !v);
  }

  onSubmit() {
    if (this.gerantForm.invalid) {
      this.gerantForm.markAllAsTouched();
      return;
    }
    this.isSubmitting.set(true);
    const payload = this.gerantForm.getRawValue();
    const editing = this.editingGerant();

    const request$ = editing
      ? this.proprietaireService.updateGerant(editing.id, payload)
      : this.proprietaireService.createGerant(payload);
    request$.subscribe({
      next: (res: User) => {
        this.isSubmitting.set(false);
        if (editing) { 
          this.managers.update(list => list.map(m => m.id === res.id ? res : m));
          Swal.fire({ icon: 'success', title: 'Gérant mis à jour !', timer: 2000, showConfirmButton: false });
        } else {
          this.managers.update(list => [res, ...list]);
          Swal.fire({ icon: 'success', title: 'Gérant créé !', text: 'Le gérant peut maintenant se connecter.', confirmButtonColor: '#006644' });
        }
        this.closeForm();
      },
      error: (err: any) => {
        this.isSubmitting.set(false);
        Swal.fire({ icon: 'error', title: 'Erreur', text: err.error?.message || 'Une erreur est survenue.', confirmButtonColor: '#006644' });
      }
    });
  }

  removeManager(manager: User) {
    Swal.fire({
      title: 'Retirer ce Chef d\'agence ?',
      text: `${manager.prenom} ${manager.nom} n'aura plus accès à l'agence.`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#64748b',
      confirmButtonText: 'Retirer',
      cancelButtonText: 'Annuler',
    }).then(result => {
      if (result.isConfirmed) {
        this.proprietaireService.removeGerant(manager.id).subscribe({
          next: () => {
            this.managers.update(list => list.filter(m => m.id !== manager.id));
            Swal.fire({ icon: 'success', title: 'Chef d\'agence retiré', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire('Erreur', 'Impossible de retirer ce Chef d\'agence.', 'error')
        });
      }
    });
  }

  gareName(id: number): string {
    const gare = this.gares().find(g => g.id === id);
    if (!gare) {
      return `Gare #${id}`;
    }
    return gare.nom || `${gare.ville} - ${gare.quartier}`;
  }

  shouldShowError(field: string): boolean {
    const ctrl = this.gerantForm.get(field);
    return !!ctrl && ctrl.touched && ctrl.invalid;
  }

  errorMessage(field: string): string {
    const errors = this.gerantForm.get(field)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'Champ obligatoire.';
    if (errors['email']) return 'Email invalide.';
    if (errors['minlength']) return `Minimum ${errors['minlength'].requiredLength} caractères.`;
    if (errors['pattern']) return 'Format invalide (ex: 6xx xxx xxx).';
    if (errors['mismatch']) return 'Les mots de passe ne correspondent pas.';
    return 'Valeur invalide.';
  }

  getInitials(manager: User): string {
    return ((manager.prenom?.[0] ?? '') + (manager.nom?.[0] ?? '')).toUpperCase() || '?';
  }
}

import { Component, inject, OnInit, signal } from '@angular/core';
import { Station } from '../../../models/station';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { Agence } from '../../../models/agence';
import { User } from '../../../models/user';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-gerants',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './gerants.html',
  styleUrl: './gerants.css',
})
export class Gerants implements OnInit {
  private proprietaireService = inject(ProprietaireService);
  private fb = inject(FormBuilder);

  managers = signal<User[]>([]);
  agencies = signal<Agence[]>([]);
  gares = signal<Station[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  showForm = signal(false);
  showPassword = signal(false);
  selectedManager = signal<User | null>(null);

  gerantForm = this.fb.nonNullable.group({
    prenom:               ['', Validators.required],
    nom:                  ['', Validators.required],
    email:                ['', [Validators.required, Validators.email]],
    telephone:            ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
    num_cni:              ['', Validators.required],
    date_naissance:       ['', Validators.required],
    station_id:              [0,  Validators.required],
    password:             [''],
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
        this.managers.set(data);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
    this.proprietaireService.getMyAgences().subscribe({
      next: (data) => {
        this.agencies.set(data);
      }
    });
    this.proprietaireService.getMyStations().subscribe({
      next: (data) => {
        this.gares.set(data);
      }
    });
  }

  openForm(manager?: User) {
    this.selectedManager.set(manager ?? null);
    this.showForm.set(true);
    
    if (manager) {
      this.gerantForm.patchValue({
        prenom: manager.prenom ?? '',
        nom: manager.nom ?? '',
        email: manager.email ?? '',
        telephone: manager.telephone ?? '',
        num_cni: manager.num_cni ?? '',
        date_naissance: manager.date_naissance ?? '',
        station_id: manager.station_id ?? 0,
        password: '',
        password_confirmation: ''
      });
      // En édition, le mot de passe n'est pas obligatoire
      this.gerantForm.get('password')?.setValidators([Validators.minLength(8)]);
    } else {
      this.gerantForm.reset();
      this.gerantForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    
    this.gerantForm.get('password')?.updateValueAndValidity();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  closeForm() {
    this.showForm.set(false);
    this.selectedManager.set(null);
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
    
    // Si pas de password saisi en édition, on le retire du payload
    if (this.selectedManager() && !payload.password) {
      delete (payload as any).password;
      delete (payload as any).password_confirmation;
    }

    const request = this.selectedManager()
      ? this.proprietaireService.updateGerant(this.selectedManager()!.id, payload)
      : this.proprietaireService.createGerant(payload);

    request.subscribe({
      next: (updatedManager) => {
        this.isSubmitting.set(false);
        Swal.fire({ 
          icon: 'success', 
          title: this.selectedManager() ? 'Gérant mis à jour !' : 'Gérant créé !', 
          text: this.selectedManager() ? 'Les modifications ont été enregistrées.' : 'Le gérant a maintenant accès à son espace.', 
          confirmButtonColor: '#006644' 
        });
        this.closeForm();
        this.loadData();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const errors = err.error?.errors;
        const message = errors
          ? Object.values(errors).flat().join('\n')
          : (err.error?.message || 'Une erreur est survenue.');
        Swal.fire({ icon: 'error', title: 'Erreur', text: message, confirmButtonColor: '#ef4444' });
      }
    });
  }

  removeManager(manager: User) {
    Swal.fire({
      title: 'Retirer ce gérant ?',
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
            Swal.fire({ icon: 'success', title: 'Gérant retiré', timer: 1500, showConfirmButton: false });
          },
          error: () => Swal.fire('Erreur', 'Impossible de retirer ce gérant.', 'error')
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

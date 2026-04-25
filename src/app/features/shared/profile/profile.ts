import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);

  protected readonly currentUser = this.authService.currentUser;

  protected readonly userInitials = computed(() => {
    const u = this.currentUser();
    if (!u) return '?';
    return `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();
  });

  protected readonly userRoleLabel = computed(() => {
    const roleMap: Record<string, string> = {
      ADMIN: 'Administrateur',
      PROPRIETAIRE: 'Propriétaire d\'Agence',
      CHEF_AGENCE: 'Chef d\'Agence',
      AGENT: 'Agent Guichet',
      CHAUFFEUR: 'Chauffeur',
      CLIENT: 'Passager',
    };
    const role = this.currentUser()?.role_user ?? '';
    return roleMap[role] || role;
  });

  activeTab = signal<'info' | 'password'>('info');
  isLoading = signal(false);
  showCurrentPassword = signal(false);
  showNewPassword = signal(false);
  showConfirmPassword = signal(false);

  private passwordStrengthValidator(control: AbstractControl): ValidationErrors | null {
    const v = control.value as string;
    if (!v) return null;
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(v)) {
      return { passwordStrength: true };
    }
    return null;
  }

  passwordForm = this.fb.nonNullable.group({
    current_password: ['', [Validators.required]],
    new_password: ['', [Validators.required, Validators.minLength(8), this.passwordStrengthValidator]],
    new_password_confirmation: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPwd = control.get('new_password')?.value;
    const confirmPwd = control.get('new_password_confirmation')?.value;
    if (newPwd && confirmPwd && newPwd !== confirmPwd) {
      control.get('new_password_confirmation')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  shouldShowError(controlName: string): boolean {
    const ctrl = this.passwordForm.get(controlName);
    return !!(ctrl && ctrl.invalid && ctrl.touched);
  }

  errorMessage(controlName: string): string {
    const ctrl = this.passwordForm.get(controlName);
    if (!ctrl?.errors) return '';
    if (ctrl.errors['required']) return 'Ce champ est obligatoire.';
    if (ctrl.errors['minlength']) return `Minimum ${ctrl.errors['minlength'].requiredLength} caractères.`;
    if (ctrl.errors['passwordStrength']) return 'Doit contenir majuscule, minuscule et un chiffre.';
    if (ctrl.errors['mismatch']) return 'Les mots de passe ne correspondent pas.';
    return 'Valeur invalide.';
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    const { current_password, new_password, new_password_confirmation } = this.passwordForm.getRawValue();

    this.authService.changePassword({ current_password, password: new_password, password_confirmation: new_password_confirmation })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.passwordForm.reset();
          Swal.fire({
            icon: 'success',
            title: 'Mot de passe modifié',
            text: 'Votre mot de passe a été mis à jour avec succès.',
            timer: 2000,
            showConfirmButton: false,
          });
        },
        error: (err) => {
          this.isLoading.set(false);
          const msg = err?.error?.message || 'Mot de passe actuel incorrect.';
          Swal.fire({ icon: 'error', title: 'Erreur', text: msg });
        },
      });
  }
}

import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth/auth-service';
import Swal from 'sweetalert2';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-profile',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);

  protected readonly currentUser = this.authService.currentUser;
  isRefreshing = signal(false);

  ngOnInit(): void {
    this.resetProfileForm();
    this.isRefreshing.set(false);
  }

  resetProfileForm(): void {
    const u = this.currentUser();
    if (u) {
      this.profileForm.patchValue({
        nom: u.nom,
        prenom: u.prenom,
        email: u.email,
        telephone: u.telephone,
        num_cni: u.num_cni,
        date_naissance: u.date_naissance,
        sexe: u.sexe
      });
    }
  }

  toggleEdit(): void {
    if (this.isEditing()) {
      this.resetProfileForm();
    }
    this.isEditing.set(!this.isEditing());
  }

  protected readonly userInitials = computed(() => {
    const u = this.currentUser();
    if (!u) return '?';
    return `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();
  });

  protected readonly userAvatarUrl = computed(() => {
    const preview = this.avatarPreview();
    if (preview) return preview;

    const avatar = this.currentUser()?.profil_url;
    if (avatar) {
      return avatar.startsWith('http') ? avatar : `${environment.storageUrl}/${avatar}`;
    }
    return null;
  });

  protected readonly userRoleLabel = computed(() => {
    const roleMap: Record<string, string> = {
      ADMIN: 'Administrateur',
      PROPRIETAIRE: "Propriétaire d'Agence",
      CHEF_AGENCE: "Chef d'Agence",
      AGENT: 'Agent Guichet',
      CHAUFFEUR: 'Chauffeur',
      CLIENT: 'Passager',
    };
    return roleMap[this.currentUser()?.role_user ?? ''] || this.currentUser()?.role_user || '—';
  });

  // Avatar
  avatarPreview = signal<string | null>(null);
  isLoading = signal(false);
  showPwdSection = signal(false);

  // Password visibility toggles
  showCurrentPwd = signal(false);
  showNewPwd = signal(false);
  showConfirmPwd = signal(false);

  isEditing = signal(false);

  profileForm = this.fb.group({
    nom: ['', [Validators.required]],
    prenom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', [Validators.required]],
    num_cni: [''],
    date_naissance: [''],
    sexe: ['M']
  });
  passwordForm = this.fb.nonNullable.group(
    {
      current_password: ['', [Validators.required]],
      new_password: ['', [Validators.required, Validators.minLength(8), this.pwdStrengthValidator]],
      new_password_confirmation: ['', [Validators.required]],
    },
    { validators: this.pwdMatchValidator }
  );

  private pwdStrengthValidator(c: AbstractControl): ValidationErrors | null {
    return /(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/.test(c.value) ? null : { strength: true };
  }

  private pwdMatchValidator(g: AbstractControl): ValidationErrors | null {
    const n = g.get('new_password')?.value;
    const c = g.get('new_password_confirmation');
    if (n && c?.value && n !== c.value) {
      c.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  shouldShowError(field: string): boolean {
    const c = this.passwordForm.get(field);
    return !!(c?.invalid && c.touched);
  }

  errorMessage(field: string): string {
    const e = this.passwordForm.get(field)?.errors;
    if (!e) return '';
    if (e['required']) return 'Champ obligatoire.';
    if (e['minlength']) return `Minimum ${e['minlength'].requiredLength} caractères.`;
    if (e['strength']) return 'Doit contenir majuscule, minuscule et chiffre.';
    if (e['mismatch']) return 'Les mots de passe ne correspondent pas.';
    return 'Valeur invalide.';
  }

  onAvatarChange(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      Swal.fire('Format invalide', 'Veuillez sélectionner une image (JPG, PNG, WEBP).', 'warning');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      Swal.fire('Fichier trop lourd', 'La photo ne doit pas dépasser 2 Mo.', 'warning');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => this.avatarPreview.set(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to API
    this.isLoading.set(true);
    const formData = new FormData();
    formData.append('avatar', file);

    this.authService.updateProfile(formData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Photo de profil mise à jour !',
          timer: 1500,
          showConfirmButton: false
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erreur upload avatar:', err);
        Swal.fire('Erreur', 'Impossible de mettre à jour la photo de profil.', 'error');
      }
    });
  }

  onUpdateProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    
    // Create FormData for the update
    const formData = new FormData();
    const val = this.profileForm.value;
    Object.keys(val).forEach(key => {
      const fieldKey = key as keyof typeof val;
      if (val[fieldKey]) {
        formData.append(key, val[fieldKey] as string);
      }
    });

    this.authService.updateProfile(formData).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        this.isEditing.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Profil mis à jour !',
          text: 'Vos informations ont été enregistrées avec succès.',
          timer: 2000,
          showConfirmButton: false
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        console.error('Erreur update profile:', err);
        Swal.fire('Erreur', err.error?.message || 'Impossible de mettre à jour le profil.', 'error');
      }
    });
  }

  onChangePassword(): void {
    if (this.passwordForm.invalid) {
      this.passwordForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    const { current_password, new_password, new_password_confirmation } = this.passwordForm.getRawValue();
    this.authService
      .changePassword({ current_password, password: new_password, password_confirmation: new_password_confirmation })
      .subscribe({
        next: () => {
          this.isLoading.set(false);
          this.passwordForm.reset();
          this.showPwdSection.set(false);
          Swal.fire({ icon: 'success', title: 'Mot de passe modifié !', timer: 2000, showConfirmButton: false });
        },
        error: (err) => {
          this.isLoading.set(false);
          Swal.fire({ icon: 'error', title: 'Erreur', text: err?.error?.message || 'Mot de passe actuel incorrect.' });
        },
      });
  }
}

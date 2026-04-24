import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {

   protected readonly currentStep = signal(1);
  protected readonly submitted = signal(false);
  protected readonly isLoading = signal(false);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly registerForm = this.fb.nonNullable.group({
    role_user: ['CLIENT', [Validators.required]],
    // Etapes 1: Informations personnelles
    prenom: ['', [Validators.required, Validators.minLength(2)]],
    nom: ['', [Validators.required, Validators.minLength(2)]],
    num_cni: ['', [Validators.required]],
    sexe: ['M', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    date_naissance: ['', [Validators.required]],
    telephone: ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
    
    // Etape 2: Document administratifs
    rccm: [null as File | null],
    dfe: [null as File | null],
    statuts: [null as File | null],
    rib: [null as File | null],
    gerant_id_front: [null as File | null],
    gerant_id_back: [null as File | null],
    gerant_selfie: [null as File | null],
  }, { validators: this.passwordMatchValidator });

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('password_confirmation');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  onNext(): void {
    if (this.currentStep() === 1) {
      // Validate Step 1 fields
      const step1Fields = ['prenom', 'nom', 'email', 'telephone', 'num_cni', 'date_naissance', 'password', 'password_confirmation'];
      let isValid = true;
      step1Fields.forEach(field => {
        const control = this.registerForm.get(field);
        if (control?.invalid) {
          control.markAsTouched();
          isValid = false;
        }
      });
      if (!isValid) return;

      if (this.registerForm.get('role_user')?.value === 'PROPRIETAIRE') {
        this.currentStep.set(2);
      } else {
        this.currentStep.set(3); // Go to Summary for CLIENT
      }
    } else if (this.currentStep() === 2) {
      // Validate Step 2 fields (Files)
      const step2Fields = ['rccm', 'dfe', 'statuts', 'rib', 'gerant_id_front', 'gerant_id_back', 'gerant_selfie'];
      let isValid = true;
      step2Fields.forEach(field => {
        const control = this.registerForm.get(field);
        if (!control?.value) {
          isValid = false;
          Swal.fire('Attention', `Veuillez sélectionner le fichier : ${field.toUpperCase()}`, 'warning');
        }
      });
      if (!isValid) return;
      this.currentStep.set(3);
    }
  }

  onPrevious(): void {
    if (this.currentStep() > 1) {
      if (this.currentStep() === 3 && this.registerForm.get('role_user')?.value !== 'PROPRIETAIRE') {
        this.currentStep.set(1);
      } else {
        this.currentStep.set(this.currentStep() - 1);
      }
    }
  }

  onFileChange(event: any, field: string): void {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      this.registerForm.patchValue({ [field]: file });
    }
  }

  onSubmit(): void {
    this.submitted.set(true);

    if (this.registerForm.invalid) return;

    this.isLoading.set(true);
    
    const formData = new FormData();
    const values = this.registerForm.getRawValue();
    
    Object.keys(values).forEach(key => {
      const value = (values as any)[key];
      if (value !== null && value !== undefined) {
        formData.append(key, value);
      }
    });

    this.authService.register(formData).subscribe({
      next: (response) => {
        Swal.fire({
          icon: 'success',
          title: 'Inscription réussie',
          text: 'Votre compte a été créé avec succès. Vous allez être redirigé.',
          timer: 2000,
          showConfirmButton: false,
        }).then(() => {
          const role = response.data.user.role_user;
          if (role === 'PROPRIETAIRE') {
            this.router.navigate(['/proprietaire/dashboard']);
          } else {
            this.router.navigate(['/client/home']);
          }
        });
      },
      error: (error) => {
        console.error('Registration error', error);
        this.isLoading.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: error.error?.message || 'Une erreur est survenue lors de l\'inscription.',
          confirmButtonColor: '#3b82f6',
        });
      }
    });
  }

  protected shouldShowError(controlName: string): boolean {
    const control = this.registerForm.get(controlName);
    return !!control && (this.submitted() || control.touched) && control.invalid;
  }

  protected errorMessage(controlName: string): string {
    const control = this.registerForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Champ obligatoire.';
    if (control.errors['email']) return 'Email invalide.';
    if (control.errors['minlength']) return `Minimum ${control.errors['minlength'].requiredLength} caractères.`;
    if (control.errors['pattern']) return 'Format invalide.';
    if (control.errors['passwordMismatch']) return 'Les mots de passe ne correspondent pas.';
    return 'Valeur invalide.';
  }
}

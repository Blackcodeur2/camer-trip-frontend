import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import Swal from 'sweetalert2';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, RouterLink, MatIconModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Register {

  protected readonly currentStep = signal(1);
  protected readonly submitted = signal(false);
  protected readonly isLoading = signal(false);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  private fileValidator(allowedTypes: string[], maxSizeMB: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      const file = control.value as File;
      if (!file) return null;
      
      const isValidType = allowedTypes.some(type => {
        if (type === 'image/*') return file.type.startsWith('image/');
        return file.type === type;
      });

      if (!isValidType) {
        return { fileType: true };
      }
      
      const sizeMB = file.size / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        return { fileSize: { maxSize: maxSizeMB, actualSize: sizeMB } };
      }
      
      return null;
    };
  }

  private ageValidator(minAge: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const today = new Date();
      const birthDate = new Date(control.value);
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age < minAge ? { minAge: { requiredAge: minAge, actualAge: age } } : null;
    };
  }

  protected readonly registerForm = this.fb.nonNullable.group({
    role_user: ['CLIENT', [Validators.required]],
    
    // Etape 2: Informations personnelles
    prenom: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ÿ\s-]+$/)]],
    nom: ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[a-zA-ZÀ-ÿ\s-]+$/)]],
    sexe: ['M', [Validators.required]],
    email: ['', [Validators.required, Validators.pattern(/^([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/)]],
    date_naissance: ['', [Validators.required, this.ageValidator(18)]],
    telephone: ['', [Validators.required, Validators.pattern(/^6[0-9]{8}$/)]],
    
    // Etape 3: Sécurité
    password: ['', [
      Validators.required, 
      Validators.minLength(8),
      Validators.pattern(/(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])/)
    ]],
    password_confirmation: ['', [Validators.required]],
    
    // Etape 4: Document administratifs
    rccm: [null as File | null, [this.fileValidator(['application/pdf', 'image/*'], 5)]],
    dfe: [null as File | null, [this.fileValidator(['application/pdf', 'image/*'], 5)]],
    statuts: [null as File | null, [this.fileValidator(['application/pdf', 'image/*'], 5)]],
    rib: [null as File | null, [this.fileValidator(['application/pdf', 'image/*'], 5)]],
    gerant_id_front: [null as File | null, [this.fileValidator(['image/*'], 5)]],
    gerant_id_back: [null as File | null, [this.fileValidator(['image/*'], 5)]],
    gerant_selfie: [null as File | null, [this.fileValidator(['image/*'], 5)]],
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
      const control = this.registerForm.get('role_user');
      if (control?.invalid) {
        control.markAsTouched();
        return;
      }
      this.currentStep.set(2);
    } else if (this.currentStep() === 2) {
      const step2Fields = ['prenom', 'nom', 'email', 'telephone', 'date_naissance', 'sexe'];
      let isValid = true;
      step2Fields.forEach(field => {
        const control = this.registerForm.get(field);
        if (control?.invalid) {
          control.markAsTouched();
          isValid = false;
        }
      });
      if (!isValid) return;
      this.currentStep.set(3);
    } else if (this.currentStep() === 3) {
      const step3Fields = ['password', 'password_confirmation'];
      let isValid = true;
      step3Fields.forEach(field => {
        const control = this.registerForm.get(field);
        if (control?.invalid) {
          control.markAsTouched();
          isValid = false;
        }
      });
      if (this.registerForm.errors?.['passwordMismatch']) {
        this.registerForm.get('password_confirmation')?.markAsTouched();
        isValid = false;
      }
      if (!isValid) return;
      this.currentStep.set(4);
    }
  }

  onPrevious(): void {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
    }
  }

  onFileChange(event: any, field: string): void {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      this.registerForm.patchValue({ [field]: file });
      this.registerForm.get(field)?.markAsTouched();
    }
  }

  onSubmit(): void {
    this.submitted.set(true);

    // If step 4 (Proprietaire), validate files
    if (this.registerForm.get('role_user')?.value === 'PROPRIETAIRE') {
      const step4Fields = ['rccm', 'dfe', 'statuts', 'rib', 'gerant_id_front', 'gerant_id_back', 'gerant_selfie'];
      let isValid = true;
      step4Fields.forEach(field => {
        const control = this.registerForm.get(field);
        if (!control?.value) {
          control?.setErrors({ ...control.errors, required: true });
          control?.markAsTouched();
          isValid = false;
        }
      });
      if (!isValid) {
        Swal.fire('Attention', 'Veuillez fournir tous les documents obligatoires avant de soumettre.', 'warning');
        return;
      }
    }

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
    if (control.errors['minAge']) return 'Vous devez avoir au moins 18 ans.';
    
    if (control.errors['fileType']) return 'Format invalide (PDF ou Image attendu).';
    if (control.errors['fileSize']) return `Fichier trop volumineux (max ${control.errors['fileSize'].maxSize}MB).`;

    if (control.errors['pattern']) {
      if (controlName === 'telephone') return 'Numéro invalide (ex: 6XXXXXXXX).';
      if (controlName === 'password') return 'Doit contenir majuscule, minuscule et chiffre.';
      if (controlName === 'prenom' || controlName === 'nom') return 'Lettres uniquement.';
      if (controlName === 'email') return 'Format d\'email invalide.';
      return 'Format invalide.';
    }
    if (control.errors['passwordMismatch']) return 'Les mots de passe ne correspondent pas.';
    return 'Valeur invalide.';
  }
}

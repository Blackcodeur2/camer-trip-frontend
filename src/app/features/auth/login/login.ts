import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth/auth-service';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { AppButton } from '../../../shared/button/app-button/app-button';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, AppButton, RouterLink, MatIconModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Login {
  protected readonly submitted = signal(false);
  protected readonly isLoading = signal(false);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);

  protected readonly loginForm = this.fb.nonNullable.group({
    login: ['', [
      Validators.required, 
      Validators.minLength(3),
      Validators.pattern(/^([a-zA-Z0-9_-]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/)
    ]],
    password: ['', [
      Validators.required, 
      Validators.minLength(8)
    ]],
  });

  onSubmit(): void {
    this.submitted.set(true);

    if (this.loginForm.invalid) return;

    const { login, password } = this.loginForm.getRawValue();
    this.isLoading.set(true);

    this.authService.login({ login, password }).subscribe({
      next: (response: any) => {
        try {
          const role = response.data?.user?.role_user;
          console.log('Login response:', response);
          console.log('User role:', role);

          switch (role) {
            case 'ADMIN':
              console.log('Redirecting to admin dashboard');
              this.router.navigate(['/admin/dashboard']);
              break;
            case 'CHEF_AGENCE':
              this.router.navigate(['/chef_agence/dashboard']);
              break;
            case 'CHAUFFEUR':
              this.router.navigate(['/chauffeur/dashboard']);
              break;
            case 'AGENT':
              this.router.navigate(['/agent/dashboard']);
              break;
            case 'PROPRIETAIRE':
              this.router.navigate(['/proprietaire/dashboard']);
              break;
            default:
              console.log('Redirecting to landing (default case)');
              this.router.navigate(['/landing']);
              break;
          }
        } catch (error) {
          console.error('Session save error', error);
          this.isLoading.set(false);
          Swal.fire({
            icon: 'error',
            title: 'Erreur',
            text: 'Une erreur inattendue est survenue.',
            confirmButtonColor: '#3b82f6',
          });
        }
      },
      error: (error) => {
        console.error('Login error', error);
        this.isLoading.set(false);
        const errorMessage = error.error?.message || 'Identifiants incorrects ou serveur indisponible. Veuillez réessayer.';
        Swal.fire({
          icon: 'error',
          title: 'Échec de la connexion',
          text: errorMessage,
          confirmButtonColor: '#3b82f6',
        });
      }
    });
  }

  protected shouldShowError(controlName: 'login' | 'password'): boolean {
    const control = this.loginForm.get(controlName);
    return !!control && (this.submitted() || control.touched) && control.invalid;
  }

  protected errorMessage(controlName: 'login' | 'password'): string {
    const control = this.loginForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Ce champ est obligatoire.';
    
    if (control.errors['minlength']) {
      const requiredLength = control.errors['minlength'].requiredLength;
      return `Doit contenir au moins ${requiredLength} caractères.`;
    }
    
    if (control.errors['pattern']) {
      return "Email ou nom d'utilisateur invalide!";
    }

    if (control.errors['email']) return 'Email invalide.';
    return 'Email invalide.';
  }
}

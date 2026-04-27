import { Component, inject, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth/auth-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule, MatIconModule],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
})
export class ResetPassword implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  isLoading = signal(false);
  token = '';
  email = '';

  resetForm = this.fb.group({
    password: ['', [Validators.required, Validators.minLength(8)]],
    password_confirmation: ['', [Validators.required]],
  }, { validators: this.passwordMatchValidator });

  ngOnInit() {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.email = this.route.snapshot.queryParamMap.get('email') || '';

    if (!this.token || !this.email) {
      Swal.fire({
        icon: 'error',
        title: 'Lien invalide',
        text: 'Le lien de réinitialisation est incomplet ou expiré.',
        confirmButtonColor: '#006644'
      }).then(() => this.router.navigate(['/login']));
    }
  }

  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('password_confirmation');
    return password && confirm && password.value !== confirm.value ? { passwordMismatch: true } : null;
  }

  onSubmit() {
    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const payload = {
      token: this.token,
      email: this.email,
      password: this.resetForm.value.password,
      password_confirmation: this.resetForm.value.password_confirmation
    };

    this.authService.resetPassword(payload).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        Swal.fire({
          icon: 'success',
          title: 'Succès',
          text: 'Votre mot de passe a été réinitialisé avec succès.',
          confirmButtonColor: '#006644'
        }).then(() => this.router.navigate(['/login']));
      },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.error?.message || 'Impossible de réinitialiser le mot de passe.',
          confirmButtonColor: '#006644'
        });
      }
    });
  }
}

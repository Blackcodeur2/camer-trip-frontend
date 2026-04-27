import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../services/auth/auth-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, CommonModule, MatIconModule],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
})
export class ForgotPassword {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  isLoading = signal(false);
  isEmailSent = signal(false);

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  onSubmit() {
    if (this.forgotForm.invalid) {
      this.forgotForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    const email = this.forgotForm.value.email!;

    this.authService.forgotPassword({ email }).subscribe({
      next: (res: any) => {
        this.isLoading.set(false);
        this.isEmailSent.set(true);
        Swal.fire({
          icon: 'success',
          title: 'Email envoyé',
          text: res.message || 'Vérifiez votre boîte mail pour réinitialiser votre mot de passe.',
          confirmButtonColor: '#006644'
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        Swal.fire({
          icon: 'error',
          title: 'Erreur',
          text: err.error?.message || 'Une erreur est survenue. Veuillez réessayer.',
          confirmButtonColor: '#006644'
        });
      }
    });
  }
}

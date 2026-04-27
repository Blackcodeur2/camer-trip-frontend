import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-verify-email',
  imports: [MatIconModule, RouterLink, CommonModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail implements OnInit {
  loading = true;
  success = false;
  error = false;
  message = '';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.queryParamMap.get('id');
    const hash = this.route.snapshot.queryParamMap.get('hash');

    if (id && hash) {
      this.http.get(`${environment.apiUrl}/email/verify/${id}/${hash}`)
        .subscribe({
          next: (response: any) => {
            this.loading = false;
            this.success = true;
            this.message = response.message;
            // Rediriger vers la page de connexion après quelques secondes
            setTimeout(() => this.router.navigate(['/login']), 3000);
          },
          error: (error) => {
            this.loading = false;
            this.error = true;
            this.message = error.error.message;
          }
        });
    } else {
      this.loading = false;
      this.error = true;
      this.message = 'Lien de vérification invalide';
    }
  }

  resendVerification() {
    this.http.post(`${environment.apiUrl}/email/resend`, {})
      .subscribe({
        next: (response: any) => {
          this.success = true;
          this.message = response.message || 'Email de vérification renvoyé';
        },
        error: (error) => {
          this.error = true;
          this.message = error.error?.message || 'Une erreur est survenue lors de l\'envoi.';
        }
      });
  }
}

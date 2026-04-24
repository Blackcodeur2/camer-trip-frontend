import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-admin-layout',
  imports: [MatIconModule, RouterModule, TitleCasePipe],
  templateUrl: './admin-layout.html',
  styleUrls: ['./admin-layout.css'],
})
export class AdminLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;

  protected readonly currentUserRole = computed(() => {
    const role = this.currentUser()?.role_user;
    return role ? role.toUpperCase() : 'ADMIN';
  });

  protected readonly userInitials = computed(() => {
    const user = this.currentUser();
    if (!user) {
      return 'AD';
    }

    const first = user.prenom?.trim().charAt(0) ?? '';
    const last = user.nom?.trim().charAt(0) ?? '';
    return `${first || 'A'}${last || 'D'}`.toUpperCase();
  });

  menuItems = [
    { label: 'Tableau de bord', icon: 'dashboard', route: '/admin/dashboard' },
    { label: 'Villes', icon: 'location_city', route: '/admin/villes' },
    { label: 'Agences', icon: 'business', route: '/admin/agencies' },
    { label: 'Utilisateurs', icon: 'people', route: '/admin/users' },
    { label: 'Vérifications KYC', icon: 'verified_user', route: '/admin/kyc' },
    { label: 'Mon profil', icon: 'person', route: '/admin/profile' },
  ];

  logout() {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/auth/login']),
      error: () => this.router.navigate(['/auth/login'])
    });
  }
}

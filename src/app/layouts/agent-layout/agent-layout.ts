import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { NotificationMenuComponent } from '../../features/shared/notification-menu/notification-menu';

@Component({
  selector: 'app-agent-layout',
  standalone: true,
  imports: [CommonModule, MatIconModule, RouterModule, RouterLink, NotificationMenuComponent],
  templateUrl: './agent-layout.html',
  styleUrl: './agent-layout.css',
})
export class AgentLayout {
  private authService = inject(AuthService);
  private router = inject(Router);

  protected readonly currentUser = this.authService.currentUser;
  isUserMenuOpen = false;

  protected readonly menuItems = computed(() => {
    const role = this.currentUserRole();
    const items = [
      { label: 'Dashboard', route: '/agent/dashboard', icon: 'dashboard' }
    ];
    
    if (role === 'AGENT_RESERVATION') {
      items.push({ label: 'Nouvelle reservation', route: '/agent/booking/new', icon: 'add' });
      items.push({ label: 'Reservations', route: '/agent/reservations', icon: 'list' });
    }
    
    if (role === 'AGENT_ENVOIE_COURIER' || role === 'AGENT_RECUPERATION_COURIER') {
      items.push({ label: 'Gestion Colis', route: '/agent/colis', icon: 'inventory_2' });
    }
    
    return items;
  });

  protected readonly userInitials = computed(() => {
    const u = this.currentUser();
    if (!u) return '?';
    return `${u.prenom?.[0] || ''}${u.nom?.[0] || ''}`.toUpperCase();
  });

  protected readonly currentUserRole = computed(() => {
    return this.currentUser()?.role_user || '';
  });

  toggleUserMenu() {
    this.isUserMenuOpen = !this.isUserMenuOpen;
  }

  logout() {
    this.authService.logout().subscribe(() => {
      this.router.navigate(['/login']);
    });
  }
}

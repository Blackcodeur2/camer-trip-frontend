import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth-service';
import { MatIconModule } from '@angular/material/icon';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-agent-layout',
  imports: [MatIconModule, RouterModule],
  templateUrl: './agent-layout.html',
  styleUrl: './agent-layout.css',
})
export class AgentLayout {
  private authService = inject(AuthService);
    private router = inject(Router);

    unreadCount = signal(0);
    userInitials = signal('AG');

    menuItems = [
        { label: 'Nouvelle Vente', icon: 'point_of_sale', route: '/agent/booking' },
        { label: 'Historique', icon: 'history', route: '/agent/reservations' },
        { label: 'Tableau de bord', icon: 'dashboard', route: '/agent/dashboard' },
        { label: 'Gestion Colis', icon: 'local_mall', route: '/agent/colis' },
        { label: 'Validation', icon: 'qr_code_scanner', route: '/agent/validate' },
        { label: 'Mon Profil', icon: 'person', route: '/agent/profile' },
    ];

    ngOnInit() {
        const user = this.authService.currentUser();
        if (user) {
            this.userInitials.set(this.getInitials(user.prenom + ' ' + user.nom));
        }
    }

    getInitials(name: string): string {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }

    loadUnreadCount(userId: string) {
        /*this.notificationService.getUserNotifications(userId).subscribe(notes => {
            const count = notes.filter(n => !n.is_read).length;
            this.unreadCount.set(count);
        });*/
    }

    logout() {
        this.authService.logout().subscribe({
            next: () => this.router.navigate(['/login']),
            error: () => this.router.navigate(['/login'])
        });
    }
}

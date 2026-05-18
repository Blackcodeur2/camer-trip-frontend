import { Component, computed, inject, signal } from '@angular/core';
import { AppButton } from "../../../shared/button/app-button/app-button";
import { MatIconModule } from "@angular/material/icon";
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { Agence } from '../../../models/agence';
import { User } from '../../../models/user';
import { AdminService } from '../../../services/admin/admin-service';
import { Station } from '../../../models/station';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../../services/auth/auth-service';


@Component({
  selector: 'app-users',
  imports: [CommonModule, MatIconModule, DatePipe, ReactiveFormsModule, PaginationComponent],
  templateUrl: './users.html',
  styleUrl: './users.css',
})
export class Users {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);


  users = signal<User[]>([]);
  agences = signal<Agence[]>([]);
  garesDisponibles = signal<Station[]>([]);
  protected readonly currentUser = this.authService.currentUser;
  isLoading = signal<boolean>(true);
  error = signal<string | null>(null);

  // Pagination cliente
  currentPage = signal<number>(1);
  pageSize = signal<number>(5); // 5 utilisateurs par page
  avatarPreview = signal<string | null>(null);
  showCreateForm = signal<boolean>(false);
  isCreating = signal<boolean>(false);
  selectedUser = signal<User | null>(null);

  // Filtre par rôle
  filterRole = signal<string>('');
  filteredUsers = computed(() => {
    const role = this.filterRole();
    return role ? this.users().filter(u => u.role_user === role) : this.users();
  });

  totalItems = computed(() => this.filteredUsers().length);

  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredUsers().slice(start, start + this.pageSize());
  });

  roles = ['ADMIN', 'CHEF_AGENCE', 'AGENT', 'CHAUFFEUR', 'CLIENT', 'PROPRIETAIRE'];

  userForm = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    num_cni: ['', Validators.required],
    date_naissance: ['', Validators.required],
    telephone: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
    role_user: ['', Validators.required],
    agence_id: [''],
    gare_id: [''],
    password: ['12345678', Validators.required]
  });

  ngOnInit() {
    this.loadUsers();
    this.loadAgences();

    // Reset page on role filter change
    this.userForm.get('agence_id')?.valueChanges.subscribe(agenceId => {
      this.userForm.get('gare_id')?.setValue('');
      if (agenceId) {
        const agence = this.agences().find(a => a.id === Number(agenceId));
        this.garesDisponibles.set(agence?.stations || []);
      } else {
        this.garesDisponibles.set([]);
      }
    });

    this.userForm.get('role_user')?.valueChanges.subscribe(role => {
      if (role === 'CHEF_AGENCE' || role === 'AGENT' || role === 'CHAUFFEUR') {
        this.userForm.get('agence_id')?.setValidators(Validators.required);
        this.userForm.get('gare_id')?.setValidators(Validators.required);
      } else {
        this.userForm.get('agence_id')?.clearValidators();
        this.userForm.get('gare_id')?.clearValidators();
        this.userForm.get('agence_id')?.setValue('');
        this.userForm.get('gare_id')?.setValue('');
      }
      this.userForm.get('agence_id')?.updateValueAndValidity();
      this.userForm.get('gare_id')?.updateValueAndValidity();
    });
  }

  loadUsers() {
    this.isLoading.set(true);
    this.error.set(null);
    this.adminService.getUsers().subscribe({
      next: (response: any) => {
        const data = response?.data;
        
        if (Array.isArray(data)) {
          this.users.set(data);
        } else if (data && Array.isArray(data.data)) {
          this.users.set(data.data);
        } else {
          this.users.set([]);
        }
        
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur de chargement', err);
        this.error.set('Impossible de charger la liste des utilisateurs.');
        this.isLoading.set(false);
      }
    });
  }

  onPageChange(page: number) {
    this.currentPage.set(page);
  }

  loadAgences() {
    this.adminService.getAgences().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data.data || []);
        this.agences.set(list);
      }
    });
  }

    protected readonly userAvatarUrl = computed(() => {
    const preview = this.avatarPreview();
    if (preview) return preview;

    const avatar = this.currentUser()?.profil_url;
    if (avatar) {
      return avatar.startsWith('http') ? avatar : `${environment.storageUrl}/${avatar}`;
    }
    return null;
  });

  toggleForm() {
    this.showCreateForm.update(v => !v);
    if (!this.showCreateForm()) this.userForm.reset({ password: '12345678' });
  }

  needsGareAssignment(): boolean {
    const role = this.userForm.get('role_user')?.value;
    return role === 'CHEF_AGENCE' || role === 'AGENT' || role === 'CHAUFFEUR';
  }

  getRoleLabel(role: string): string {
    const labels: Record<string, string> = {
      ADMIN: 'Administrateur',
      CHEF_AGENCE: 'Chef d\'agence',
      AGENT: 'Agent',
      CHAUFFEUR: 'Chauffeur',
      CLIENT: 'Client',
      PROPRIETAIRE: 'Propriétaire'
    };
    return labels[role] ?? role;
  }

  countByRole(role: string): number {
    return this.users().filter(u => u.role_user === role).length;
  }

  getAvatarUrl(user: User): string | null {
    if (!user.profil_url) return null;
    return user.profil_url.startsWith('http') ? user.profil_url : `${environment.storageUrl}/${user.profil_url}`;
  }

  getUserInitials(user: User): string {
    const first = user.prenom?.trim().charAt(0) ?? '';
    const last = user.nom?.trim().charAt(0) ?? '';
    return `${first || 'U'}${last || 'S'}`.toUpperCase();
  }

  viewDetails(user: User) {
    this.selectedUser.set(user);
  }

  closeDetails() {
    this.selectedUser.set(null);
  }

  getAgenceName(agenceId?: number | string): string {
    if (!agenceId) return '—';
    const agence = this.agences().find(a => a.id === Number(agenceId));
    return agence?.nom || '—';
  }

  getStationName(stationId?: number | string): string {
    if (!stationId) return '—';
    // On cherche dans toutes les agences pour trouver la station
    for (const agence of this.agences()) {
      const station = agence.stations?.find(s => s.id === Number(stationId));
      if (station) return station.nom ?? 'NA';
    }
    return '—';
  }
}

import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import Swal from 'sweetalert2';
import { AppButton } from '../../../shared/button/app-button/app-button';
import { AdminService, DocumentKYC } from '../../../services/admin/admin-service';
import { User } from '../../../models/user';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppButton],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminDashboard {
  protected readonly activeSection = signal<'agences' | 'users' | 'documents' | 'profile'>('agences');
  protected readonly agences = signal<any[]>([]);
  protected readonly users = signal<User[]>([]);
  protected readonly documents = signal<DocumentKYC[]>([]);
  protected readonly isLoading = signal(false);
  protected readonly sectionLoading = signal(false);

  private readonly fb = inject(FormBuilder);
  private readonly adminService = inject(AdminService);

  protected readonly profileForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required]],
    prenom: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
    telephone: ['', [Validators.required]],
    date_naissance: [''],
    sexe: ['M', [Validators.required]],
  });

  constructor() {
    this.loadSectionData('agences');
    this.loadProfile();
  }

  protected setSection(section: 'agences' | 'users' | 'documents' | 'profile'): void {
    this.activeSection.set(section);
    this.loadSectionData(section);
  }

  protected shouldShowError(controlName: 'nom' | 'prenom' | 'email' | 'telephone' | 'sexe'): boolean {
    const control = this.profileForm.get(controlName);
    return !!control && control.invalid && control.touched;
  }

  protected errorMessage(controlName: 'nom' | 'prenom' | 'email' | 'telephone' | 'sexe'): string {
    const control = this.profileForm.get(controlName);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'Champ obligatoire.';
    if (control.errors['email']) return 'Email invalide.';
    return 'Valeur invalide.';
  }

  protected loadSectionData(section: 'agences' | 'users' | 'documents' | 'profile'): void {
    if (this.sectionLoading()) {
      return;
    }

    this.sectionLoading.set(true);

    let request$;
    switch (section) {
      case 'users':
        request$ = this.adminService.getUsers();
        request$.subscribe({
          next: users => this.users.set(users),
          error: () => this.handleError('Impossible de charger les utilisateurs.'),
          complete: () => this.sectionLoading.set(false)
        });
        break;
      case 'documents':
        request$ = this.adminService.getDocuments();
        request$.subscribe({
          next: documents => this.documents.set(documents),
          error: () => this.handleError('Impossible de charger les documents.'),
          complete: () => this.sectionLoading.set(false)
        });
        break;
      case 'agences':
        request$ = this.adminService.getAgences();
        request$.subscribe({
          next: agences => this.agences.set(agences),
          error: () => this.handleError('Impossible de charger les agences.'),
          complete: () => this.sectionLoading.set(false)
        });
        break;
      default:
        this.sectionLoading.set(false);
        break;
    }
  }

  protected loadProfile(): void {
    this.isLoading.set(true);
    this.adminService.getProfile().subscribe({
      next: profile => {
        this.profileForm.patchValue({
          nom: profile.nom || '',
          prenom: profile.prenom || '',
          email: profile.email || '',
          telephone: profile.telephone || '',
          date_naissance: profile.date_naissance || '',
          sexe: profile.sexe || 'M',
        });
      },
      error: () => this.handleError('Impossible de charger le profil.'),
      complete: () => this.isLoading.set(false)
    });
  }

  protected approveDocument(document: DocumentKYC): void {
    this.updateDocumentStatus(document, 'approuve');
  }

  protected rejectDocument(document: DocumentKYC): void {
    this.updateDocumentStatus(document, 'rejete');
  }

  protected saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.adminService.updateProfile(this.profileForm.getRawValue()).subscribe({
      next: () => {
        Swal.fire({
          icon: 'success',
          title: 'Profil mis à jour',
          text: 'Vos informations ont été enregistrées avec succès.',
          confirmButtonColor: '#3b82f6'
        });
      },
      error: () => this.handleError('Impossible de mettre à jour le profil.'),
      complete: () => this.isLoading.set(false)
    });
  }

  private updateDocumentStatus(document: DocumentKYC, statut: string): void {
    this.isLoading.set(true);
    this.adminService.updateDocumentStatus(document.id, statut).subscribe({
      next: updated => {
        const list = this.documents().map(doc => doc.id === updated.id ? updated : doc);
        this.documents.set(list);
        Swal.fire({
          icon: 'success',
          title: 'Statut mis à jour',
          text: `Le document a été ${statut === 'approuve' ? 'approuvé' : 'rejeté'}.`,
          confirmButtonColor: '#3b82f6'
        });
      },
      error: () => this.handleError('Impossible de mettre à jour le document.'),
      complete: () => this.isLoading.set(false)
    });
  }

  private handleError(message: string): void {
    this.isLoading.set(false);
    this.sectionLoading.set(false);
    Swal.fire({
      icon: 'error',
      title: 'Erreur',
      text: message,
      confirmButtonColor: '#3b82f6'
    });
  }

  protected getDocumentLabel(status: string): string {
    switch (status) {
      case 'approuve':
        return 'Approuvé';
      case 'rejete':
        return 'Rejeté';
      case 'en attente':
      default:
        return 'En attente';
    }
  }
}

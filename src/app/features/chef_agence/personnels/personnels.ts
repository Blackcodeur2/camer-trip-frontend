import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { AppButton } from '../../../shared/button/app-button/app-button';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { User } from '../../../models/user';
import { AuthService } from '../../../services/auth/auth-service';
import { ChefAgenceService } from '../../../services/chef_agence/chef-agence-service';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-personnels',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, AppButton, PaginationComponent],
  templateUrl: './personnels.html',
  styleUrl: './personnels.css',
})
export class Personnels implements OnInit {
  private fb = inject(FormBuilder);
  private chefAgenceService = inject(ChefAgenceService);
  private authService = inject(AuthService);

  staffMembers = signal<User[]>([]);
  showForm = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  isExporting = signal(false);
  editId = signal<number | null>(null);
  driverLicense = signal<File | null>(null);

  roles = ['AGENT_RESERVATION', 'AGENT_ENVOIE_COURIER', 'AGENT_RECUPERATION_COURIER', 'CHAUFFEUR'];
  currentPage = signal(1);
  pageSize = signal(5);

  paginatedStaff = computed(() => {
    const list = this.staffMembers();
    if (!Array.isArray(list)) return [];
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return list.slice(start, end);
  });

  totalAgents = computed(() => this.staffMembers().filter(m => ['AGENT_RESERVATION', 'AGENT_ENVOIE_COURIER', 'AGENT_RECUPERATION_COURIER'].includes(m.role_user)).length);
  totalChauffeurs = computed(() => this.staffMembers().filter(m => m.role_user === 'CHAUFFEUR').length);

  staffForm = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    date_naissance: ['', Validators.required],
    num_cni: ['', Validators.required],
    telephone: ['', Validators.required],
    role_user: ['AGENT_RESERVATION', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    station_id: [null as number | null | undefined, [Validators.required]],
  });

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.staffForm.patchValue({ station_id: user.station_id });
    }
    this.loadStaff();
  }

  loadStaff() {
    this.chefAgenceService.getStaff().subscribe({
      next: (data: User[]) => {
        this.staffMembers.set(data || []);
      },
      error: () => this.staffMembers.set([])
    });
  }

  toggleForm() {
    if (this.showForm()) {
        this.isEditing.set(false);
        this.editId.set(null);
        this.staffForm.reset({ role_user: 'AGENT_RESERVATION' });
        this.staffForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    } else {
        // Prepare for create mode
        this.staffForm.get('password')?.setValidators([Validators.required, Validators.minLength(8)]);
    }
    this.staffForm.get('password')?.updateValueAndValidity();
    this.showForm.update(v => !v);
  }

  editStaff(member: User) {
    this.isEditing.set(true);
    this.editId.set(member.id || null);
    this.staffForm.patchValue({
        nom: member.nom,
        prenom: member.prenom,
        email: member.email,
        date_naissance: member.date_naissance,
        num_cni: member.num_cni,
        telephone: member.telephone,
        role_user: member.role_user,
        station_id: member.station_id
    });
    this.driverLicense.set(null);
    // Password is not required when editing
    this.staffForm.get('password')?.clearValidators();
    /*this.staffForm.get('password')?.setValidators([Validators.minLength(8)]);*/
    this.staffForm.get('password')?.updateValueAndValidity();
    this.staffForm.get('password')?.disable;
    this.showForm.set(true);
  }

  onLicenseFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    if (!file) {
      this.driverLicense.set(null);
      return;
    }
    this.driverLicense.set(file);
  }

  onSubmit() {
    if (this.staffForm.invalid) return;
    this.isSubmitting.set(true);

    const formValue = this.staffForm.getRawValue();
    if (formValue.role_user === 'CHAUFFEUR' && !this.isEditing() && !this.driverLicense()) {
      Swal.fire({ icon: 'error', title: 'Erreur', text: 'Le permis de conduire est requis pour un chauffeur.' });
      this.isSubmitting.set(false);
      return;
    }

    const payload = new FormData();
    payload.append('nom', formValue.nom || '');
    payload.append('prenom', formValue.prenom || '');
    payload.append('email', formValue.email || '');
    payload.append('date_naissance', formValue.date_naissance || '');
    payload.append('num_cni', formValue.num_cni || '');
    payload.append('telephone', formValue.telephone || '');
    payload.append('role_user', formValue.role_user || '');
    payload.append('station_id', String(this.editId() ? formValue.station_id : this.authService.currentUser()?.station_id ?? ''));

    if (formValue.password) {
      payload.append('password', formValue.password);
    }

    if (this.driverLicense()) {
      payload.append('permis_de_conduire', this.driverLicense()!);
    }

    if (this.isEditing() && this.editId()) {
      payload.append('id', String(this.editId()));
    }

    const request = this.isEditing()
      ? this.chefAgenceService.updateStaff(payload)
      : this.chefAgenceService.addStaff(payload);

    request.subscribe({
      next: (res: any) => {
        if (this.isEditing()) {
          this.staffMembers.update((list: User[]) => list.map((m: User) => m.id === this.editId() ? res : m));
          Swal.fire({ icon: 'success', title: 'Succès', text: res.message, timer: 2000, showConfirmButton: false });
          this.loadStaff();
        } else {
          this.staffMembers.update((list: User[]) => [res, ...list]);
          Swal.fire({ icon: 'success', title: 'Succès', text: 'Personnel ajouté', timer: 2000, showConfirmButton: false });
          this.loadStaff();
        }

        this.showForm.set(false);
        this.isSubmitting.set(false);
        this.isEditing.set(false);
        this.editId.set(null);
        this.driverLicense.set(null);
        this.staffForm.reset({ role_user: 'AGENT_RESERVATION' });
      },
      error: (error) => {
        this.isSubmitting.set(false);
        let errorMsg = 'Impossible d\'enregistrer le personnel';
        if (error.status === 422 && error.error?.errors) {
          errorMsg = Object.entries(error.error.errors)
            .map(([key, value]: [string, any]) => `${key}: ${value.join(', ')}`)
            .join('\n');
        }
        Swal.fire({ icon: 'error', title: 'Erreur', text: errorMsg });
      }
    });
  }

  downloadPdf() {
    if (this.isExporting()) return;
    this.isExporting.set(true);

    this.chefAgenceService.exportPersonnelPdf().subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const now = new Date();
        const dateStr = `${now.getFullYear()}_${(now.getMonth() + 1).toString().padStart(2, '0')}_${now.getDate().toString().padStart(2, '0')}`;
        link.download = `personnel_agence_${dateStr}.pdf`;
        document.body.appendChild(link);
        link.click();

        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        this.isExporting.set(false);
        Swal.fire({ icon: 'success', title: 'Succès', text: 'Téléchargement réussi', timer: 2000, showConfirmButton: false });
      },
      error: (error) => {
        this.isExporting.set(false);
        if (error.status === 200) return;
        Swal.fire({ icon: 'error', title: 'Erreur', text: 'Impossible de télécharger le document PDF' });
      }
    });
  }
}

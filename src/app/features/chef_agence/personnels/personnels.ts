import { Component, computed, inject, signal } from '@angular/core';
import { AppButton } from '../../../shared/button/app-button/app-button';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { User } from '../../../models/user';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-personnels',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, AppButton, PaginationComponent],
  templateUrl: './personnels.html',
  styleUrl: './personnels.css',
})
export class Personnels {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);

  staffMembers = signal<User[]>([]);
  showForm = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  isExporting = signal(false);
  editId = signal<number | null>(null);

  roles = ['AGENT', 'CHAUFFEUR'];
  currentPage = signal(1);
  pageSize = signal(5);

  paginatedStaff = computed(() => {
    const list = this.staffMembers();
    if (!Array.isArray(list)) return [];
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return list.slice(start, end);
  });

  totalAgents = computed(() => this.staffMembers().filter(m => m.role_user === 'AGENT').length);
  totalChauffeurs = computed(() => this.staffMembers().filter(m => m.role_user === 'CHAUFFEUR').length);

  staffForm = this.fb.group({
    nom: ['', Validators.required],
    prenom: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    date_naissance: ['', Validators.required],
    num_cni: ['', Validators.required],
    telephone: ['', Validators.required],
    role_user: ['AGENT', Validators.required],
    password: ['', [Validators.required, Validators.minLength(8)]],
    gare_id: [null as number | null | undefined],
  });

  ngOnInit() {
    this.loadStaff();
  }

  loadStaff() {
        this.staffMembers.set([]);
  }

  toggleForm() {
    if (this.showForm()) {
        this.isEditing.set(false);
        this.editId.set(null);
        this.staffForm.reset({ role_user: 'AGENT' });
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
        gare_id: member.station_id
    });
    // Password is not required when editing
    this.staffForm.get('password')?.clearValidators();
    this.staffForm.get('password')?.setValidators([Validators.minLength(8)]);
    this.staffForm.get('password')?.updateValueAndValidity();
    this.showForm.set(true);
  }

  onSubmit() {
    
  }

  downloadPdf() {

  }
}

import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import Swal from 'sweetalert2';
import { Agence } from '../../../models/agence';
import { User } from '../../../models/user';
import { ProprietaireService } from '../../../services/proprietaire/proprietaire-service';
import { Station } from '../../../models/station';

import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { computed } from '@angular/core';

@Component({
  selector: 'app-personnels',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './personnels.html',
  styleUrl: './personnels.css',
}) export class Personnels{
  private proprietaireService = inject(ProprietaireService);
  private fb = inject(FormBuilder);

  personnels = signal<User[]>([]);
  agencies = signal<Agence[]>([]);
  gares = signal<Station[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);

  currentPage = signal(1);
  pageSize = signal(4);

  paginatedPersonnels = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.personnels().slice(start, end);
  });

  gerantForm = this.fb.nonNullable.group({
    prenom:               ['', Validators.required],
    nom:                  ['', Validators.required],
    email:                ['', [Validators.required, Validators.email]],
    telephone:            ['', [Validators.required, Validators.pattern(/^[0-9]{9,15}$/)]],
    num_cni:              ['', Validators.required],
    date_naissance:       ['', Validators.required],
    station_id:           [0,  Validators.required],
    password:             ['', [Validators.minLength(8)]],
    password_confirmation: [''],
  }, { validators: this.passwordMatchValidator });

  private passwordMatchValidator(ctrl: any) {
    const pw  = ctrl.get('password')?.value;
    const cpw = ctrl.get('password_confirmation')?.value;
    if (pw && cpw && pw !== cpw) {
      ctrl.get('password_confirmation')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }
    return null;
  }

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.isLoading.set(true);
    this.proprietaireService.getMyPersonnels().subscribe({
      next: (data) => {
        this.personnels.set(Array.isArray(data) ? data : (data as any).data ?? []);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false)
    });
    this.proprietaireService.getMyAgences().subscribe({
      next: (data) => {
        this.agencies.set(Array.isArray(data) ? data : (data as any).data ?? []);
      }
    });
    this.proprietaireService.getMyStations().subscribe({
      next: (data) => {
        this.gares.set(Array.isArray(data) ? data : (data as any).data ?? []);
      }
    });
  }

  gareName(id: number): string {
    const gare = this.gares().find(g => g.id === id);
    if (!gare) {
      return `Gare #${id}`;
    }
    return gare.nom || `${gare.ville} - ${gare.quartier}`;
  }

  shouldShowError(field: string): boolean {
    const ctrl = this.gerantForm.get(field);
    return !!ctrl && ctrl.touched && ctrl.invalid;
  }

  getInitials(manager: User): string {
    return ((manager.prenom?.[0] ?? '') + (manager.nom?.[0] ?? '')).toUpperCase() || '?';
  }
}

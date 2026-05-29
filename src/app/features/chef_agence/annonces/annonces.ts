import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { ChefAgenceService } from '../../../services/chef_agence/chef-agence-service';
import { environment } from '../../../../environments/environment';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-annonces',
  standalone: true,
  imports: [CommonModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './annonces.html',
  styleUrl: './annonces.css',
})
export class Annonces implements OnInit {
  private chefAgenceService = inject(ChefAgenceService);
  private fb = inject(FormBuilder);

  annonces = signal<any[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  showForm = signal(false);
  selectedImage = signal<File | null>(null);
  imagePreview = signal<string | null>(null);
  private imageInput: HTMLInputElement | null = null;

  annonceForm = this.fb.group({
    contenu_text: ['', [Validators.required, Validators.minLength(5)]],
    is_promo: [false],
  });

  ngOnInit() {
    this.loadAnnonces();
  }

  loadAnnonces() {
    this.isLoading.set(true);
    this.chefAgenceService.getAnnonces().subscribe({
      next: (data) => {
        this.annonces.set(data);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        Swal.fire('Erreur', 'Impossible de charger les annonces.', 'error');
      },
    });
  }

  toggleForm() {
    this.showForm.update((v) => !v);
    if (!this.showForm()) {
      this.resetForm();
    }
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.imageInput = input;
    const file = input.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      Swal.fire('Attention', 'Format non supporté. Utilisez JPG, PNG, GIF ou WebP.', 'warning');
      input.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      Swal.fire('Attention', 'L\'image ne doit pas dépasser 5 Mo.', 'warning');
      input.value = '';
      return;
    }
    this.selectedImage.set(file);
    const reader = new FileReader();
    reader.onload = () => this.imagePreview.set(reader.result as string);
    reader.readAsDataURL(file);
  }

  clearImage() {
    this.selectedImage.set(null);
    this.imagePreview.set(null);
    if (this.imageInput) {
      this.imageInput.value = '';
    }
  }

  publishAnnonce() {
    if (this.annonceForm.invalid) {
      this.annonceForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('contenu_text', this.annonceForm.value.contenu_text!);
    formData.append('is_promo', this.annonceForm.value.is_promo ? '1' : '0');
    const imageFile = this.selectedImage();
    if (imageFile) {
      formData.append('image', imageFile, imageFile.name);
    }

    this.isSubmitting.set(true);
    this.chefAgenceService.createAnnonce(formData).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        Swal.fire('Publié', 'L\'annonce est visible par les clients.', 'success');
        this.toggleForm();
        this.loadAnnonces();
      },
      error: (err) => {
        this.isSubmitting.set(false);
        const msg = err.error?.message
          || err.error?.errors?.image?.[0]
          || 'Publication impossible.';
        Swal.fire('Erreur', msg, 'error');
      },
    });
  }

  deleteAnnonce(annonce: any) {
    Swal.fire({
      title: 'Supprimer cette annonce ?',
      text: 'Cette action est irréversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      confirmButtonText: 'Supprimer',
      cancelButtonText: 'Annuler',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.chefAgenceService.deleteAnnonce(annonce.id).subscribe({
        next: () => {
          this.annonces.update((list) => list.filter((a) => a.id !== annonce.id));
          Swal.fire({ icon: 'success', title: 'Annonce supprimée', timer: 1500, showConfirmButton: false });
        },
        error: (err) => Swal.fire('Erreur', err.error?.message || 'Suppression impossible.', 'error'),
      });
    });
  }

  getAnnonceImageUrl(annonce: { image_url?: string | null }): string | null {
    const url = annonce?.image_url;
    if (!url) return null;
    if (url.startsWith('http')) return url;

    const path = url.replace(/^\/+/, '').replace(/^storage\//, '');
    return `${environment.storageUrl}/${path}`;
  }

  private resetForm() {
    this.annonceForm.reset({ is_promo: false });
    this.clearImage();
  }
}

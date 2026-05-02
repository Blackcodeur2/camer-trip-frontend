import { Component, computed, HostListener, inject, signal } from '@angular/core';
import { AppButton } from '../../../shared/button/app-button/app-button';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { Strajets } from '../../proprietaire/strajets/strajets';
import { Trajet } from '../../../models/trajet';
import { Ville } from '../../../models/ville';
import { AuthService } from '../../../services/auth/auth-service';
import { ChefAgenceService } from '../../../services/chef_agence/chef-agence-service';
import Swal from 'sweetalert2';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-trajets',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, AppButton, PaginationComponent],
  templateUrl: './trajets.html',
  styleUrl: './trajets.css',
})
export class Trajets {
  private fb = inject(FormBuilder);
  private chefAgenceService = inject(ChefAgenceService);
  private authService = inject(AuthService);

  routesList = signal<Trajet[]>([]);
  villes = signal<Ville[]>([]);
  showForm = signal(false);
  isSubmitting = signal(false);
  isEditing = signal(false);
  isExporting = signal(false);
  editId = signal<number | null>(null);
  private http = inject(HttpClient);
  allVillesData = signal<{ nom: string }[]>([]);
  filteredVilles = signal<string[]>([]);
  activeAutocompleteField = signal<'depart' | 'arrivee' | null>(null);
  currentPage = signal(1);
  pageSize = signal(5);

  paginatedRoutes = computed(() => {
    const list = this.routesList();
    if (!Array.isArray(list)) return [];
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return list.slice(start, end);
  });

  totalVIP = computed(() => this.routesList().filter(r => r.type_trajet === 'vip').length);
  totalClassique = computed(() => this.routesList().filter(r => r.type_trajet === 'classique').length);

  routeForm = this.fb.group({
    depart: ['', Validators.required],
    arrivee: ['', Validators.required],
    duree_heure: [0, Validators.required],
    prix: [5000, [Validators.required, Validators.min(100)]],
    type_trajet: ['classique', [Validators.required]],
    station_id: [null as number | null | undefined, [Validators.required]]
  });


  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.routeForm.patchValue({ station_id: user.station_id });
    }
    this.loadTrajets();
    this.loadVillesFromJson();
    this.routeForm.controls.depart.valueChanges.subscribe(val => {
      if (this.activeAutocompleteField() === 'depart') this.filterVilles(val || '');
    });
    this.routeForm.controls.arrivee.valueChanges.subscribe(val => {
      if (this.activeAutocompleteField() === 'arrivee') this.filterVilles(val || '');
    });
  }

  selectVilleDepart(ville: string) {
    this.routeForm.controls.depart.setValue(ville,);
    this.activeAutocompleteField.set(null);
  }

  selectVilleArrivee(ville: string) {
    this.routeForm.controls.arrivee.setValue(ville,)
    this.activeAutocompleteField.set(null);
  }

  loadVillesFromJson() {

    this.http.get<{ nom: string }[]>('assets/villes.json').subscribe({
      next: (data) => {
        this.allVillesData.set(data);
        const currentValDepart = this.routeForm.controls.depart.value;
        const currentValArrivee = this.routeForm.controls.depart.value;
        if (currentValDepart) {
          this.filterVilles(currentValDepart);
        } else if (currentValArrivee) {
          this.filterVilles(currentValArrivee);
        }
      },
      error: (err) => console.error('Erreur chargement villes.json', err)
    });
  }

  private normalizeString(str: string): string {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  }

  onVilleDepartFocus() {
    this.activeAutocompleteField.set('depart');
    this.filterVilles(this.routeForm.controls.depart.value || '');
  }

  onVilleArriveeFocus() {
    this.activeAutocompleteField.set('arrivee');
    this.filterVilles(this.routeForm.controls.arrivee.value || '');
  }


  filterVilles(val: string) {
    const search = this.normalizeString(val);
    if (search.length < 1) {
      this.filteredVilles.set([]);
      return;
    }

    const filtered = this.allVillesData()
      .filter(v => this.normalizeString(v.nom).includes(search))
      .map(v => v.nom)
      .slice(0, 10);

    this.filteredVilles.set(filtered);
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    const target = event.target as HTMLElement;
    if (!target.closest('.autocomplete-wrap')) {
      this.activeAutocompleteField.set(null);
    }
  }


  loadTrajets() {
    this.chefAgenceService.getRoutes().subscribe({
      next: (data: Trajet[]) => {
        this.routesList.set(data || []);
      },
      error: () => this.routesList.set([])
    });
  }

  toggleForm() {
    if (this.showForm()) {
      this.isEditing.set(false);
      this.editId.set(null);
      this.routeForm.reset({ station_id: this.authService.currentUser()?.station_id });
    }
    this.showForm.update(v => !v);
  }

  editRoute(trajet: Trajet) {
    this.isEditing.set(true);
    this.editId.set(trajet.id || null);
    this.routeForm.patchValue({
      depart: trajet.depart,
      arrivee: trajet.arrivee,
      prix: trajet.prix,
      duree_heure: trajet.duree_heure,
      type_trajet: trajet.type_trajet,
      station_id: trajet.station_id
    });
    this.showForm.set(true);
  }


  onSubmit() {
    if (this.routeForm.invalid) return;
    this.isSubmitting.set(true);

    const routeData = this.routeForm.value as any;
    const request = this.isEditing()
      ? this.chefAgenceService.updateRoute({ ...routeData, id: this.editId() })
      : this.chefAgenceService.createRoute(routeData);

    request.subscribe({
      next: (res: Trajet) => {
        if (this.isEditing()) {
          this.routesList.update((list: Trajet[]) => list.map((r: Trajet) => r.id === this.editId() ? res : r));
          Swal.fire({ icon: 'success', title: 'Succès', text: 'Ligne mise à jour', timer: 2000, showConfirmButton: false });
          this.loadTrajets();
        } else {
          this.routesList.update((list: Trajet[]) => [res, ...list]);
          Swal.fire({ icon: 'success', title: 'Succès', text: 'Ligne créée', timer: 2000, showConfirmButton: false });
          this.loadTrajets();
        }

        this.showForm.set(false);
        this.isSubmitting.set(false);
        this.isEditing.set(false);
        this.editId.set(null);
        this.routeForm.reset({ station_id: this.authService.currentUser()?.station_id });
      },
      error: (error) => {
        this.isSubmitting.set(false);
        let errorMsg = 'Impossible d\'enregistrer la ligne';
        if (error.status === 422 && error.error?.errors) {
          errorMsg = Object.values(error.error.errors).flat().join('\n');
        }
        Swal.fire({ icon: 'error', title: 'Erreur', text: errorMsg });
      }
    });
  }

  shouldShowError(form: 'trajet', field: string): boolean {
    const ctrl = this.getCtrl(form, field);
    return !!ctrl && ctrl.touched && ctrl.invalid;
  }

  private getCtrl(form: 'trajet', field: string) {
    const fg: import('@angular/forms').AbstractControl =
      form === 'trajet' ? this.routeForm : this.routeForm;
    return fg.get(field);
  }

  errorMessage(form: 'trajet', field: string): string {
    const errors = this.getCtrl(form, field)?.errors;
    if (!errors) return '';
    if (errors['required']) return 'Champ obligatoire.';
    if (errors['depart'] === errors['arrivee']) return 'L\'arrivee ne peut etre egale au depart';
    return 'Valeur invalide.';
  }

  downloadPdf() {

  }


}

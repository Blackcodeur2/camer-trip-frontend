import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import Swal from 'sweetalert2';
import { Colis } from '../../../models/colis';

@Component({
  selector: 'app-colis',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, PaginationComponent],
  templateUrl: './colis.html',
  styleUrl: './colis.css',
})
export class ColisPage {
  private fb = inject(FormBuilder);

  viewMode = signal<'list' | 'create'>('list');
  colisList = signal<Colis[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);

  // Pagination support
  currentPage = signal(1);
  pageSize = signal(10);
  paginatedColis = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.colisList().slice(start, start + this.pageSize());
  });

  // Client search support
  clientSearchQuery$ = new Subject<string>();
  clientSearchResults = signal<any[]>([]);
  selectedClient = signal<any>(null);

  // Voyages (to replace Destinations)
  availableVoyages = signal<any[]>([]);

  colisForm: FormGroup;

  constructor() {
    this.colisForm = this.fb.group({
      clientSearchQuery: [''],
      nom_colis: ['', Validators.required],
      tel_destinataire: ['', Validators.required],
      nom_destinataire: ['', Validators.required],
      voyage_id: ['', Validators.required],
      destination: ['', Validators.required], // Hidden field derived from voyage
      prix: [0, [Validators.min(0)]],
      poids: [0, [Validators.min(0)]]
    });

    // Handle Client search stream
    this.clientSearchQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) return of([]);
        return [];
      })
    ).subscribe(results => {
      this.clientSearchResults.set(results);
    });
  }

  ngOnInit() {
    this.loadColis();
    this.loadVoyages();
  }

  toggleViewMode() {
    if (this.viewMode() === 'list') {
      this.viewMode.set('create');
      this.colisForm.reset({ prix: 0, poids: 0, clientSearchQuery: '', voyage_id: '', destination: '' });
      this.selectedClient.set(null);
    } else {
      this.viewMode.set('list');
    }
  }

  loadColis() {
    this.isLoading.set(true);
        this.colisList.set([]);
        this.isLoading.set(false);
        this.isLoading.set(false);
  }

  loadVoyages() {
        this.availableVoyages.set([]);
  }

  onVoyageChange() {
    const voyageId = this.colisForm.get('voyage_id')?.value;
    const selectedVoyage = this.availableVoyages().find(v => v.id == voyageId);
    
    if (selectedVoyage) {
        const destinationId = selectedVoyage.trajet?.gare_id; // À vérifier si c'est bien la gare de destination
        
        if (destinationId) {
            this.colisForm.patchValue({ destination: destinationId });
        }
    }
  }

  onClientSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    if (query.length < 2) {
      this.clientSearchResults.set([]);
    } else {
      this.clientSearchQuery$.next(query);
    }
  }

  selectClient(client: any) {
    this.selectedClient.set(client);
    this.clientSearchResults.set([]);
    this.colisForm.get('clientSearchQuery')?.setValue('');
  }

  clearClient() {
    this.selectedClient.set(null);
  }

  markAsRetrieved(id: number) {

  }

  onSubmitColis() {
    
  }
}

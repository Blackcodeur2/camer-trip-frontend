import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import Swal from 'sweetalert2';
import { Colis } from '../../../models/colis';
import { AppButton } from "../../../shared/button/app-button/app-button";
import { AgentService } from '../../../services/agent/agent-service';
import { AuthService } from '../../../services/auth/auth-service';

@Component({
  selector: 'app-colis',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, FormsModule, PaginationComponent, AppButton],
  templateUrl: './colis.html',
  styleUrl: './colis.css',
})
export class ColisPage {
  private agentService = inject(AgentService);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);

  protected readonly currentUserRole = computed(() => this.authService.currentUser()?.role_user);
  protected readonly isRecuperationAgent = computed(() => this.currentUserRole() === 'AGENT_RECUPERATION_COURIER');
  protected readonly isEnvoiAgent        = computed(() => this.currentUserRole() === 'AGENT_ENVOIE_COURIER');
  protected readonly isChefAgence        = computed(() => this.currentUserRole() === 'CHEF_AGENCE');

  /** L'agent d'envoi ne peut PAS retirer de colis */
  protected readonly canWithdraw = computed(() => !this.isEnvoiAgent());
  /** L'agent de récupération ne peut PAS créer de colis */
  protected readonly canCreate   = computed(() => !this.isRecuperationAgent() && !this.isChefAgence());

  viewMode = signal<'list' | 'create'>('list');
  colisList = signal<Colis[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);

  // Phone search (for AGENT_RECUPERATION_COURIER)
  phoneSearchQuery = signal<string>('');
  phoneSearchResults = signal<Colis[]>([]);
  isSearching = signal(false);
  hasSearched = signal(false);

  // Grouping and Filtering
  filterDestination = signal<string>('');
  filterDate = signal<string>('');

  // Bulk selection
  selectedColisIds = signal<Set<number>>(new Set());

  // Filtered List
  filteredColisList = computed(() => {
    return this.colisList().filter(colis => {
      let matchDest = true;
      let matchDate = true;
      
      if (this.filterDestination()) {
        matchDest = colis.destination?.toLowerCase() === this.filterDestination().toLowerCase();
      }
      
      if (this.filterDate()) {
        const colisDate = new Date(colis.created_at || '').toISOString().split('T')[0];
        matchDate = colisDate === this.filterDate();
      }
      
      return matchDest && matchDate;
    });
  });

  // Unique Destinations for dropdown
  uniqueDestinations = computed(() => {
    const dests = this.colisList().map(c => c.destination).filter(d => !!d);
    return [...new Set(dests)];
  });


  // Pagination support
  currentPage = signal(1);
  pageSize = signal(10); // Changed to 10 for easier bulk selection
  paginatedColis = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredColisList().slice(start, start + this.pageSize());
  });

  // Client (Expéditeur) search support
  clientSearchQuery$ = new Subject<string>();
  clientSearchResults = signal<any[]>([]);
  selectedClient = signal<any>(null);

  // Destinataire search support
  destSearchQuery$ = new Subject<string>();
  destSearchResults = signal<any[]>([]);
  selectedDest = signal<any>(null);

  // Trajets
  availableTrajets = signal<any[]>([]);

  colisForm: FormGroup;
  isGuestSender = signal(false);

  constructor() {
    this.colisForm = this.fb.group({
      clientSearchQuery: [''],
      destSearchQuery: [''],
      nom_expediteur: [''],
      tel_expediteur: [''],
      nom_colis: ['', Validators.required],
      tel_destinataire: ['', Validators.required],
      nom_destinataire: ['', Validators.required],
      trajet_id: ['', Validators.required],
      destination: ['', Validators.required],
      prix: [0, [Validators.min(0)]],
      poids: [0, [Validators.min(0)]]
    });

    // Handle Client (Expéditeur) search stream
    this.clientSearchQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) return of([]);
        return this.agentService.searchClients(query).pipe(catchError(() => of([])));
      })
    ).subscribe(results => {
      this.clientSearchResults.set(results);
    });

    // Handle Destinataire search stream
    this.destSearchQuery$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query || query.length < 2) return of([]);
        return this.agentService.searchClients(query).pipe(catchError(() => of([])));
      })
    ).subscribe(results => {
      this.destSearchResults.set(results);
    });
  }

  ngOnInit() {
    this.loadColis();
    this.loadTrajets();
  }

  searchByPhone() {
    const phone = this.phoneSearchQuery().trim();
    if (phone.length < 6) {
      Swal.fire('Attention', 'Veuillez saisir au moins 6 chiffres du numéro de téléphone.', 'warning');
      return;
    }
    this.isSearching.set(true);
    this.hasSearched.set(true);
    this.agentService.searchColisByPhone(phone).pipe(
      catchError(() => of([]))
    ).subscribe(results => {
      this.phoneSearchResults.set(results);
      this.isSearching.set(false);
    });
  }

  clearPhoneSearch() {
    this.phoneSearchQuery.set('');
    this.phoneSearchResults.set([]);
    this.hasSearched.set(false);
  }

  toggleViewMode() {
    if (this.viewMode() === 'list') {
      this.viewMode.set('create');
      this.colisForm.reset({ prix: 0, poids: 0, clientSearchQuery: '', destSearchQuery: '', trajet_id: '', destination: '' });
      this.selectedClient.set(null);
      this.selectedDest.set(null);
      this.isGuestSender.set(false);
    } else {
      this.viewMode.set('list');
    }
  }

  loadColis() {
    this.isLoading.set(true);
    this.agentService.getColis().subscribe({
      next: (data) => {
        this.colisList.set(data);
        this.selectedColisIds.set(new Set()); // Clear selection when data reloads
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Erreur chargement colis:', err);
        this.isLoading.set(false);
      }
    });
  }

  loadTrajets() {
    this.agentService.getRoutes().subscribe({
      next: (trajets) => {
        this.availableTrajets.set(trajets);
      },
      error: (err) => console.error('Erreur trajets:', err)
    });
  }

  onTrajetChange() {
    const trajetId = this.colisForm.get('trajet_id')?.value;
    const selectedTrajet = this.availableTrajets().find(t => t.id == trajetId);

    if (selectedTrajet) {
      this.colisForm.patchValue({ destination: selectedTrajet.arrivee });
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

  onDestSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    if (query.length < 2) {
      this.destSearchResults.set([]);
    } else {
      this.destSearchQuery$.next(query);
    }
  }

  selectDest(client: any) {
    this.selectedDest.set(client);
    this.destSearchResults.set([]);
    this.colisForm.get('destSearchQuery')?.setValue('');
    // Auto-fill destinataire fields
    this.colisForm.patchValue({
      nom_destinataire: `${client.nom} ${client.prenom || ''}`.trim(),
      tel_destinataire: client.telephone
    });
  }

  clearDest() {
    this.selectedDest.set(null);
    this.colisForm.patchValue({
      nom_destinataire: '',
      tel_destinataire: ''
    });
  }

  toggleGuestSender() {
    this.isGuestSender.update(v => !v);
    if (this.isGuestSender()) {
      this.selectedClient.set(null);
      this.colisForm.get('nom_expediteur')?.setValidators([Validators.required]);
      this.colisForm.get('tel_expediteur')?.setValidators([Validators.required]);
    } else {
      this.colisForm.get('nom_expediteur')?.clearValidators();
      this.colisForm.get('tel_expediteur')?.clearValidators();
    }
    this.colisForm.get('nom_expediteur')?.updateValueAndValidity();
    this.colisForm.get('tel_expediteur')?.updateValueAndValidity();
  }

  clearClient() {
    this.selectedClient.set(null);
  }

  markAsRetrieved(id: number) {
    Swal.fire({
      title: 'Code de retrait',
      text: 'Veuillez saisir le code de retrait fourni par le destinataire :',
      input: 'text',
      inputPlaceholder: 'Entrez le code ici...',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Valider',
      cancelButtonText: 'Annuler',
      preConfirm: (code) => {
        if (!code) {
          Swal.showValidationMessage('Le code de retrait est requis pour valider cette opération.');
        }
        return code;
      }
    }).then((result) => {
      if (result.isConfirmed) {
        const code_retrait = result.value;
        this.agentService.updateColisStatus(id, 'retire', code_retrait).subscribe({
          next: () => {
            this.colisList.update(list => list.map(c => c.id === id ? { ...c, statut: 'retire' } : c));
            // Rafraîchir les résultats de la recherche téléphone si active
            if (this.hasSearched()) {
              this.phoneSearchResults.update(list => list.map(c => c.id === id ? { ...c, statut: 'retire' } : c));
            }
            Swal.fire('Validé !', 'Le colis a été marqué comme retiré.', 'success');
            this.loadColis();
            this.loadTrajets();
          },
          error: (err) => {
            Swal.fire('Erreur', err.error?.message || 'Code incorrect ou une erreur est survenue.', 'error');
          }
        });
      }
    });
  }

  changeStatus(id: number, currentStatut: string, newStatut: string) {
    if (newStatut === 'retire') {
      this.markAsRetrieved(id);
      return;
    }

    const actionText = newStatut === 'en route' ? 'mettre en route' : 'marquer comme arrivé';

    Swal.fire({
      title: 'Changer le statut',
      text: `Voulez-vous ${actionText} ce colis ?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.agentService.updateColisStatus(id, newStatut).subscribe({
          next: () => {
            this.colisList.update(list => list.map(c => c.id === id ? { ...c, statut: newStatut } : c));
            Swal.fire('Validé !', `Le colis est maintenant ${newStatut}.`, 'success');
          },
          error: (err) => {
            Swal.fire('Erreur', err.error?.message || 'Une erreur est survenue.', 'error');
          }
        });
      }
    });
  }

  // --- BULK OPERATIONS ---
  toggleColisSelection(id: number, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const newSet = new Set(this.selectedColisIds());
    if (isChecked) {
      newSet.add(id);
    } else {
      newSet.delete(id);
    }
    this.selectedColisIds.set(newSet);
  }

  toggleAllSelection(event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    if (isChecked) {
      // Select all currently visible (filtered) items that are not already "retire" 
      // (or we can select all, but bulk update validates it anyway)
      const ids = this.filteredColisList().map(c => c.id!);
      this.selectedColisIds.set(new Set(ids));
    } else {
      this.selectedColisIds.set(new Set());
    }
  }

  isAllSelected() {
    const filteredCount = this.filteredColisList().length;
    return filteredCount > 0 && this.selectedColisIds().size === filteredCount;
  }

  bulkUpdateStatus(newStatut: string) {
    const ids = Array.from(this.selectedColisIds());
    if (ids.length === 0) return;

    const actionText = newStatut === 'en route' ? 'mettre en route' : 'marquer comme arrivé(s)';

    Swal.fire({
      title: 'Modification massive',
      text: `Voulez-vous ${actionText} les ${ids.length} colis sélectionnés ?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.isLoading.set(true);
        this.agentService.bulkUpdateColisStatus(ids, newStatut).subscribe({
          next: (res) => {
            this.colisList.update(list => list.map(c => ids.includes(c.id!) ? { ...c, statut: newStatut } : c));
            this.selectedColisIds.set(new Set());
            Swal.fire('Succès !', res.message || `${ids.length} colis mis à jour.`, 'success');
            this.isLoading.set(false);
          },
          error: (err) => {
            Swal.fire('Erreur', err.error?.message || 'Erreur lors de la modification massive.', 'error');
            this.isLoading.set(false);
          }
        });
      }
    });
  }

  onSubmitColis() {
    if (!this.isGuestSender() && !this.selectedClient()) {
      Swal.fire('Attention', 'Veuillez sélectionner un client expéditeur ou cocher "Client non inscrit".', 'warning');
      return;
    }

    if (this.colisForm.invalid) {
      Swal.fire('Attention', 'Veuillez remplir tous les champs obligatoires.', 'warning');
      return;
    }

    this.isSubmitting.set(true);
    const formValue = this.colisForm.value;

    const payload: any = {
      nom_colis: formValue.nom_colis,
      tel_destinataire: formValue.tel_destinataire,
      nom_destinataire: formValue.nom_destinataire,
      trajet_id: formValue.trajet_id,
      destination: formValue.destination,
      prix: formValue.prix,
      poids: formValue.poids
    };

    if (this.isGuestSender()) {
      payload.nom_expediteur = formValue.nom_expediteur;
      payload.tel_expediteur = formValue.tel_expediteur;
    } else {
      payload.user_id = this.selectedClient()?.id;
    }

    this.agentService.createColis(payload).subscribe({
      next: (newColis) => {
        this.isSubmitting.set(false);
        Swal.fire('Succès', 'Colis enregistré avec succès', 'success');
        this.colisList.update(list => [newColis, ...list]);
        this.toggleViewMode();
        this.loadColis();
        this.loadTrajets();
      },
      error: (err) => {
        console.error('Registration error', err);
        this.isSubmitting.set(false);
        Swal.fire('Erreur', err.error?.message || 'Erreur lors de l\'enregistrement.', 'error');
      }
    });
  }
}

import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import Swal from 'sweetalert2';
import { Colis } from '../../../models/colis';
import { AppButton } from "../../../shared/button/app-button/app-button";
import { AgentService } from '../../../services/agent/agent-service';

@Component({
  selector: 'app-colis',
  imports: [CommonModule, MatIconModule, ReactiveFormsModule, PaginationComponent, AppButton],
  templateUrl: './colis.html',
  styleUrl: './colis.css',
})
export class ColisPage {
  private agentService = inject(AgentService);
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

  // Trajets
  availableTrajets = signal<any[]>([]);

  colisForm: FormGroup;
  isGuestSender = signal(false);

  constructor() {
    this.colisForm = this.fb.group({
      clientSearchQuery: [''],
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

    // Handle Client search stream
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
  }

  ngOnInit() {
    this.loadColis();
    this.loadTrajets();
  }

  toggleViewMode() {
    if (this.viewMode() === 'list') {
      this.viewMode.set('create');
      this.colisForm.reset({ prix: 0, poids: 0, clientSearchQuery: '', trajet_id: '', destination: '' });
      this.selectedClient.set(null);
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
      title: 'Confirmer le retrait',
      text: 'Voulez-vous marquer ce colis comme retiré par le destinataire ?',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#10B981',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Oui, confirmer',
      cancelButtonText: 'Annuler'
    }).then((result) => {
      if (result.isConfirmed) {
        this.agentService.updateColisStatus(id, 'retire').subscribe({
          next: () => {
            this.colisList.update(list => list.map(c => c.id === id ? { ...c, statut: 'retire' } : c));
            Swal.fire('Validé !', 'Le colis a été marqué comme retiré.', 'success');
            this.loadColis();
            this.loadTrajets();
          },
          error: (err) => {
            Swal.fire('Erreur', err.error?.message || 'Une erreur est survenue.', 'error');
          }
        });
      }
    });
  }

  onSubmitColis() {
    if (this.colisForm.invalid) {
      if (!this.isGuestSender() && !this.selectedClient()) {
         Swal.fire('Attention', 'Veuillez sélectionner un client ou remplir les infos expéditeur', 'warning');
         return;
      }
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

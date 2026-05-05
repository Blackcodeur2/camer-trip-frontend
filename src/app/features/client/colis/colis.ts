import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ClientService } from '../../../services/client/client-service';
import { AuthService } from '../../../services/auth/auth-service';
import { Colis } from '../../../models/colis';

@Component({
  selector: 'app-client-colis',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './colis.html',
  styleUrl: './colis.css'
})
export class ClientColisComponent implements OnInit {
  private clientService = inject(ClientService);
  private authService = inject(AuthService);

  colisList = signal<Colis[]>([]);
  isLoading = signal(true);
  activeTab = signal<'sent' | 'received'>('sent');
  searchQuery = signal('');

  currentUser = computed(() => this.authService.currentUser());

  sentColis = computed(() => 
    this.colisList().filter(c => c.user_id === this.currentUser()?.id)
  );

  receivedColis = computed(() => 
    this.colisList().filter(c => c.tel_destinataire === this.currentUser()?.telephone)
  );

  displayList = computed(() => 
    this.activeTab() === 'sent' ? this.sentColis() : this.receivedColis()
  );

  filteredDisplayList = computed(() => {
    const query = this.searchQuery().toLowerCase();
    if (!query) return this.displayList();
    return this.displayList().filter(c => 
      c.nom_colis.toLowerCase().includes(query) || 
      c.nom_destinataire.toLowerCase().includes(query) ||
      (c.user?.nom || '').toLowerCase().includes(query)
    );
  });

  ngOnInit() {
    this.loadColis();
  }

  loadColis() {
    this.isLoading.set(true);
    this.clientService.getColis().subscribe({
      next: (data) => {
        this.colisList.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error loading colis:', err);
        this.isLoading.set(false);
      }
    });
  }

  setTab(tab: 'sent' | 'received') {
    this.activeTab.set(tab);
  }

  onSearch(event: Event) {
    const query = (event.target as HTMLInputElement).value;
    this.searchQuery.set(query);
  }

  downloadReceipt(colis: Colis) {
    // To be implemented in the backend/service
    console.log('Downloading receipt for colis:', colis.id);
  }

  getStatusClass(statut: string): string {
    switch (statut) {
      case 'en attente': return 'status--pending';
      case 'en route': return 'status--active';
      case 'retire': return 'status--completed';
      default: return '';
    }
  }
}

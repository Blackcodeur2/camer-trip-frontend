import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { PaginationComponent } from '../../../shared/pagination/pagination-component/pagination-component';
import { Voyage } from '../../../models/voyage';

@Component({
  selector: 'app-historiques',
  imports: [CommonModule, MatIconModule, PaginationComponent],
  templateUrl: './historiques.html',
  styleUrl: './historiques.css',
})
export class Historiques {

  history = signal<Voyage[]>([]);
  isLoading = signal(true);
  currentPage = signal(1);
  pageSize = signal(4);

  paginatedHistory = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.history().slice(start, end);
  });

  ngOnInit() {
    this.loadHistory();
  }

  private loadHistory() {
    this.isLoading.set(true);

    this.history.set([]);
    this.isLoading.set(false);
  }
}

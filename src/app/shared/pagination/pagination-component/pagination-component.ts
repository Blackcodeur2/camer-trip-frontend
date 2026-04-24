import { CommonModule } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'gev-pagination',
  imports: [MatIconModule, CommonModule],
  templateUrl: './pagination-component.html',
  styleUrl: './pagination-component.css',
})
export class PaginationComponent {
  totalItems = input<number>(0);
  pageSize = input<number>(10);
  currentPage = input<number>(1);
  pageChange = output<number>();

  totalPages = computed(() => Math.ceil(this.totalItems() / this.pageSize()));

  pages = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 4) pages.push(-1); // Ellipsis

      const start = Math.max(2, current - 2);
      const end = Math.min(total - 1, current + 2);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (current < total - 3) pages.push(-1); // Ellipsis
      if (!pages.includes(total)) pages.push(total);
    }

    return pages;
  });

  onPageChange(page: number) {
    if (page >= 1 && page <= this.totalPages() && page !== this.currentPage()) {
      this.pageChange.emit(page);
    }
  }
}

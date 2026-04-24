import { ChangeDetectionStrategy, Component, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [RouterLink],
  templateUrl: './landing.html',
  styleUrl: './landing.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Landing {
  isScrolled = false;

  @HostListener('window:scroll', [])
  onWindowsScroll() {
    this.isScrolled = window.scrollY > 50;
  }
}

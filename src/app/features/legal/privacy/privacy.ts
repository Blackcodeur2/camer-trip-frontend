import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-privacy',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './privacy.html',
  styleUrl: './privacy.css'
})
export class Privacy {}

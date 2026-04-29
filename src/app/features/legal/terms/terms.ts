import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule, RouterLink, MatIconModule],
  templateUrl: './terms.html',
  styleUrl: './terms.css'
})
export class Terms {}

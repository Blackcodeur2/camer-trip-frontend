import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { catchError, of } from 'rxjs';

@Component({
  selector: 'app-validation',
  imports: [CommonModule, MatIconModule, FormsModule],
  templateUrl: './validation.html',
  styleUrl: './validation.css',
})
export class Validation {

  validationCode = signal('');
  isValidating = signal(false);
  resultMessage = signal<string | null>(null);
  validationSuccess = signal(false);

  verifyCode() {
    if (!this.validationCode()) {
      this.resultMessage.set('Veuillez entrer un code avant de vérifier.');
      this.validationSuccess.set(false);
      return;
    }

    this.isValidating.set(true);
    this.resultMessage.set(null);
  }
}

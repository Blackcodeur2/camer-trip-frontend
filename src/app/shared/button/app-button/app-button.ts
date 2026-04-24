import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-app-button',
  imports: [],
  templateUrl: './app-button.html',
  styleUrl: './app-button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppButton {
  @Input() type: 'button' | 'submit' = 'button';
    @Input() loading = false;
    @Input() disabled = false;
    @Input() variant: string = 'primary';
    @Input() size: 'small' | 'medium' | 'large' = 'medium';
    @Input() loadingText: string = 'Chargement...';

    @Output() btnClick = new EventEmitter<MouseEvent>();

    onClick(event: MouseEvent) {
        if (!this.loading && !this.disabled) {
            this.btnClick.emit(event);
        }
    }
}

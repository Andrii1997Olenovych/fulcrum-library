import type { ElementRef } from '@angular/core';
import { ChangeDetectionStrategy, Component, input, viewChild } from '@angular/core';
import type { FormControl } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-text-field',
  imports: [ReactiveFormsModule],
  templateUrl: './text-field.html',
  styleUrl: './text-field.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TextField {
  readonly control = input.required<FormControl<string>>();
  readonly label = input.required<string>();
  readonly inputId = input.required<string>();
  readonly error = input<string | null>(null);
  readonly required = input(false);
  private readonly textareaElement =
    viewChild.required<ElementRef<HTMLTextAreaElement>>('textareaElement');

  focus(): void {
    if (!this.control().disabled) this.textareaElement().nativeElement.focus();
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
  viewChild,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TextField } from '../text-field/text-field';
import type { BookDraft, BookFields } from '../books/book';
import { normalizeBook, validateBook } from '../books/book-rules';
import type { BookEditorState } from './book-editor-state';

@Component({
  selector: 'app-book-form',
  imports: [ReactiveFormsModule, TextField],
  templateUrl: './book-form.html',
  styleUrl: './book-form.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookForm {
  readonly editor = input.required<BookEditorState>();
  readonly disabled = input(false);
  readonly saved = output<BookFields>();
  readonly cancelled = output<void>();
  readonly form = new FormGroup({
    title: new FormControl('', { nonNullable: true }),
    author: new FormControl('', { nonNullable: true }),
    pages: new FormControl<number | null>(null),
  });
  private readonly titleField = viewChild.required<TextField>('titleField');
  private attempted = false;

  constructor() {
    this.form.addValidators(() => {
      const errors = validateBook(this.fields());
      return Object.keys(errors).length ? errors : null;
    });
    this.form.updateValueAndValidity();

    effect(() => {
      const editor = this.editor();
      if (!editor.open) {
        return;
      }

      this.form.reset({
        title: editor.book?.title ?? '',
        author: editor.book?.author ?? '',
        pages: editor.book?.pages ?? null,
      });
      this.attempted = false;
    });

    effect(() => {
      if (this.disabled()) {
        this.form.disable({ emitEvent: false });
      } else {
        this.form.enable({ emitEvent: false });
      }
    });
  }

  focusTitle(): void {
    if (this.editor().open && !this.disabled()) this.titleField().focus();
  }

  isDirty(): boolean {
    return this.form.dirty;
  }

  error(field: keyof BookFields): string | null {
    if (!this.attempted && !this.form.controls[field].touched) {
      return null;
    }

    const message: unknown = this.form.getError(field);
    return typeof message === 'string' ? message : null;
  }

  save(): void {
    if (!this.editor().open || this.disabled()) {
      return;
    }

    this.attempted = true;
    this.form.markAllAsTouched();
    const draft = this.fields();
    if (this.form.invalid || draft.pages === null) {
      return;
    }

    this.saved.emit(normalizeBook({ ...draft, pages: draft.pages }));
  }

  private fields(): BookDraft {
    return this.form.getRawValue();
  }
}

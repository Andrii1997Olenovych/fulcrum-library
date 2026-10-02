import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import type { Book } from '../books/book';
@Component({
  selector: 'app-book-list',
  templateUrl: './book-list.html',
  styleUrl: './book-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookList {
  readonly books = input.required<readonly Book[]>();
  readonly total = input.required<number>();
  readonly editingId = input<number | null>(null);
  readonly disabled = input(false);
  readonly editRequested = output<Book>();
  readonly removeRequested = output<Book>();
  readonly clearRequested = output<void>();
}

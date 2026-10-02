import type { ElementRef } from '@angular/core';
import { ChangeDetectionStrategy, Component, input, output, viewChild } from '@angular/core';
import type { Book } from '../books/book';
import { BookList } from '../book-list/book-list';
@Component({
  selector: 'app-book-collection',
  imports: [BookList],
  templateUrl: './book-collection.html',
  styleUrl: './book-collection.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BookCollection {
  readonly books = input.required<readonly Book[]>();
  readonly total = input.required<number>();
  readonly query = input('');
  readonly sortByAuthor = input(false);
  readonly editingId = input<number | null>(null);
  readonly disabled = input(false);
  readonly addRequested = output<void>();
  readonly editRequested = output<Book>();
  readonly removeRequested = output<Book>();
  readonly clearRequested = output<void>();
  readonly queryChanged = output<string>();
  readonly sortChanged = output<boolean>();
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  private readonly addButton = viewChild.required<ElementRef<HTMLButtonElement>>('addButton');

  focusSearch(): void {
    if (!this.disabled()) this.searchInput().nativeElement.focus();
  }

  focusAddButton(): void {
    if (!this.disabled()) this.addButton().nativeElement.focus();
  }
}

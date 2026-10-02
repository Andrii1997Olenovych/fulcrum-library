import { Injectable, signal } from '@angular/core';
import type { Book, BookFields } from './book';
import { normalizeBook } from './book-rules';

@Injectable({ providedIn: 'root' })
export class BookLibrary {
  private readonly entries = signal<readonly Book[]>([]);
  private nextId = 1;
  readonly books = this.entries.asReadonly();

  add(fields: BookFields): Book {
    const book = { ...normalizeBook(fields), id: this.nextId++ };
    this.entries.update((books) => [...books, book]);
    return book;
  }

  update(id: number, fields: BookFields): void {
    if (!this.entries().some((book) => book.id === id)) {
      throw new Error('This book is no longer in the library.');
    }
    const updated = { ...normalizeBook(fields), id };
    this.entries.update((books) => books.map((book) => (book.id === id ? updated : book)));
  }

  remove(id: number): void {
    this.entries.update((books) => books.filter((book) => book.id !== id));
  }

  replace(fields: readonly BookFields[]): void {
    const normalized = fields.map(normalizeBook);
    this.entries.set(normalized.map((book) => ({ ...book, id: this.nextId++ })));
  }
}

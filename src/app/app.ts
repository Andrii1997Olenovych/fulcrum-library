import type { AfterRenderRef } from '@angular/core';
import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { BookCollection } from './book-collection/book-collection';
import type { BookEditorState } from './book-form/book-editor-state';
import { BookForm } from './book-form/book-form';
import type { Book, BookFields } from './books/book';
import { LibraryFiles } from './books/library-files';
import { BookLibrary } from './books/book-library';
import { filterBooks, sortBooks } from './books/book-rules';
import { LibraryFeedback } from './library-feedback/library-feedback';
import type { LibraryFeedbackState } from './library-feedback/library-feedback-state';
import { LibraryHeader } from './library-header/library-header';
import { LibraryShell } from './library-shell/library-shell';

@Component({
  selector: 'app-root',
  imports: [BookForm, LibraryShell, LibraryHeader, LibraryFeedback, BookCollection],
  templateUrl: './app.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly library = inject(BookLibrary);
  private readonly injector = inject(Injector);
  private readonly files = inject(LibraryFiles);
  private readonly bookForm = viewChild(BookForm);
  private readonly collection = viewChild(BookCollection);
  private pendingFocus: AfterRenderRef | undefined;

  readonly query = signal('');
  readonly sortByAuthor = signal(false);
  readonly editor = signal<BookEditorState>({ open: false, book: null });
  readonly isImporting = signal(false);
  readonly feedback = signal<LibraryFeedbackState>(null);
  readonly orderedBooks = computed(() =>
    this.sortByAuthor() ? sortBooks(this.library.books()) : this.library.books(),
  );
  readonly visibleBooks = computed(() => filterBooks(this.orderedBooks(), this.query()));

  startAdding(): void {
    this.openEditor(null);
  }

  startEditing(book: Book): void {
    this.openEditor(book);
  }

  cancelEditing(): void {
    if (this.isImporting()) return;
    this.closeEditor();
    this.scheduleFocus(() => this.collection()?.focusAddButton());
  }

  saveBook(fields: BookFields): void {
    if (this.isImporting() || !this.editor().open) return;
    try {
      const current = this.editor().book;
      if (current) {
        this.library.update(current.id, fields);
      } else {
        this.library.add(fields);
      }
      this.cancelEditing();
      this.showSuccess(current ? 'Book updated.' : 'Book added.');
    } catch (error) {
      this.showError(error, 'The book could not be saved.');
    }
  }

  removeBook(book: Book): void {
    if (this.isImporting() || !window.confirm(`Remove “${book.title}” from your library?`)) return;
    this.library.remove(book.id);
    if (this.editor().book?.id === book.id) this.closeEditor();
    this.showSuccess('Book removed.');
    this.scheduleFocus(() => this.collection()?.focusAddButton());
  }

  async importFile(file: File): Promise<void> {
    if (this.isImporting()) return;
    if (
      (this.library.books().length || (this.editor().open && this.bookForm()?.isDirty())) &&
      !window.confirm(
        'Importing replaces your library and discards any unsaved form changes. Continue?',
      )
    ) {
      return;
    }

    this.pendingFocus?.destroy();
    this.pendingFocus = undefined;
    this.isImporting.set(true);
    this.clearFeedback();
    try {
      const books = await this.files.read(file);
      this.library.replace(books);
      this.closeEditor();
      this.query.set('');
      this.showSuccess(`Imported ${books.length} ${books.length === 1 ? 'book' : 'books'}.`);
    } catch (error) {
      this.showError(error, 'The file could not be imported.');
    } finally {
      this.isImporting.set(false);
    }
  }

  clearSearch(): void {
    if (this.isImporting()) return;
    this.query.set('');
    this.scheduleFocus(() => this.collection()?.focusSearch());
  }

  exportBooks(): void {
    if (this.isImporting() || this.library.books().length === 0) return;
    try {
      this.files.startDownload(this.orderedBooks());
      this.showSuccess('Download started.');
    } catch (error) {
      this.showError(error, 'The library could not be exported.');
    }
  }

  private openEditor(book: Book | null): void {
    if (this.isImporting()) return;
    const current = this.editor();
    if (current.open && current.book?.id === book?.id) {
      this.scheduleFocus(() => this.bookForm()?.focusTitle());
      return;
    }
    if (!this.canDiscardDraft()) return;
    this.editor.set({ open: true, book });
    this.scheduleFocus(() => this.bookForm()?.focusTitle());
  }

  private closeEditor(): void {
    // Retain the context while the form's exit transition finishes.
    this.editor.update((current) => ({ ...current, open: false }));
  }

  private canDiscardDraft(): boolean {
    return (
      !this.editor().open ||
      !this.bookForm()?.isDirty() ||
      window.confirm('Discard your unsaved form changes?')
    );
  }

  private showSuccess(message: string): void {
    this.feedback.set({ kind: 'success', message });
  }

  private showError(error: unknown, fallback: string): void {
    this.feedback.set({
      kind: 'error',
      message: error instanceof Error ? error.message : fallback,
    });
  }

  private clearFeedback(): void {
    this.feedback.set(null);
  }

  private scheduleFocus(focus: () => void): void {
    this.pendingFocus?.destroy();
    this.pendingFocus = afterNextRender(
      () => {
        this.pendingFocus = undefined;
        if (!this.isImporting()) focus();
      },
      { injector: this.injector },
    );
  }
}

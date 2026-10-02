import { TestBed } from '@angular/core/testing';
import type { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { App } from './app';
import { BookForm } from './book-form/book-form';
import type { Book, BookFields } from './books/book';
import { BookLibrary } from './books/book-library';
import { LibraryFiles } from './books/library-files';

const existingBook: BookFields = { title: 'Existing', author: 'Reader', pages: 20 };
const importedBooks: readonly BookFields[] = [
  { title: 'The Ugly Duckling', author: 'Andersen', pages: 32 },
  { title: 'The Green Mile', author: 'King', pages: 432 },
  { title: 'The Little Mermaid', author: 'Andersen', pages: 48 },
];

function xmlFile(): File {
  return new File(['<library/>'], 'library.xml', { type: 'application/xml' });
}

describe('App file actions', () => {
  let fixture: ComponentFixture<App>;
  let app: App;
  let library: BookLibrary;
  let read: ReturnType<typeof vi.fn<(file: File) => Promise<BookFields[]>>>;
  let startDownload: ReturnType<typeof vi.fn<(books: readonly BookFields[]) => void>>;

  beforeEach(() => {
    read = vi.fn();
    startDownload = vi.fn();
    TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: LibraryFiles, useValue: { read, startDownload } }],
    });
    fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    library = TestBed.inject(BookLibrary);
    fixture.detectChanges();
  });

  afterEach(() => vi.restoreAllMocks());

  function openDirtyDraft(book: Book): BookForm {
    app.startEditing(book);
    fixture.detectChanges();
    const form = fixture.debugElement.query(By.directive(BookForm)).componentInstance as BookForm;
    form.form.controls.title.setValue('Unsaved title');
    form.form.controls.title.markAsDirty();
    return form;
  }

  it('does not read or replace books when import confirmation is rejected', async () => {
    const book = library.add(existingBook);
    const form = openDirtyDraft(book);
    app.query.set('Existing');
    const before = library.books();
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(false);

    await app.importFile(xmlFile());

    expect(confirm).toHaveBeenCalledOnce();
    expect(read).not.toHaveBeenCalled();
    expect(library.books()).toBe(before);
    expect(app.editor()).toEqual({ open: true, book });
    expect(form.form.controls.title.value).toBe('Unsaved title');
    expect(app.query()).toBe('Existing');
  });

  it('preserves books, draft and search when reading fails', async () => {
    const book = library.add(existingBook);
    const form = openDirtyDraft(book);
    app.query.set('Existing');
    const before = library.books();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    read.mockRejectedValue(new Error('Invalid XML'));

    await app.importFile(xmlFile());

    expect(library.books()).toBe(before);
    expect(app.editor()).toEqual({ open: true, book });
    expect(form.form.controls.title.value).toBe('Unsaved title');
    expect(app.query()).toBe('Existing');
    expect(app.feedback()).toEqual({ kind: 'error', message: 'Invalid XML' });
    expect(app.isImporting()).toBe(false);
  });

  it('replaces books and closes the draft while preserving sort on successful import', async () => {
    const book = library.add(existingBook);
    openDirtyDraft(book);
    app.query.set('Existing');
    app.sortByAuthor.set(true);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    read.mockResolvedValue([...importedBooks]);

    await app.importFile(xmlFile());

    expect(library.books()).toMatchObject(importedBooks);
    expect(app.editor().open).toBe(false);
    expect(app.query()).toBe('');
    expect(app.sortByAuthor()).toBe(true);
    expect(app.feedback()).toEqual({ kind: 'success', message: 'Imported 3 books.' });
  });

  it('ignores a second import and library actions while a read is pending', async () => {
    const book = library.add(existingBook);
    const form = openDirtyDraft(book);
    app.query.set('Existing');
    const before = library.books();
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    let finishRead!: (books: BookFields[]) => void;
    read.mockReturnValue(new Promise<BookFields[]>((resolve) => (finishRead = resolve)));

    const importing = app.importFile(xmlFile());
    expect(app.isImporting()).toBe(true);

    await app.importFile(xmlFile());
    app.startAdding();
    app.cancelEditing();
    app.saveBook({ title: 'Changed', author: 'Reader', pages: 21 });
    app.removeBook(book);
    app.clearSearch();
    app.exportBooks();

    expect(read).toHaveBeenCalledOnce();
    expect(library.books()).toBe(before);
    expect(app.editor()).toEqual({ open: true, book });
    expect(form.form.controls.title.value).toBe('Unsaved title');
    expect(app.query()).toBe('Existing');
    expect(startDownload).not.toHaveBeenCalled();

    finishRead([...importedBooks]);
    await importing;
    expect(app.isImporting()).toBe(false);
    expect(library.books()).toMatchObject(importedBooks);
  });

  it('does not start a download for an empty library', () => {
    app.exportBooks();

    expect(startDownload).not.toHaveBeenCalled();
    expect(app.feedback()).toBeNull();
  });
});

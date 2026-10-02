import { describe, expect, it } from 'vitest';
import { BookLibrary } from './book-library';

const sample = { title: 'The Little Mermaid', author: 'Andersen', pages: 48 };

describe('BookLibrary', () => {
  it('keeps identical books as separate entries with different IDs', () => {
    const library = new BookLibrary();
    const first = library.add(sample);
    const second = library.add(sample);

    expect(first.id).not.toBe(second.id);
    expect(library.books()).toEqual([first, second]);
  });

  it('updates only the selected entry and keeps its ID', () => {
    const library = new BookLibrary();
    const first = library.add(sample);
    const second = library.add(sample);

    library.update(second.id, { title: 'The Ugly Duckling', author: 'Andersen', pages: 32 });

    expect(library.books()).toEqual([
      first,
      { id: second.id, title: 'The Ugly Duckling', author: 'Andersen', pages: 32 },
    ]);
  });

  it('removes only the entry with the selected ID', () => {
    const library = new BookLibrary();
    const first = library.add(sample);
    const second = library.add(sample);

    library.remove(first.id);

    expect(library.books()).toEqual([second]);
  });

  it('normalizes incoming books and replaces the library only when all are valid', () => {
    const library = new BookLibrary();
    const oldBook = library.add(sample);
    const imported = [
      { title: 'The Ugly Duckling', author: 'Andersen', pages: 32 },
      { title: 'The Green Mile', author: 'King', pages: 432 },
    ] as const;

    expect(() => library.replace([imported[0], { ...imported[1], pages: 0 }])).toThrow(
      'Enter a positive whole number of pages.',
    );
    expect(library.books()).toEqual([oldBook]);

    library.replace([{ ...imported[0], title: '  The Ugly Duckling  ' }, imported[1]]);

    expect(library.books().map(({ title, author, pages }) => ({ title, author, pages }))).toEqual(
      imported,
    );
    expect(new Set(library.books().map((book) => book.id)).size).toBe(2);
    expect(library.books().some((book) => book.id === oldBook.id)).toBe(false);
  });
});

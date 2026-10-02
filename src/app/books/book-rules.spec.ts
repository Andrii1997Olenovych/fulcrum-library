import { describe, expect, it } from 'vitest';
import { filterBooks, normalizeBook, sortBooks, validateBook } from './book-rules';

describe('book rules', () => {
  it('requires a title and an author with non-whitespace text', () => {
    expect(validateBook({ title: ' \n ', author: '\t', pages: 1 })).toEqual({
      title: 'Title is required.',
      author: 'Author is required.',
    });
  });

  it('rejects characters that cannot be written to XML', () => {
    expect(validateBook({ title: 'Bad\u0001title', author: 'Writer', pages: 1 })).toEqual({
      title: 'Title contains a character that XML cannot store.',
    });
  });

  it.each([null, 0, -1, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid page count %s',
    (pages) => {
      expect(validateBook({ title: 'Title', author: 'Writer', pages }).pages).toBe(
        'Enter a positive whole number of pages.',
      );
    },
  );

  it('trims outer whitespace without changing Unicode text or internal line breaks', () => {
    expect(normalizeBook({ title: '  Café\n& Sea  ', author: '\n Anaïs  ', pages: 32 })).toEqual({
      title: 'Café\n& Sea',
      author: 'Anaïs',
      pages: 32,
    });
  });

  it('sorts by author then title without changing the source order', () => {
    const books = Object.freeze([
      { title: 'The Ugly Duckling', author: 'Andersen', pages: 32 },
      { title: 'The Green Mile', author: 'King', pages: 432 },
      { title: 'The Little Mermaid', author: 'Andersen', pages: 48 },
    ]);

    expect(sortBooks(books).map((book) => book.title)).toEqual([
      'The Little Mermaid',
      'The Ugly Duckling',
      'The Green Mile',
    ]);
    expect(books.map((book) => book.title)).toEqual([
      'The Ugly Duckling',
      'The Green Mile',
      'The Little Mermaid',
    ]);
  });

  it('searches a trimmed, case-insensitive title query but ignores authors', () => {
    const books = [
      { title: 'The Little Mermaid', author: 'Andersen', pages: 48 },
      { title: 'The Green Mile', author: 'Meredith', pages: 432 },
    ];

    expect(filterBooks(books, '  MER  ')).toEqual([books[0]]);
  });
});

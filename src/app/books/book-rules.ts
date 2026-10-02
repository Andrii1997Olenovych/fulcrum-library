import type { BookDraft, BookFields } from './book';

type BookErrors = Partial<Record<keyof BookFields, string>>;

const collator = new Intl.Collator('en', { sensitivity: 'variant' });
// eslint-disable-next-line no-control-regex -- XML 1.0 explicitly permits tab, LF and CR.
const invalidXmlCharacter = /[^\u0009\u000a\u000d\u0020-\ud7ff\ue000-\ufffd\u{10000}-\u{10ffff}]/u;

export function validateBook(book: BookDraft): BookErrors {
  const errors: BookErrors = {};

  for (const field of ['title', 'author'] as const) {
    if (!book[field].trim()) {
      errors[field] = `${field === 'title' ? 'Title' : 'Author'} is required.`;
    } else if (invalidXmlCharacter.test(book[field])) {
      errors[field] =
        `${field === 'title' ? 'Title' : 'Author'} contains a character that XML cannot store.`;
    }
  }

  if (book.pages === null || !Number.isSafeInteger(book.pages) || book.pages <= 0) {
    errors.pages = 'Enter a positive whole number of pages.';
  }

  return errors;
}

export function normalizeBook(book: BookFields): BookFields {
  const firstError = Object.values(validateBook(book))[0];
  if (firstError) {
    throw new Error(firstError);
  }

  return { title: book.title.trim(), author: book.author.trim(), pages: book.pages };
}

function compareBooks(a: BookFields, b: BookFields): number {
  return collator.compare(a.author, b.author) || collator.compare(a.title, b.title);
}

export function sortBooks<T extends BookFields>(books: readonly T[]): T[] {
  return [...books].sort(compareBooks);
}

export function filterBooks<T extends BookFields>(books: readonly T[], query: string): T[] {
  const search = query.trim().toLowerCase();
  return books.filter((book) => book.title.toLowerCase().includes(search));
}

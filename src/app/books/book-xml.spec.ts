import { describe, expect, it } from 'vitest';
import type { Book } from './book';
import { parseLibraryXml, serializeLibraryXml } from './book-xml';

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<library>
  <book><title>The Ugly Duckling</title><author>Andersen</author><pages>32</pages></book>
  <book><pages>432</pages><title>The Green Mile</title><author>King</author></book>
  <book><title>The Little Mermaid</title><author>Andersen</author><pages>48</pages></book>
</library>`;

const bookXml = '<book><title>A</title><author>B</author><pages>2</pages></book>';
const libraryXml = (content: string) => `<library>${content}</library>`;
const invalidCases: [string, string, RegExp][] = [
  ['wrong root', '<books/>', /root element must be library/],
  [
    'missing field',
    libraryXml('<book><title>A</title><pages>2</pages></book>'),
    /Book 1: author is required/,
  ],
  [
    'duplicate field',
    libraryXml(bookXml.replace('</book>', '<title>C</title></book>')),
    /Book 1: title must occur exactly once/,
  ],
  [
    'unknown field',
    libraryXml(bookXml.replace('</book>', '<publisher>C</publisher></book>')),
    /Book 1: publisher is not a supported field/,
  ],
  [
    'attributes',
    libraryXml(bookXml.replace('<book>', '<book id="1">')),
    /attributes and namespaces are not supported/,
  ],
  [
    'namespace',
    `<library xmlns="urn:books">${bookXml}</library>`,
    /attributes and namespaces are not supported/,
  ],
  [
    'nested content',
    libraryXml(bookXml.replace('>A</title>', '><b>A</b></title>')),
    /Book 1: title must contain text only/,
  ],
  ['DTD', `<!DOCTYPE library>${libraryXml(bookXml)}`, /document types \(DTD\) are not supported/],
  [
    'non-positive pages',
    libraryXml(bookXml.replace('<pages>2</pages>', '<pages>0</pages>')),
    /Book 1: pages:/,
  ],
  [
    'non-decimal pages',
    libraryXml(bookXml.replace('<pages>2</pages>', '<pages>+2</pages>')),
    /pages must contain decimal digits only/,
  ],
];

describe('library XML', () => {
  it('reads the sample books in file order and accepts an empty library', () => {
    expect(parseLibraryXml(sampleXml)).toEqual([
      { title: 'The Ugly Duckling', author: 'Andersen', pages: 32 },
      { title: 'The Green Mile', author: 'King', pages: 432 },
      { title: 'The Little Mermaid', author: 'Andersen', pages: 48 },
    ]);
    expect(parseLibraryXml('<library/>')).toEqual([]);
  });

  it('writes UTF-8 XML in book and field order without internal IDs', () => {
    const books: Book[] = [
      { id: 9, title: 'Second', author: 'B', pages: 2 },
      { id: 4, title: 'First', author: 'A', pages: 1 },
    ];
    const xml = serializeLibraryXml(books);

    expect(xml).toMatch(/^<\?xml version="1\.0" encoding="UTF-8"\?>/);
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    expect(document.documentElement.tagName).toBe('library');
    const records = Array.from(document.documentElement.children);
    expect(records.map((record) => record.tagName)).toEqual(['book', 'book']);
    expect(records.map((record) => Array.from(record.children, (field) => field.tagName))).toEqual([
      ['title', 'author', 'pages'],
      ['title', 'author', 'pages'],
    ]);
    expect(records.map((record) => record.querySelector('title')?.textContent)).toEqual([
      'Second',
      'First',
    ]);
    expect(document.querySelectorAll('id, [id]')).toHaveLength(0);
  });

  it('round-trips Unicode, XML punctuation, line feeds and carriage returns', () => {
    const book = {
      title: 'Book 📚 & <River> "East"\nLine\rReturn',
      author: 'Óscar & İpek',
      pages: 8,
    };

    const xml = serializeLibraryXml([book]);
    expect(xml).toContain('&amp;');
    expect(xml).toContain('&lt;');
    expect(xml).toContain('&#13;');
    expect(parseLibraryXml(xml)).toEqual([book]);
  });

  it.each(invalidCases)('rejects %s', (_case, xml, message) => {
    expect(() => parseLibraryXml(xml)).toThrow(message);
  });

  it('does not return earlier books when a later record is invalid', () => {
    const xml = libraryXml(
      bookXml + '<book><title>Bad</title><author>B</author><pages>0</pages></book>',
    );

    expect(() => parseLibraryXml(xml)).toThrow(/Book 2: pages:/);
  });
});

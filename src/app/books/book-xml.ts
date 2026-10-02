import type { BookFields } from './book';
import { normalizeBook, validateBook } from './book-rules';

const fieldNames = ['title', 'author', 'pages'] as const satisfies readonly (keyof BookFields)[];

export function parseLibraryXml(xml: string): BookFields[] {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.getElementsByTagName('parsererror').length) {
    throw new Error('The file is not valid XML. Check that every element is properly closed.');
  }

  // DOMParser does not retain the declaration as a node, so inspect only its encoding.
  const declaration = /^\uFEFF?<\?xml\s+[^?]*\?>/.exec(xml)?.[0];
  const encoding = /\bencoding\s*=\s*(['"])([^'"]+)\1/.exec(declaration ?? '')?.[2];
  if (encoding && encoding.toUpperCase() !== 'UTF-8') {
    throw new Error('Unsupported encoding. Save the XML file as UTF-8.');
  }

  if (document.doctype) {
    throw new Error('XML document types (DTD) are not supported.');
  }
  const roots = elementChildren(document, 'Library');
  const root = roots[0];
  if (roots.length !== 1 || !root || root.tagName !== 'library') {
    throw new Error('The XML root element must be library.');
  }
  requirePlainElement(root, 'Library');

  return elementChildren(root, 'Library').map((element, index) => readBook(element, index + 1));
}

export function serializeLibraryXml(books: readonly BookFields[]): string {
  const normalized = books.map(normalizeBook);
  const document = window.document.implementation.createDocument(null, 'library');
  for (const book of normalized) {
    const record = document.createElement('book');
    for (const name of fieldNames) {
      const field = document.createElement(name);
      field.appendChild(document.createTextNode(String(book[name])));
      record.appendChild(field);
    }
    document.documentElement.appendChild(record);
  }

  // Literal carriage returns are normalized by XML parsers; references preserve the saved text.
  const content = new XMLSerializer().serializeToString(document).replace(/\r/g, '&#13;');
  return `<?xml version="1.0" encoding="UTF-8"?>\n${content}`;
}

function readBook(element: Element, number: number): BookFields {
  const context = `Book ${number}`;
  if (element.tagName !== 'book') {
    throw new Error(`${context}: expected book, found ${element.tagName}.`);
  }
  requirePlainElement(element, `${context}: book`);

  const fields = new Map<string, string>();
  for (const field of elementChildren(element, `${context}: book`)) {
    const name = field.tagName;
    if (!fieldNames.some((expected) => expected === name)) {
      throw new Error(`${context}: ${name} is not a supported field.`);
    }
    requirePlainElement(field, `${context}: ${name}`);
    if (fields.has(name)) {
      throw new Error(`${context}: ${name} must occur exactly once.`);
    }
    for (const child of field.childNodes) {
      if (child.nodeType !== Node.TEXT_NODE && child.nodeType !== Node.CDATA_SECTION_NODE) {
        throw new Error(`${context}: ${name} must contain text only.`);
      }
    }
    fields.set(name, field.textContent ?? '');
  }

  const title = requiredText(fields, 'title', context);
  const author = requiredText(fields, 'author', context);
  const pages = requiredText(fields, 'pages', context).trim();
  if (!/^[0-9]+$/.test(pages)) {
    throw new Error(`${context}: pages must contain decimal digits only.`);
  }
  const book: BookFields = {
    title,
    author,
    pages: Number(pages),
  };
  const firstError = Object.entries(validateBook(book))[0];
  if (firstError) {
    throw new Error(`${context}: ${firstError[0]}: ${firstError[1]}`);
  }
  return normalizeBook(book);
}

function requiredText(
  fields: ReadonlyMap<string, string>,
  name: keyof BookFields,
  context: string,
): string {
  const value = fields.get(name);
  if (value === undefined) {
    throw new Error(`${context}: ${name} is required.`);
  }
  return value;
}

function requirePlainElement(element: Element, context: string): void {
  if (element.attributes.length || element.namespaceURI || element.prefix) {
    throw new Error(`${context}: attributes and namespaces are not supported.`);
  }
}

function elementChildren(parent: Node, context: string): Element[] {
  const elements: Element[] = [];
  for (const child of parent.childNodes) {
    if (child.nodeType === Node.ELEMENT_NODE) {
      elements.push(child as Element);
    } else if (
      child.nodeType !== Node.COMMENT_NODE &&
      !(child.nodeType === Node.TEXT_NODE && /^[\t\n\r ]*$/.test(child.textContent ?? ''))
    ) {
      throw new Error(
        `${context}: only elements, comments, and formatting whitespace are allowed here.`,
      );
    }
  }
  return elements;
}

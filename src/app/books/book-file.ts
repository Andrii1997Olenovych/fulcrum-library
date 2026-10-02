import type { BookFields } from './book';
import { parseLibraryXml, serializeLibraryXml } from './book-xml';

const DOWNLOAD_URL_REVOKE_DELAY_MS = 1000;

export async function readLibraryFile(file: File): Promise<BookFields[]> {
  const bytes = await file.arrayBuffer();
  let xml: string;
  try {
    xml = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('The file is not valid UTF-8. Save it as UTF-8 and try again.');
  }
  return parseLibraryXml(xml);
}

export function downloadLibraryFile(books: readonly BookFields[]): void {
  const xml = serializeLibraryXml(books);
  const url = URL.createObjectURL(new Blob([xml], { type: 'application/xml;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'library.xml';
  document.body.appendChild(link);
  try {
    link.click();
  } finally {
    link.remove();
    const revoke = URL.revokeObjectURL.bind(URL);
    // Keep the object URL alive while the browser starts the download.
    setTimeout(() => revoke(url), DOWNLOAD_URL_REVOKE_DELAY_MS);
  }
}

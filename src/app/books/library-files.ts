import { Injectable } from '@angular/core';
import type { BookFields } from './book';
import { downloadLibraryFile, readLibraryFile } from './book-file';

@Injectable({ providedIn: 'root' })
export class LibraryFiles {
  read(file: File): Promise<BookFields[]> {
    return readLibraryFile(file);
  }

  startDownload(books: readonly BookFields[]): void {
    downloadLibraryFile(books);
  }
}

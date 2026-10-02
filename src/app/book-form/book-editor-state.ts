import type { Book } from '../books/book';

export interface BookEditorState {
  readonly open: boolean;
  readonly book: Book | null;
}

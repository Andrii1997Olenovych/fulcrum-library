export interface BookDraft {
  readonly title: string;
  readonly author: string;
  readonly pages: number | null;
}

export interface BookFields extends BookDraft {
  readonly pages: number;
}

export interface Book extends BookFields {
  readonly id: number;
}

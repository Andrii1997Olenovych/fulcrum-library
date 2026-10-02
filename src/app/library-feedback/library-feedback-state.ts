export type LibraryFeedbackState =
  | { readonly kind: 'success'; readonly message: string }
  | { readonly kind: 'error'; readonly message: string }
  | null;

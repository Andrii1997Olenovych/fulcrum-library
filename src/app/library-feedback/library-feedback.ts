import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import type { LibraryFeedbackState } from './library-feedback-state';

@Component({
  selector: 'app-library-feedback',
  templateUrl: './library-feedback.html',
  styleUrl: './library-feedback.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryFeedback {
  readonly state = input<LibraryFeedbackState>(null);
}

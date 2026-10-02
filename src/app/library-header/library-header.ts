import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-library-header',
  templateUrl: './library-header.html',
  styleUrl: './library-header.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryHeader {
  readonly importing = input(false);
  readonly empty = input(true);
  readonly fileSelected = output<File>();
  readonly exportRequested = output<void>();

  protected selectFile(input: HTMLInputElement): void {
    if (this.importing()) return;
    const file = input.files?.[0];
    input.value = '';
    if (file) this.fileSelected.emit(file);
  }
}

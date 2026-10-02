import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-library-shell',
  templateUrl: './library-shell.html',
  styleUrl: './library-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LibraryShell {}

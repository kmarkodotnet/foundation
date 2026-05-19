import { Component, output, input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'gm-file-upload',
  imports: [MatButtonModule, MatIconModule, MatProgressBarModule],
  template: `
    <div class="gm-file-upload">
      <button mat-stroked-button type="button" (click)="fileInput.click()">
        <mat-icon>upload_file</mat-icon>
        {{ label() }}
      </button>
      <input
        #fileInput
        type="file"
        [accept]="accept()"
        [multiple]="multiple()"
        style="display:none"
        (change)="onFileSelected($event)"
      />
      @if (uploading()) {
        <mat-progress-bar mode="indeterminate" />
      }
    </div>
  `,
  styles: [`
    .gm-file-upload {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
  `],
})
export class FileUploadComponent {
  readonly label = input('Fájl feltöltése');
  readonly accept = input('.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png');
  readonly multiple = input(false);
  readonly uploading = input(false);

  readonly filesSelected = output<File[]>();

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.length) {
      this.filesSelected.emit(Array.from(input.files));
      input.value = '';
    }
  }
}

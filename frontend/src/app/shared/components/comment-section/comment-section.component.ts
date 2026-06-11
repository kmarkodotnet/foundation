import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnInit,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { filter } from 'rxjs';
import { AuthService } from '../../../core/auth/auth.service';
import { CommentDto } from '../../../features/applications/models/application.model';
import { CommentService } from '../../../features/applications/services/comment.service';
import {
  ConfirmDialogComponent,
  ConfirmDialogData,
} from '../confirm-dialog/confirm-dialog.component';
import { DateHuPipe } from '../../pipes/date-hu.pipe';

@Component({
  selector: 'gm-comment-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    DateHuPipe,
  ],
  templateUrl: './comment-section.component.html',
  styleUrl: './comment-section.component.scss',
})
export class CommentSectionComponent implements OnInit {
  readonly appId = input.required<string>();
  readonly stepId = input<string | undefined>(undefined);
  readonly isLocked = input(false);

  private readonly commentService = inject(CommentService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialog = inject(MatDialog);
  private readonly cdr = inject(ChangeDetectorRef);

  readonly loading = signal(true);
  readonly sending = signal(false);
  readonly showAddForm = signal(false);
  readonly editingCommentId = signal<string | null>(null);
  readonly comments = signal<CommentDto[]>([]);

  readonly newCommentControl = new FormControl<string>('', [
    Validators.required,
    Validators.maxLength(2000),
  ]);

  readonly editControl = new FormControl<string>('', [
    Validators.required,
    Validators.maxLength(2000),
  ]);

  readonly currentUserId = computed(() => this.authService.currentUser()?.userId ?? '');
  readonly isAdmin = computed(() => this.authService.currentUser()?.role === 'Admin');
  readonly canWrite = computed(() => {
    const role = this.authService.currentUser()?.role;
    return role != null && role !== 'Megtekinto';
  });

  canModifyComment(comment: CommentDto): boolean {
    return comment.authorId === this.currentUserId() || this.isAdmin();
  }

  ngOnInit(): void {
    this.loadComments();
  }

  toggleAddForm(): void {
    this.showAddForm.update((v) => !v);
    if (!this.showAddForm()) {
      this.newCommentControl.reset();
    }
    this.cdr.markForCheck();
  }

  submitComment(): void {
    if (this.newCommentControl.invalid || this.sending()) return;
    this.sending.set(true);

    this.commentService
      .addComment(this.appId(), {
        body: this.newCommentControl.value!,
        workflowStepId: this.stepId(),
      })
      .subscribe({
        next: (comment) => {
          this.sending.set(false);
          this.comments.update((list) => [...list, comment]);
          this.newCommentControl.reset();
          this.showAddForm.set(false);
          this.cdr.markForCheck();
        },
        error: () => {
          this.sending.set(false);
          this.snackBar.open('Nem sikerült elküldeni a megjegyzést.', 'Bezár', {
            duration: 5000,
            panelClass: ['gm-snack-error'],
          });
          this.cdr.markForCheck();
        },
      });
  }

  startEdit(comment: CommentDto): void {
    this.editingCommentId.set(comment.id);
    this.editControl.setValue(comment.body);
    this.cdr.markForCheck();
  }

  cancelEdit(): void {
    this.editingCommentId.set(null);
    this.editControl.reset();
    this.cdr.markForCheck();
  }

  submitEdit(comment: CommentDto): void {
    if (this.editControl.invalid) return;
    this.commentService
      .updateComment(this.appId(), comment.id, this.editControl.value!)
      .subscribe({
        next: (updated) => {
          this.comments.update((list) =>
            list.map((c) => (c.id === updated.id ? updated : c))
          );
          this.editingCommentId.set(null);
          this.editControl.reset();
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackBar.open('Nem sikerült frissíteni a megjegyzést.', 'Bezár', {
            duration: 5000,
            panelClass: ['gm-snack-error'],
          });
          this.cdr.markForCheck();
        },
      });
  }

  confirmDelete(comment: CommentDto): void {
    const ref = this.dialog.open<ConfirmDialogComponent, ConfirmDialogData, boolean>(
      ConfirmDialogComponent,
      {
        data: {
          title: 'Megjegyzés törlése',
          message: 'Biztosan törölni szeretnéd ezt a megjegyzést?',
          confirmLabel: 'Törlés',
          cancelLabel: 'Mégsem',
        },
      }
    );

    ref.afterClosed().pipe(filter(Boolean)).subscribe(() => {
      this.commentService.deleteComment(this.appId(), comment.id).subscribe({
        next: () => {
          this.comments.update((list) =>
            list.map((c) =>
              c.id === comment.id
                ? { ...c, isDeleted: true, body: '[Megjegyzés törölve]' }
                : c
            )
          );
          this.cdr.markForCheck();
        },
        error: () => {
          this.snackBar.open('Nem sikerült törölni a megjegyzést.', 'Bezár', {
            duration: 5000,
            panelClass: ['gm-snack-error'],
          });
          this.cdr.markForCheck();
        },
      });
    });
  }

  private loadComments(): void {
    this.commentService.getComments(this.appId(), this.stepId()).subscribe({
      next: (list) => {
        this.comments.set(list);
        this.loading.set(false);
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading.set(false);
        this.snackBar.open('Nem sikerült betölteni a megjegyzéseket.', 'Bezár', {
          duration: 5000,
          panelClass: ['gm-snack-error'],
        });
        this.cdr.markForCheck();
      },
    });
  }
}

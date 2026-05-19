import { Component, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { DateHuPipe } from '../../pipes/date-hu.pipe';

export interface CommentItem {
  id: string;
  text: string;
  createdByName: string;
  createdAt: string;
  isOwn: boolean;
}

@Component({
  selector: 'gm-comment-thread',
  imports: [FormsModule, MatButtonModule, MatFormFieldModule, MatIconModule, MatInputModule, DateHuPipe],
  template: `
    <div class="gm-comments">
      @for (comment of comments(); track comment.id) {
        <div class="gm-comment">
          <div class="gm-comment-header">
            <strong>{{ comment.createdByName }}</strong>
            <span class="gm-comment-date">{{ comment.createdAt | dateHu: 'datetime' }}</span>
            @if (comment.isOwn) {
              <button mat-icon-button (click)="deleteComment.emit(comment.id)">
                <mat-icon>delete</mat-icon>
              </button>
            }
          </div>
          <p>{{ comment.text }}</p>
        </div>
      } @empty {
        <p class="gm-empty-comments">Még nincs megjegyzés.</p>
      }

      <mat-form-field appearance="outline" style="width:100%">
        <mat-label>Új megjegyzés</mat-label>
        <textarea matInput [(ngModel)]="newCommentText" rows="3"></textarea>
      </mat-form-field>
      <button mat-flat-button color="primary" [disabled]="!newCommentText.trim()" (click)="submitComment()">
        Hozzáadás
      </button>
    </div>
  `,
  styles: [`
    .gm-comment {
      border-left: 3px solid #e0e0e0;
      padding: 8px 12px;
      margin-bottom: 12px;
    }
    .gm-comment-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4px;
    }
    .gm-comment-date {
      color: rgba(0,0,0,0.54);
      font-size: 12px;
    }
    .gm-empty-comments {
      color: rgba(0,0,0,0.54);
    }
  `],
})
export class CommentThreadComponent {
  readonly comments = input<CommentItem[]>([]);

  readonly addComment = output<string>();
  readonly deleteComment = output<string>();

  newCommentText = '';

  submitComment(): void {
    const text = this.newCommentText.trim();
    if (text) {
      this.addComment.emit(text);
      this.newCommentText = '';
    }
  }
}

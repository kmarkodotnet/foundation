import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GranterService } from '../services/granter.service';
import { Granter } from '../models/granter.model';
import { HasRoleDirective } from '../../../shared/directives/has-role.directive';

@Component({
  selector: 'gm-granter-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    MatButtonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatTooltipModule,
    HasRoleDirective,
  ],
  templateUrl: './granter-list.component.html',
})
export class GranterListComponent implements OnInit {
  private readonly service = inject(GranterService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly granters = signal<Granter[]>([]);
  readonly columns = ['name', 'email', 'phoneNumber', 'status', 'actions'];

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.service.getAll().subscribe({
      next: (data) => { this.granters.set(data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  openDetail(id: string): void {
    this.router.navigate(['/granters', id]);
  }
}

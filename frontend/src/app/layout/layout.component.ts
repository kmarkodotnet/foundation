import { Component, OnInit, inject, viewChild, signal } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { MatSidenavModule, MatSidenav } from '@angular/material/sidenav';
import { BreakpointObserver } from '@angular/cdk/layout';
import { filter } from 'rxjs';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NotificationService } from '../core/notifications/notification.service';

@Component({
  selector: 'gm-layout',
  imports: [RouterOutlet, MatSidenavModule, NavbarComponent, SidebarComponent],
  template: `
    <mat-sidenav-container class="gm-sidenav-container">
      <mat-sidenav
        #sidenav
        [mode]="isMobile() ? 'over' : 'side'"
        [opened]="!isMobile()"
        class="gm-sidenav"
      >
        <gm-sidebar />
      </mat-sidenav>
      <mat-sidenav-content class="gm-main-content">
        <gm-navbar [isMobile]="isMobile()" (menuToggle)="sidenav.toggle()" />
        <main class="gm-page-container">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .gm-sidenav-container { height: 100vh; }
    .gm-sidenav { width: 240px; }
    .gm-main-content { display: flex; flex-direction: column; }
  `],
})
export class LayoutComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly router = inject(Router);

  private readonly sidenavRef = viewChild.required<MatSidenav>('sidenav');
  readonly isMobile = signal(false);

  constructor() {
    this.breakpointObserver.observe('(max-width: 959px)').subscribe(result => {
      this.isMobile.set(result.matches);
    });
  }

  ngOnInit(): void {
    this.notificationService.loadNotifications().subscribe();
    this.notificationService.startConnection();

    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
    ).subscribe(() => {
      if (this.isMobile()) this.sidenavRef().close();
    });
  }
}

import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { NavbarComponent } from './navbar/navbar.component';
import { SidebarComponent } from './sidebar/sidebar.component';
import { NotificationService } from '../core/notifications/notification.service';

@Component({
  selector: 'gm-layout',
  imports: [RouterOutlet, MatSidenavModule, NavbarComponent, SidebarComponent],
  template: `
    <mat-sidenav-container class="gm-sidenav-container">
      <mat-sidenav mode="side" opened class="gm-sidenav">
        <gm-sidebar />
      </mat-sidenav>
      <mat-sidenav-content class="gm-main-content">
        <gm-navbar />
        <main class="gm-page-container">
          <router-outlet />
        </main>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .gm-sidenav-container {
      height: 100vh;
    }
    .gm-sidenav {
      width: 240px;
    }
    .gm-main-content {
      display: flex;
      flex-direction: column;
    }
  `],
})
export class LayoutComponent implements OnInit {
  private readonly notificationService = inject(NotificationService);

  ngOnInit(): void {
    this.notificationService.loadNotifications().subscribe();
    this.notificationService.startConnection();
  }
}

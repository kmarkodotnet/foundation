export interface PlatformSettings {
  maxFileSizeMb: number;
  invitationExpiryHours: number;
  defaultDeadlineNotificationDays: number;
}

export interface UpdatePlatformSettingsRequest {
  maxFileSizeMb: number;
  invitationExpiryHours: number;
  defaultDeadlineNotificationDays: number;
}

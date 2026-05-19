export interface NotificationPreferencesDto {
  emailOnDeadlineApproaching: boolean;
  emailOnDeadlineMissed: boolean;
  emailOnResultRecorded: boolean;
  emailOnApprovalRequired: boolean;
  emailOnNewComment: boolean;
  emailOnDocumentUploaded: boolean;
}

export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  pictureUrl?: string;
  role: string;
  lastLoginAt?: string;
  notificationPreferences?: NotificationPreferencesDto;
}

export interface AuthResultDto {
  accessToken: string;
  expiresIn: number;
  user: UserProfileDto;
}

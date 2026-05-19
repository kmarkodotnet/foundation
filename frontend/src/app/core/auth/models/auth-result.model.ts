export interface UserProfileDto {
  id: string;
  email: string;
  fullName: string;
  pictureUrl?: string;
  role: string;
  lastLoginAt?: string;
}

export interface AuthResultDto {
  accessToken: string;
  expiresIn: number;
  user: UserProfileDto;
}

export type UserRole =
  | 'Admin'
  | 'Elnok'
  | 'PalyazatiMunkatars'
  | 'Penzugyes'
  | 'Megtekinto';

export interface CurrentUser {
  userId: string;
  email: string;
  name: string;
  role: UserRole;
}

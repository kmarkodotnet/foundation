export interface FoundationDashboardItem {
  id: string;
  name: string;
  inProgress: number;
  won: number;
  lost: number;
  submitted: number;
  wonAmount: number;
}

export interface OwnerDashboardResponse {
  totalWonAmount: number;
  totalUnaccounted: number;
  foundations: FoundationDashboardItem[];
}

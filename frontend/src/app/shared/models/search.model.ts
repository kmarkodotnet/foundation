export interface SearchResultItem {
  id: string;
  displayName: string;
  status: string | null;
  entityType: 'Application' | 'Granter' | 'Vendor';
}

export interface GlobalSearchResult {
  applications: SearchResultItem[];
  granters: SearchResultItem[];
  vendors: SearchResultItem[];
}

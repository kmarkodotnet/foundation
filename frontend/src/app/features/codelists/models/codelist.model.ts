export interface CodeList {
  id: string;
  code: string;
  name: string;
  isSystem: boolean;
  items: CodeListItem[];
}

export interface CodeListItem {
  id: string;
  codeListId: string;
  name: string;
  value: string;
  order: number;
  isActive: boolean;
}

export interface CreateCodeListItemRequest {
  name: string;
  value: string;
  order?: number;
}

export interface UpdateCodeListItemRequest {
  name: string;
  value: string;
  order?: number;
  isActive: boolean;
}

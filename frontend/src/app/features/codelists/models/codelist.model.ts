export interface CodeListDto {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CodeListItemDto {
  id: string;
  codeListId: string;
  code: string;
  name: string;
  description: string | null;
  order: number;
  status: 'Active' | 'Inactive';
}

export interface CreateCodeListRequest {
  name: string;
  description?: string | null;
}

export interface CreateCodeListItemRequest {
  code: string;
  name: string;
  description?: string | null;
}

export interface UpdateCodeListItemRequest {
  code: string;
  name: string;
  description?: string | null;
}

export interface CodeListTemplate {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
  itemCount: number;
}

export interface CodeListTemplateItem {
  id: string;
  value: string;
  label: string;
  order: number;
}

export interface AddTemplateItemRequest {
  value: string;
  label: string;
  order: number;
}

export interface UpdateTemplateItemRequest {
  value: string;
  label: string;
  order: number;
}

export interface ApplyToFoundationRequest {
  foundationId: string;
}

export interface ApplyToFoundationResponse {
  addedCount: number;
}

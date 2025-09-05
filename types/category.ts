export enum CategoryType {
  STEAM = 'steam',
  GAMES = 'games',
  SUBSCRIPTION = 'subscription'
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  type: CategoryType;
  logo: {
    secure_url: string;
    public_id: string;
  };
  createdBy: string;
  folderId: string;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryResponse {
  success: boolean;
  data: Category[];
  message?: string;
}

export interface SingleCategoryResponse {
  success: boolean;
  data: Category;
  message?: string;
}
export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  COMPLETED = 'completed',
}

export interface Restaurant {
  id: string;
  name: string;
  logoUrl?: string;
  primaryColor: string; // e.g. #FF6B00
  accentColor?: string;
  googleReviewLink?: string;
  suggestedReviews?: string[];
  adminUids: string[];
  language?: 'en' | 'mr';
}

export interface Category {
  id: string;
  name: string;
  imageUrl?: string;
  order: number;
}

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  price: number;
  imageUrl?: string;
  images?: string[];
  arModelUrl?: string;
  categoryId: string;
  isVeg: boolean;
  isBestseller: boolean;
  isTrending?: boolean;
  rating?: number;
  calories?: number;
  preparationTime?: number;
  ingredients?: string[];
  recommendations?: string[]; // IDs of other menu items
}

export interface Banner {
  id: string;
  imageUrl: string;
  title?: string;
  subtitle?: string;
  ctaLink?: string;
  order: number;
}

export interface Offer {
  id: string;
  imageUrl: string;
  title: string;
  discountCode?: string;
  discountPercentage?: number;
  description?: string;
  expiryDate?: string;
  order: number;
}

export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  tableNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: OrderStatus;
  createdAt: any; // Firestore server timestamp
  notes?: string;
  customerId?: string;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

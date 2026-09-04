export interface User {
  id: string;
  email: string;
  phone: string | null;
  name: string | null;
  profileImage: string | null;
  providers: string[];
  emailVerified: boolean;
  phoneVerified: boolean;
  hasPassword: boolean;
  role: 'customer' | 'admin';
  status: 'active' | 'disabled' | 'deleted';
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  count?: number;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  images?: string[];
  rating: number;
  ratingCount: number;
  isVeg: boolean;
  categoryId: string;
  categoryName?: string;
  prepTime?: string;
  tags?: string[];
  isPopular?: boolean;
  isRecommended?: boolean;
  customizations?: ProductCustomization[];
}

export interface ProductCustomization {
  id: string;
  name: string;
  type: 'single' | 'multi';
  required?: boolean;
  options: { id: string; name: string; price: number }[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  customizations?: Record<string, string[]>;
  note?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'online';
  address?: Address;
  createdAt: string;
  estimatedDelivery?: string;
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  address: string;
  details?: string;
  lat?: number;
  lng?: number;
}

export interface Restaurant {
  id: string;
  name: string;
  image: string;
  logo: string;
  rating: number;
  ratingCount: number;
  deliveryTime: string;
  priceForTwo: number;
  cuisines: string[];
  about: string;
  createdAt?: string;
}

export interface Offer {
  id: string;
  title: string;
  subtitle: string;
  code: string;
  colors: string[];
  emoji: string;
  tag: string;
  active: boolean;
  createdAt?: string;
}

export interface HomeData {
  restaurant: Restaurant;
  categories: Category[];
  products: {
    popular: Product[];
    recommended: Product[];
    all: Product[];
  };
  offers: Offer[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  error: { code: string; details?: any };
}

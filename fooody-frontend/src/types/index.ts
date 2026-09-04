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
  userId?: string;
  label: 'Home' | 'Work' | 'Other';
  customLabel?: string;
  address: string;
  fullAddress?: string;
  houseFlat?: string;
  floor?: string;
  landmark?: string;
  area?: string;
  city?: string;
  state?: string;
  pincode?: string;
  details?: string;
  lat?: number;
  lng?: number;
  isDefault?: boolean;
  receiverName?: string;
  receiverPhone?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReverseGeocodeResult {
  displayName: string;
  formattedAddress: string;
  houseNumber: string;
  road: string;
  neighbourhood: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  lat: number;
  lng: number;
}

export interface GeocodeSearchResult {
  displayName: string;
  lat: number;
  lng: number;
  city: string;
  postcode: string;
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

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  createdAt: string;
  product?: Product | null;
}

export interface AppNotification {
  id: string;
  userId: string | null;
  title: string;
  body: string;
  type: 'promo' | 'order' | 'system' | 'support' | 'general';
  data?: Record<string, any>;
  read: boolean;
  readAt?: string | null;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  subject: string;
  description: string;
  category: 'order' | 'payment' | 'delivery' | 'general' | 'account' | 'other';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
  updatedAt: string;
  messages: { by: 'user' | 'admin'; byId: string; byName: string | null; message: string; at: string }[];
  orderId?: string | null;
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

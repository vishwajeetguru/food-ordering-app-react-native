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
  createdAt?: string;
  active?: boolean;
  displayOrder?: number;
  description?: string;
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
  available?: boolean;
  featured?: boolean;
  calories?: number;
  ingredients?: string[];
  allergens?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  status: 'pending' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'online';
  address?: any;
  createdAt: string;
  updatedAt: string;
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
  address?: string;
  phone?: string;
  email?: string;
  openingHours?: string;
  closingHours?: string;
  isOpen?: boolean;
  deliveryCharge?: number;
  minOrderAmount?: number;
  taxRate?: number;
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
  discountType?: 'percentage' | 'fixed';
  discountValue?: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  startDate?: string;
  endDate?: string;
  usageLimit?: number;
  bannerImage?: string;
  description?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string;
  buttonText?: string;
  couponCode?: string;
  image: string;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface HomeSettings {
  banners: Banner[];
  popularLimit: number;
  popularEnabled: boolean;
  categoriesEnabled: boolean;
  featuredIds?: string[];
  updatedAt?: string;
}

export interface RestaurantSettings extends Restaurant {
  updatedAt?: string;
}

export interface Analytics {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalCustomers: number;
  todayOrders: number;
  todayRevenue: number;
  pendingOrders: number;
  unavailableProducts: number;
  revenueLast7Days: { date: string; revenue: number }[];
  ordersLast7Days: { date: string; count: number }[];
  recentOrders: Order[];
  popularProducts: Product[];
  lowStockProducts?: Product[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination?: { page: number; limit: number; total: number; hasMore: boolean };
}

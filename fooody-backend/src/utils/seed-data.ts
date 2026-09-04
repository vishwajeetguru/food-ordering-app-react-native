import { Product } from '../repositories/product.repository';
import { Category } from '../repositories/category.repository';
import { Restaurant } from '../repositories/restaurant.repository';
import { Offer } from '../repositories/offer.repository';

export const categorySeeds: Omit<Category, 'createdAt'>[] = [
  { id: '1', name: 'Pizza', slug: 'pizza', image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=300' },
  { id: '2', name: 'Burgers', slug: 'burger', image: 'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=300' },
  { id: '3', name: 'Biryani', slug: 'biryani', image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=300' },
  { id: '4', name: 'Chinese', slug: 'chinese', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300' },
  { id: '5', name: 'Desserts', slug: 'dessert', image: 'https://images.unsplash.com/photo-1488477181946-64290103bb53?w=300' },
  { id: '6', name: 'Beverages', slug: 'beverage', image: 'https://images.unsplash.com/photo-1544148103-082c875b3497?w=300' },
];

export const productSeeds: Omit<Product, 'createdAt' | 'updatedAt'>[] = [
  { id: 'p1', name: 'Margherita Supreme', description: 'Fresh mozzarella, basil, San Marzano tomato sauce on hand-tossed dough', price: 349, originalPrice: 399, image: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=600', rating: 4.6, ratingCount: 234, isVeg: true, categoryId: '1', categoryName: 'Pizza', prepTime: '25-30 min', isPopular: true, isRecommended: true },
  { id: 'p2', name: 'Truffle Mushroom Pizza', description: 'Wild mushrooms, truffle oil, arugula & parmesan', price: 549, image: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?w=600', rating: 4.8, ratingCount: 189, isVeg: true, categoryId: '1', categoryName: 'Pizza', prepTime: '30-35 min', isPopular: true },
  { id: 'p3', name: 'Smoky BBQ Chicken Burger', description: 'Grilled chicken, caramelized onions, BBQ mayo, cheddar', price: 299, image: 'https://images.unsplash.com/photo-1568909344668-6f14a07b56a0?w=600', rating: 4.5, ratingCount: 412, isVeg: false, categoryId: '2', categoryName: 'Burgers', prepTime: '20-25 min', isRecommended: true },
  { id: 'p4', name: 'Hyderabadi Dum Biryani', description: 'Fragrant basmati, tender chicken, saffron & fried onions', price: 449, image: 'https://images.unsplash.com/photo-1589302168068-964664d93dc0?w=600', rating: 4.7, ratingCount: 521, isVeg: false, categoryId: '3', categoryName: 'Biryani', prepTime: '30-40 min', isPopular: true },
  { id: 'p5', name: 'Hakka Noodles', description: 'Wok-tossed noodles, veggies, soy-chilli glaze', price: 249, image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=600', rating: 4.3, ratingCount: 98, isVeg: true, categoryId: '4', categoryName: 'Chinese', prepTime: '15-20 min' },
  { id: 'p6', name: 'Chocolate Fudge Brownie', description: 'Warm brownie, vanilla ice cream, fudge sauce', price: 199, image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600', rating: 4.9, ratingCount: 301, isVeg: true, categoryId: '5', categoryName: 'Desserts', prepTime: '10-15 min', isRecommended: true },
  { id: 'p7', name: 'Classic Cold Coffee', description: 'Espresso, chilled milk, vanilla & cocoa', price: 149, image: 'https://images.unsplash.com/photo-1461023058943-07be777315da?w=600', rating: 4.4, ratingCount: 210, isVeg: true, categoryId: '6', categoryName: 'Beverages', prepTime: '5-10 min' },
  { id: 'p8', name: 'Paneer Tikka Masala Pizza', description: 'Tandoori paneer, capsicum, onions, makhani sauce', price: 429, image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600', rating: 4.6, ratingCount: 167, isVeg: true, categoryId: '1', categoryName: 'Pizza', prepTime: '25-30 min' },
];

export const restaurantSeed: Omit<Restaurant, 'createdAt'> = {
  id: 'default',
  name: 'Foody House',
  image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1200',
  logo: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=300',
  rating: 4.8,
  ratingCount: 1240,
  deliveryTime: '25-35 min',
  priceForTwo: 600,
  cuisines: ['Italian', 'North Indian', 'Chinese'],
  about: 'Foody House serves wood-fired pizzas, authentic biryanis and comforting classics with premium ingredients and warm hospitality.',
};

export const offerSeeds: Omit<Offer, 'createdAt'>[] = [
  { id: 'o1', title: 'FLAT 20% OFF', subtitle: 'on orders above ₹499', code: 'FOODY20', colors: ['#FF5A3D', '#E94A2E'], emoji: '🍕', tag: 'Most loved', active: true },
  { id: 'o2', title: 'FREE DELIVERY', subtitle: 'on your first order', code: 'FREESHIP', colors: ['#16A34A', '#0E7A36'], emoji: '🛵', tag: 'New users', active: true },
  { id: 'o3', title: '₹100 CASHBACK', subtitle: 'on orders above ₹300', code: 'CASH100', colors: ['#7C3AED', '#5B21B6'], emoji: '💸', tag: 'Limited', active: true },
  { id: 'o4', title: 'BUY 1 GET 1', subtitle: 'on select desserts', code: 'SWEETBOGO', colors: ['#FFB020', '#E89E0A'], emoji: '🍰', tag: 'Weekend', active: true },
  { id: 'o5', title: '30% OFF', subtitle: 'on your next biryani', code: 'BIRYANI30', colors: ['#0284C7', '#0369A1'], emoji: '🍛', tag: 'Combo', active: true },
];

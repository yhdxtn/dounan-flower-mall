import { createRouter, createWebHistory } from 'vue-router';
import ShopView from './views/ShopView.vue';
import CartView from './views/CartView.vue';
import OrdersView from './views/OrdersView.vue';
import AdminView from './views/AdminView.vue';
import LoginView from './views/LoginView.vue';
import ProductDetailView from './views/ProductDetailView.vue';
import StaticPageView from './views/StaticPageView.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: ShopView },
    { path: '/products/:id', component: ProductDetailView },
    { path: '/flowers', component: StaticPageView, meta: { pageType: 'flowers' } },
    { path: '/preserved', component: StaticPageView, meta: { pageType: 'preserved' } },
    { path: '/sets', component: StaticPageView, meta: { pageType: 'sets' } },
    { path: '/festival', component: StaticPageView, meta: { pageType: 'festival' } },
    { path: '/about', component: StaticPageView, meta: { pageType: 'about' } },
    { path: '/cart', component: CartView },
    { path: '/orders', component: OrdersView },
    { path: '/admin', component: AdminView },
    { path: '/login', component: LoginView }
  ]
});

router.beforeEach((to) => {
  const token = localStorage.getItem('token');
  if (['/cart', '/orders', '/admin'].includes(to.path) && !token) return '/login';
  return true;
});

export default router;

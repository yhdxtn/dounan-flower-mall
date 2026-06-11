<template>
  <div class="home-page">
    <section class="cute-hero" :style="{ backgroundImage: `url(${heroBg})` }">
      <div class="hero-content">
        <p class="hero-kicker">鲜花传情 · 爱在身边</p>
        <h1>把斗南的清晨，送到每一次心动里</h1>
        <p>精选玫瑰、百合、康乃馨与花礼套装，支持在线下单、库存同步和订单追踪。</p>
        <div class="hero-actions">
          <el-button type="primary" size="large" round @click="scrollToProducts">立即选花</el-button>
          <el-button size="large" round @click="$router.push('/login')">注册会员</el-button>
          <el-button size="large" round @click="$router.push('/cart')">查看购物车</el-button>
        </div>
      </div>

      <aside class="quick-dock">
        <button @click="scrollToProducts">
          <el-icon><Star /></el-icon>
          <span>新品推荐</span>
        </button>
        <button @click="scrollToProducts">
          <el-icon><Present /></el-icon>
          <span>优惠活动</span>
        </button>
        <button @click="scrollToProducts">
          <el-icon><MagicStick /></el-icon>
          <span>花艺课堂</span>
        </button>
        <button @click="openChat">
          <el-icon><Headset /></el-icon>
          <span>在线客服</span>
        </button>
      </aside>
    </section>

    <section class="category-ribbon">
      <button v-for="item in categoryOptions" :key="item.value || 'all'" :class="{ active: categoryId === item.value }" @click="pickCategory(item.value)">
        {{ item.label }}
      </button>
    </section>

    <section ref="productsRef" class="page product-section">
      <div class="section-head flower-head">
        <div>
          <p class="eyebrow">Doudou Selection</p>
          <h2>今日鲜花推荐</h2>
        </div>
        <div class="shop-search">
          <el-input v-model="keyword" clearable placeholder="搜索鲜花、花礼、配草" @keyup.enter="loadProducts">
            <template #append>
              <el-button :icon="Search" @click="loadProducts" />
            </template>
          </el-input>
        </div>
      </div>

      <div class="product-grid cute-product-grid">
        <el-card v-for="item in products" :key="item.id" class="product-card cute-product-card" shadow="never" :body-style="{ padding: 0 }">
          <div class="image-wrap" @click="$router.push(`/products/${item.id}`)">
            <img :src="item.cover_url" :alt="item.name" />
            <el-tag class="grade-tag" effect="dark">{{ item.grade }}</el-tag>
          </div>
          <div class="product-body">
            <div class="product-title" @click="$router.push(`/products/${item.id}`)">
              <div>
                <strong>{{ item.name }}</strong>
                <p>{{ item.origin }} / {{ item.category_name }}</p>
              </div>
              <span class="price">￥{{ item.price }}</span>
            </div>

            <p class="product-desc">{{ item.description }}</p>

            <div class="stock-line">
              <span>库存 {{ item.stock }} {{ item.unit }}</span>
              <el-progress :percentage="stockPercent(item)" :show-text="false" :stroke-width="7" />
            </div>

            <div class="card-actions">
              <el-input-number v-model="quantities[item.id]" :min="1" :max="item.stock" size="small" />
              <el-button type="primary" round :disabled="item.stock <= 0" @click="addCart(item)">加入购物车</el-button>
              <el-button round @click="$router.push(`/products/${item.id}`)">详情</el-button>
            </div>
          </div>
        </el-card>
      </div>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { Headset, MagicStick, Present, Search, Star } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { api } from '../api.js';
import heroBg from '../assets/home-bg.png';

const route = useRoute();
const categories = ref([]);
const products = ref([]);
const categoryId = ref('');
const keyword = ref('');
const quantities = ref({});
const productsRef = ref(null);
const categoryOptions = ref([{ label: '全部鲜花', value: '' }]);

function stockPercent(item) {
  const base = Math.max(Number(item.stock || 0), Number(item.warn_stock || 0) * 3, 1);
  return Math.min(100, Math.round((Number(item.stock || 0) / base) * 100));
}

function scrollToProducts() {
  productsRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function openChat() {
  window.dispatchEvent(new Event('open-chat'));
}

async function pickCategory(value) {
  categoryId.value = value;
  await loadProducts();
  scrollToProducts();
}

async function loadCategories() {
  categories.value = await api.get('/products/categories');
  categoryOptions.value = [{ label: '全部鲜花', value: '' }, ...categories.value.map((item) => ({ label: item.name, value: item.id }))];
}

async function loadProducts() {
  products.value = await api.get('/products', {
    params: {
      categoryId: categoryId.value || undefined,
      keyword: keyword.value || undefined
    }
  });
  for (const product of products.value) {
    quantities.value[product.id] = quantities.value[product.id] || 1;
  }
}

async function addCart(item) {
  await api.post('/cart', { productId: item.id, quantity: quantities.value[item.id] || 1 });
  const nextCount = Number(localStorage.getItem('cartBadge') || 0) + Number(quantities.value[item.id] || 1);
  localStorage.setItem('cartBadge', String(nextCount));
  window.dispatchEvent(new Event('cart-badge-change'));
  ElMessage.success(`${item.name} 已加入购物车`);
}

watch(
  () => route.query.keyword,
  async (value) => {
    keyword.value = value || '';
    await loadProducts();
  }
);

onMounted(async () => {
  keyword.value = route.query.keyword || '';
  await loadCategories();
  await loadProducts();
});
</script>

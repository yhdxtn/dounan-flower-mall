<template>
  <div class="page detail-page">
    <el-skeleton v-if="loading" :rows="8" animated />
    <template v-else>
      <section class="product-detail-card">
        <img :src="product.cover_url" :alt="product.name" />
        <div class="detail-info">
          <el-tag effect="dark">{{ product.category_name }}</el-tag>
          <h1>{{ product.name }}</h1>
          <p>{{ product.description }}</p>
          <div class="detail-meta">
            <span>产地：{{ product.origin }}</span>
            <span>等级：{{ product.grade }}</span>
            <span>库存：{{ product.stock }} {{ product.unit }}</span>
          </div>
          <strong class="detail-price">￥{{ product.price }}</strong>
          <div class="detail-actions">
            <el-input-number v-model="quantity" :min="1" :max="product.stock || 1" />
            <el-button type="primary" round @click="addCart">加入购物车</el-button>
            <el-button round @click="$router.push('/')">返回首页</el-button>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';
import { api } from '../api.js';

const route = useRoute();
const loading = ref(true);
const product = ref({});
const quantity = ref(1);

async function loadProduct() {
  loading.value = true;
  try {
    product.value = await api.get(`/products/${route.params.id}`);
  } finally {
    loading.value = false;
  }
}

async function addCart() {
  await api.post('/cart', { productId: product.value.id, quantity: quantity.value });
  const nextCount = Number(localStorage.getItem('cartBadge') || 0) + Number(quantity.value || 1);
  localStorage.setItem('cartBadge', String(nextCount));
  window.dispatchEvent(new Event('cart-badge-change'));
  ElMessage.success(`${product.value.name} 已加入购物车`);
}

onMounted(loadProduct);
</script>

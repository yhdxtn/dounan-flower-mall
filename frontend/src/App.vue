<template>
  <el-container class="app-shell">
    <el-header class="topbar cute-topbar">
      <router-link class="brand cute-brand" to="/">
        <img :src="logoUrl" alt="斗斗鲜花商城" />
      </router-link>

      <nav class="nav cute-nav">
        <button :class="{ active: $route.path === '/' }" @click="$router.push('/')">首页</button>
        <button :class="{ active: $route.path === '/flowers' }" @click="$router.push('/flowers')">鲜花分类</button>
        <button :class="{ active: $route.path === '/preserved' }" @click="$router.push('/preserved')">永生花</button>
        <button :class="{ active: $route.path === '/sets' }" @click="$router.push('/sets')">花礼套装</button>
        <button :class="{ active: $route.path === '/festival' }" @click="$router.push('/festival')">节日专区</button>
        <button :class="{ active: $route.path === '/about' }" @click="$router.push('/about')">关于我们</button>
        <button v-if="session.isAdmin" :class="{ active: $route.path === '/admin' }" @click="$router.push('/admin')">后台管理</button>
      </nav>

      <div class="top-actions">
        <el-input v-model="searchText" class="top-search" placeholder="搜索鲜花" clearable @keyup.enter="goSearch">
          <template #suffix>
            <el-icon @click="goSearch"><Search /></el-icon>
          </template>
        </el-input>
        <el-badge :value="cartCount" :hidden="cartCount === 0" class="cart-badge">
          <el-button class="cart-icon-btn" :icon="ShoppingCart" circle @click="$router.push('/cart')" />
        </el-badge>
        <el-dropdown v-if="session.user" trigger="click">
          <el-button class="user-pill" round>
            <el-icon><User /></el-icon>
            {{ session.user.nickname }}
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="$router.push('/orders')">我的订单</el-dropdown-item>
              <el-dropdown-item v-if="session.isAdmin" @click="$router.push('/admin')">后台管理</el-dropdown-item>
              <el-dropdown-item divided @click="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button v-else class="login-pill" round @click="$router.push('/login')">登录 / 注册</el-button>
      </div>
    </el-header>

    <el-main class="main cute-main">
      <router-view />
    </el-main>

    <footer class="site-footer">
      <p>Copyright © 2026 云南斗南花卉产业集团</p>
      <a href="https://beian.miit.gov.cn/" target="_blank" rel="noreferrer">滇ICP备12005611号</a>
    </footer>

    <ChatWidget />
  </el-container>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import { Search, ShoppingCart, User } from '@element-plus/icons-vue';
import { useSessionStore } from './store.js';
import ChatWidget from './components/ChatWidget.vue';
import logoUrl from './assets/logo.png';

const router = useRouter();
const session = useSessionStore();
const searchText = ref('');
const cartCount = ref(Number(localStorage.getItem('cartBadge') || 0));

function syncCartBadge() {
  cartCount.value = Number(localStorage.getItem('cartBadge') || 0);
}

function goSearch() {
  router.push({ path: '/', query: { keyword: searchText.value || undefined } });
}

function logout() {
  session.logout();
  router.push('/');
}

onMounted(() => window.addEventListener('cart-badge-change', syncCartBadge));
onBeforeUnmount(() => window.removeEventListener('cart-badge-change', syncCartBadge));
</script>

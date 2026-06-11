<template>
  <div class="page login-page cute-login">
    <section class="login-visual">
      <p class="eyebrow">Doudou Flower Mall</p>
      <h1>鲜花传情，爱在身边。</h1>
      <p>普通用户可注册后购买鲜花，管理员可进入后台处理订单、库存和发货流程。</p>
      <div class="login-badges">
        <span>今日鲜切</span>
        <span>斗南直供</span>
        <span>库存同步</span>
      </div>
    </section>

    <el-card class="login-card" shadow="never">
      <template #header>
        <div class="section-head compact">
          <div>
            <p class="eyebrow">{{ mode === 'login' ? '账号登录' : '用户注册' }}</p>
            <h2>{{ mode === 'login' ? '欢迎回来' : '创建买家账号' }}</h2>
          </div>
        </div>
      </template>

      <el-segmented v-model="mode" class="auth-switch" :options="authOptions" />

      <el-form v-if="mode === 'login'" :model="loginForm" label-position="top" @submit.prevent="submitLogin">
        <el-form-item label="账号">
          <el-input v-model="loginForm.username" placeholder="admin 或 buyer" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="loginForm.password" type="password" show-password placeholder="admin123 或 buyer123" />
        </el-form-item>
        <el-button type="primary" native-type="submit" size="large" :loading="loading">登录</el-button>
      </el-form>

      <el-form v-else :model="registerForm" label-position="top" @submit.prevent="submitRegister">
        <el-form-item label="账号">
          <el-input v-model="registerForm.username" placeholder="3-30 位账号" />
        </el-form-item>
        <el-form-item label="昵称">
          <el-input v-model="registerForm.nickname" placeholder="例如：花店采购员" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="registerForm.phone" placeholder="请输入 11 位手机号" />
        </el-form-item>
        <el-form-item label="密码">
          <el-input v-model="registerForm.password" type="password" show-password placeholder="至少 6 位密码" />
        </el-form-item>
        <el-button type="primary" native-type="submit" size="large" :loading="loading">注册并登录</el-button>
      </el-form>

      <div class="demo-accounts">
        <span>管理员：admin / admin123</span>
        <span>买家：buyer / buyer123</span>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useSessionStore } from '../store.js';

const router = useRouter();
const session = useSessionStore();
const loading = ref(false);
const mode = ref('login');
const authOptions = [
  { label: '登录', value: 'login' },
  { label: '注册', value: 'register' }
];
const loginForm = reactive({ username: 'admin', password: 'admin123' });
const registerForm = reactive({ username: '', nickname: '', phone: '', password: '' });

async function submitLogin() {
  loading.value = true;
  try {
    await session.login(loginForm);
    ElMessage.success('登录成功');
    router.push(session.isAdmin ? '/admin' : '/');
  } finally {
    loading.value = false;
  }
}

async function submitRegister() {
  loading.value = true;
  try {
    await session.register(registerForm);
    ElMessage.success('注册成功，已自动登录');
    router.push('/');
  } finally {
    loading.value = false;
  }
}
</script>

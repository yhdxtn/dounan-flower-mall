<template>
  <div>
    <el-button class="chat-float" circle @click="openChat">
      <el-icon><Headset /></el-icon>
    </el-button>

    <el-drawer v-model="visible" class="customer-drawer" title="在线客服" size="380px" append-to-body>
      <div class="chat-widget">
        <div class="chat-tip">
          默认由 DeepSeek 智能客服回复，不可用时自动转人工；配置 Key 后可点“DeepSeek 接管”重新启用 AI。
        </div>

        <div class="chat-messages">
          <div v-if="!messages.length" class="empty-chat">你好呀，请问想咨询选花、订单还是配送？</div>
          <div v-for="message in messages" :key="message.id || message.created_at" :class="['chat-message', message.sender]">
            <span>{{ senderName[message.sender] || '客服' }}</span>
            <p>{{ message.content }}</p>
          </div>
        </div>

        <div class="chat-actions">
          <el-button size="small" @click="requestAi">DeepSeek 接管</el-button>
          <el-button size="small" @click="requestHuman">转人工客服</el-button>
        </div>

        <div class="chat-input">
          <el-input v-model="content" type="textarea" :rows="3" placeholder="请输入消息，例如：今天适合送女朋友什么花？" />
          <el-button type="primary" :loading="loading" @click="sendMessage">发送</el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Headset } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { api } from '../api.js';

const router = useRouter();
const visible = ref(false);
const loading = ref(false);
const content = ref('');
const messages = ref([]);
const senderName = {
  user: '我',
  ai: 'DeepSeek 客服',
  staff: '人工客服',
  system: '系统'
};

watch(visible, (value) => {
  document.body.classList.toggle('chat-open', value);
});

async function openChat() {
  if (!localStorage.getItem('token')) {
    ElMessage.info('请先登录或注册后咨询客服');
    router.push('/login');
    return;
  }
  visible.value = true;
  await loadSession();
}

async function loadSession() {
  const data = await api.get('/chat/session');
  messages.value = data.messages;
}

async function sendMessage() {
  if (!content.value.trim()) return;
  loading.value = true;
  try {
    const text = content.value.trim();
    content.value = '';
    messages.value.push({ sender: 'user', content: text, created_at: new Date().toISOString() });
    const data = await api.post('/chat/messages', { content: text });
    messages.value.push({ sender: data.mode === 'ai' ? 'ai' : 'system', content: data.reply, created_at: new Date().toISOString() });
    await loadSession();
  } finally {
    loading.value = false;
  }
}

async function requestHuman() {
  const data = await api.post('/chat/human');
  ElMessage.success('已转人工客服');
  messages.value.push({ sender: 'system', content: data.message, created_at: new Date().toISOString() });
  await loadSession();
}

async function requestAi() {
  const data = await api.post('/chat/ai');
  ElMessage.success('DeepSeek 智能客服已接管');
  messages.value.push({ sender: 'system', content: data.message, created_at: new Date().toISOString() });
  await loadSession();
}

onMounted(() => window.addEventListener('open-chat', openChat));
onBeforeUnmount(() => {
  window.removeEventListener('open-chat', openChat);
  document.body.classList.remove('chat-open');
});
</script>

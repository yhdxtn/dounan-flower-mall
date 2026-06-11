<template>
  <div>
    <el-button class="chat-float" circle @click="openChat">
      <el-icon><Headset /></el-icon>
    </el-button>

    <el-drawer v-model="visible" class="customer-drawer" title="在线客服" size="380px" append-to-body>
      <div class="chat-widget">
        <div class="chat-tip">
          默认由 DeepSeek 智能客服回复。AI 正在回复时请稍等，无法处理时可转人工客服。
        </div>

        <div ref="messagesPanel" class="chat-messages">
          <div v-if="!messages.length" class="empty-chat">你好呀，请问想咨询选花、订单还是配送？</div>
          <div v-for="message in messages" :key="message.id || message.created_at" :class="['chat-message', message.sender]">
            <span>{{ senderName[message.sender] || '客服' }}</span>
            <p>
              {{ message.content }}
              <i v-if="message.typing" class="typing-cursor"></i>
            </p>
          </div>
          <div v-if="loading" class="chat-message ai typing-line">
            <span>DeepSeek 客服</span>
            <p>正在回复<span class="typing-dots"><b>.</b><b>.</b><b>.</b></span></p>
          </div>
        </div>

        <div class="chat-actions">
          <el-button size="small" :disabled="loading" @click="requestAi">DeepSeek 接管</el-button>
          <el-button size="small" :disabled="loading" @click="requestHuman">转人工客服</el-button>
        </div>

        <div class="chat-input">
          <el-input
            v-model="content"
            type="textarea"
            :rows="3"
            :disabled="loading"
            placeholder="请输入消息，例如：今天适合送女朋友什么花？"
            @keydown.enter.exact.prevent="sendMessage"
          />
          <el-button type="primary" :loading="loading" :disabled="loading || !content.trim()" @click="sendMessage">
            {{ loading ? '等待回复' : '发送' }}
          </el-button>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import { Headset } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { api } from '../api.js';

const router = useRouter();
const visible = ref(false);
const loading = ref(false);
const content = ref('');
const messages = ref([]);
const messagesPanel = ref(null);

const senderName = {
  user: '我',
  ai: 'DeepSeek 客服',
  staff: '人工客服',
  system: '系统'
};

watch(visible, (value) => {
  document.body.classList.toggle('chat-open', value);
});

watch(messages, scrollToBottom, { deep: true });

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function scrollToBottom() {
  await nextTick();
  if (messagesPanel.value) {
    messagesPanel.value.scrollTop = messagesPanel.value.scrollHeight;
  }
}

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
  await scrollToBottom();
}

async function typeReply(sender, text) {
  const message = {
    sender,
    content: '',
    typing: true,
    created_at: new Date().toISOString()
  };
  messages.value.push(message);
  for (const char of [...text]) {
    message.content += char;
    await sleep(24);
  }
  message.typing = false;
}

async function sendMessage() {
  const text = content.value.trim();
  if (!text || loading.value) return;

  loading.value = true;
  content.value = '';
  messages.value.push({ sender: 'user', content: text, created_at: new Date().toISOString() });

  try {
    const data = await api.post('/chat/messages', { content: text }, { timeout: 90000 });
    loading.value = false;
    await typeReply(data.mode === 'ai' ? 'ai' : 'system', data.reply);
  } catch {
    messages.value.push({
      sender: 'system',
      content: 'AI 回复较慢或网络不稳定，请稍后再试；你的消息没有丢失。',
      created_at: new Date().toISOString()
    });
  } finally {
    loading.value = false;
  }
}

async function requestHuman() {
  if (loading.value) return;
  const data = await api.post('/chat/human');
  ElMessage.success('已转人工客服');
  messages.value.push({ sender: 'system', content: data.message, created_at: new Date().toISOString() });
}

async function requestAi() {
  if (loading.value) return;
  const data = await api.post('/chat/ai');
  ElMessage.success('DeepSeek 智能客服已接管');
  messages.value.push({ sender: 'system', content: data.message, created_at: new Date().toISOString() });
}

onMounted(() => window.addEventListener('open-chat', openChat));
onBeforeUnmount(() => {
  window.removeEventListener('open-chat', openChat);
  document.body.classList.remove('chat-open');
});
</script>

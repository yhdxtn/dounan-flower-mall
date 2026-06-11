<template>
  <div class="page admin-page">
    <section class="dashboard-strip">
      <div class="metric-card"><span>订单总数</span><strong>{{ orders.length }}</strong></div>
      <div class="metric-card"><span>用户数量</span><strong>{{ users.length }}</strong></div>
      <div class="metric-card"><span>商品数量</span><strong>{{ products.length }}</strong></div>
      <div class="metric-card"><span>客服会话</span><strong>{{ chatSessions.length }}</strong></div>
    </section>

    <el-tabs v-model="tab" class="admin-tabs">
      <el-tab-pane label="订单管理" name="orders">
        <section class="panel table-panel">
          <div class="section-head">
            <div><p class="eyebrow">后台查询</p><h2>订单管理</h2></div>
            <div class="table-actions">
              <el-select v-model="orderQuery.status" clearable placeholder="订单状态" @change="loadOrders">
                <el-option label="待支付" value="pending_pay" />
                <el-option label="已支付" value="paid" />
                <el-option label="已发货" value="shipped" />
                <el-option label="已完成" value="completed" />
                <el-option label="已取消" value="cancelled" />
              </el-select>
              <el-input v-model="orderQuery.keyword" clearable placeholder="订单号/用户/商品" @keyup.enter="loadOrders" />
              <el-button :icon="Search" type="primary" @click="loadOrders">查询</el-button>
            </div>
          </div>
          <el-table :data="orders" empty-text="暂无订单">
            <el-table-column prop="order_no" label="订单号" min-width="180" />
            <el-table-column prop="nickname" label="用户" width="120" />
            <el-table-column prop="item_summary" label="商品明细" min-width="260" show-overflow-tooltip />
            <el-table-column label="金额" width="110"><template #default="{ row }">￥{{ row.total_amount }}</template></el-table-column>
            <el-table-column label="状态" width="120"><template #default="{ row }"><el-tag :type="statusType[row.status]">{{ statusText[row.status] }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="220" fixed="right">
              <template #default="{ row }">
                <el-button v-if="row.status === 'pending_pay'" link type="primary" @click="changeStatus(row, 'paid')">收款</el-button>
                <el-button v-if="row.status === 'paid'" link type="primary" @click="changeStatus(row, 'shipped')">发货</el-button>
                <el-button v-if="row.status === 'shipped'" link type="primary" @click="changeStatus(row, 'completed')">完成</el-button>
                <el-button v-if="['pending_pay', 'paid'].includes(row.status)" link type="danger" @click="changeStatus(row, 'cancelled')">取消</el-button>
              </template>
            </el-table-column>
          </el-table>
        </section>
      </el-tab-pane>

      <el-tab-pane label="商品管理" name="products">
        <section class="panel table-panel">
          <div class="section-head"><div><p class="eyebrow">商品维护</p><h2>商品管理</h2></div><el-button :icon="Refresh" @click="loadProducts">刷新</el-button></div>
          <el-table :data="products" empty-text="暂无商品">
            <el-table-column prop="name" label="商品" min-width="180" />
            <el-table-column prop="category_name" label="分类" width="110" />
            <el-table-column label="价格" width="100"><template #default="{ row }">￥{{ row.price }}</template></el-table-column>
            <el-table-column prop="stock" label="库存" width="90" />
            <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag>{{ row.status === 'on_sale' ? '上架' : '下架' }}</el-tag></template></el-table-column>
            <el-table-column label="操作" width="110"><template #default="{ row }"><el-button link type="primary" @click="openProduct(row)">编辑</el-button></template></el-table-column>
          </el-table>
        </section>
      </el-tab-pane>

      <el-tab-pane label="用户管理" name="users">
        <section class="panel table-panel">
          <div class="section-head">
            <div><p class="eyebrow">会员资料</p><h2>用户管理</h2></div>
            <div class="table-actions">
              <el-input v-model="userQuery.keyword" clearable placeholder="账号/昵称/手机号" @keyup.enter="loadUsers" />
              <el-button :icon="Search" type="primary" @click="loadUsers">查询</el-button>
            </div>
          </div>
          <el-table :data="users" empty-text="暂无用户">
            <el-table-column prop="username" label="账号" min-width="140" />
            <el-table-column prop="nickname" label="昵称" width="140" />
            <el-table-column prop="phone" label="手机号" width="150" />
            <el-table-column prop="role" label="角色" width="100" />
            <el-table-column prop="created_at" label="注册时间" min-width="180" />
            <el-table-column label="操作" width="110"><template #default="{ row }"><el-button link type="primary" @click="openUser(row)">编辑</el-button></template></el-table-column>
          </el-table>
        </section>
      </el-tab-pane>

      <el-tab-pane label="库存管理" name="inventory">
        <section class="panel table-panel">
          <div class="section-head"><div><p class="eyebrow">库存同步</p><h2>库存管理</h2></div><el-button :icon="Refresh" @click="loadInventory">刷新</el-button></div>
          <el-table :data="inventory" empty-text="暂无库存">
            <el-table-column prop="name" label="商品" min-width="180" />
            <el-table-column prop="category_name" label="分类" width="120" />
            <el-table-column prop="stock" label="库存" width="120" />
            <el-table-column prop="warn_stock" label="预警值" width="120" />
            <el-table-column label="状态" width="120"><template #default="{ row }"><el-tag :type="row.is_warning ? 'danger' : 'success'">{{ row.is_warning ? '需补货' : '正常' }}</el-tag></template></el-table-column>
            <el-table-column label="调整库存" width="250" fixed="right">
              <template #default="{ row }"><div class="stock-editor"><el-input-number v-model="row.nextStock" :min="0" size="small" /><el-button link type="primary" @click="saveStock(row)">保存</el-button></div></template>
            </el-table-column>
          </el-table>
        </section>
      </el-tab-pane>

      <el-tab-pane label="客服管理" name="chat">
        <section class="panel table-panel">
          <div class="section-head"><div><p class="eyebrow">人工客服</p><h2>客服会话</h2></div><el-button :icon="Refresh" @click="loadChatSessions">刷新</el-button></div>
          <div class="chat-admin">
            <el-table :data="chatSessions" empty-text="暂无客服会话" @row-click="selectSession">
              <el-table-column prop="nickname" label="用户" width="130" />
              <el-table-column prop="phone" label="电话" width="140" />
              <el-table-column label="状态" width="100"><template #default="{ row }"><el-tag :type="row.status === 'human' ? 'danger' : 'success'">{{ row.status === 'human' ? '人工' : 'AI' }}</el-tag></template></el-table-column>
              <el-table-column prop="last_message" label="最近消息" show-overflow-tooltip />
            </el-table>
            <div class="chat-admin-panel">
              <div class="chat-admin-messages">
                <p v-if="!activeSession" class="muted">点击左侧会话查看消息</p>
                <div v-for="message in chatMessages" :key="message.id" :class="['chat-message', message.sender]"><span>{{ chatSenderName[message.sender] }}</span><p>{{ message.content }}</p></div>
              </div>
              <div class="chat-admin-reply"><el-input v-model="replyText" type="textarea" :rows="3" placeholder="输入人工客服回复" /><el-button type="primary" :disabled="!activeSession" @click="replyChat">发送回复</el-button></div>
            </div>
          </div>
        </section>
      </el-tab-pane>

      <el-tab-pane label="DeepSeek配置" name="settings">
        <section class="panel settings-panel">
          <div class="section-head"><div><p class="eyebrow">AI 客服</p><h2>DeepSeek 配置</h2></div><el-tag :type="deepseek.configured ? 'success' : 'warning'">{{ deepseek.configured ? '已配置' : '未配置' }}</el-tag></div>
          <el-form :model="deepseek" label-position="top">
            <el-form-item label="DeepSeek API Key"><el-input v-model="deepseek.apiKey" type="password" show-password placeholder="sk-..." /></el-form-item>
            <el-form-item label="接口地址 Base URL"><el-input v-model="deepseek.baseUrl" placeholder="例如：https://api.deepseek.com 或 https://你的平台/v1" /></el-form-item>
            <el-form-item label="模型">
              <div class="model-picker">
                <el-select v-model="deepseek.model" filterable allow-create default-first-option placeholder="请选择或输入模型">
                  <el-option v-for="model in deepseekModels" :key="model" :label="model" :value="model" />
                </el-select>
                <el-button @click="loadDeepSeekModels">获取模型列表</el-button>
              </div>
            </el-form-item>
            <el-button type="primary" @click="saveDeepSeek">保存配置</el-button>
            <el-button @click="testDeepSeek">测试 DeepSeek</el-button>
            <p v-if="deepseekTest" class="setting-result">{{ deepseekTest }}</p>
          </el-form>
        </section>
      </el-tab-pane>
    </el-tabs>

    <el-dialog v-model="productDialog" title="编辑商品" width="560px">
      <el-form :model="productForm" label-position="top">
        <el-form-item label="名称"><el-input v-model="productForm.name" /></el-form-item>
        <el-form-item label="价格"><el-input-number v-model="productForm.price" :min="0" /></el-form-item>
        <el-form-item label="库存"><el-input-number v-model="productForm.stock" :min="0" /></el-form-item>
        <el-form-item label="预警值"><el-input-number v-model="productForm.warn_stock" :min="0" /></el-form-item>
        <el-form-item label="等级"><el-input v-model="productForm.grade" /></el-form-item>
        <el-form-item label="产地"><el-input v-model="productForm.origin" /></el-form-item>
        <el-form-item label="状态"><el-select v-model="productForm.status"><el-option label="上架" value="on_sale" /><el-option label="下架" value="off_sale" /></el-select></el-form-item>
        <el-form-item label="描述"><el-input v-model="productForm.description" type="textarea" /></el-form-item>
      </el-form>
      <template #footer><el-button @click="productDialog = false">取消</el-button><el-button type="primary" @click="saveProduct">保存</el-button></template>
    </el-dialog>

    <el-dialog v-model="userDialog" title="编辑用户" width="460px">
      <el-form :model="userForm" label-position="top">
        <el-form-item label="昵称"><el-input v-model="userForm.nickname" /></el-form-item>
        <el-form-item label="手机号"><el-input v-model="userForm.phone" /></el-form-item>
        <el-form-item label="角色"><el-select v-model="userForm.role"><el-option label="买家" value="buyer" /><el-option label="管理员" value="admin" /></el-select></el-form-item>
      </el-form>
      <template #footer><el-button @click="userDialog = false">取消</el-button><el-button type="primary" @click="saveUser">保存</el-button></template>
    </el-dialog>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { Refresh, Search } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { api } from '../api.js';

const tab = ref('orders');
const orders = ref([]);
const inventory = ref([]);
const products = ref([]);
const users = ref([]);
const chatSessions = ref([]);
const chatMessages = ref([]);
const activeSession = ref(null);
const replyText = ref('');
const productDialog = ref(false);
const userDialog = ref(false);
const orderQuery = reactive({ status: '', keyword: '' });
const userQuery = reactive({ keyword: '' });
const deepseek = reactive({ apiKey: '', model: 'gpt-5.4-mini', baseUrl: 'https://fumin.ai/v1', configured: false });
const deepseekTest = ref('');
const deepseekModels = ref([]);
const productForm = reactive({});
const userForm = reactive({});
const statusText = { pending_pay: '待支付', paid: '已支付', shipped: '已发货', completed: '已完成', cancelled: '已取消' };
const statusType = { pending_pay: 'warning', paid: 'primary', shipped: 'success', completed: 'info', cancelled: 'danger' };
const warningCount = computed(() => inventory.value.filter((item) => item.is_warning).length);
const chatSenderName = { user: '用户', ai: 'DeepSeek 客服', staff: '人工客服', system: '系统' };

async function loadOrders() { orders.value = await api.get('/admin/orders', { params: { status: orderQuery.status || undefined, keyword: orderQuery.keyword || undefined } }); }
async function loadInventory() { const rows = await api.get('/admin/inventory'); inventory.value = rows.map((row) => ({ ...row, nextStock: row.stock })); }
async function loadProducts() { products.value = await api.get('/admin/products'); }
async function loadUsers() { users.value = await api.get('/admin/users', { params: { keyword: userQuery.keyword || undefined } }); }
async function loadChatSessions() { chatSessions.value = await api.get('/admin/chat/sessions'); }
async function loadDeepSeek() { Object.assign(deepseek, await api.get('/admin/settings/deepseek')); }
async function loadDeepSeekModels() {
  const data = await api.get('/admin/settings/deepseek/models');
  deepseekModels.value = data.models || [];
  if (!deepseek.model && deepseekModels.value.length) deepseek.model = deepseekModels.value[0];
  ElMessage.success(`已获取 ${deepseekModels.value.length} 个模型`);
}

async function changeStatus(row, status) { await api.patch(`/admin/orders/${row.id}/status`, { status }); ElMessage.success('订单状态已更新'); await Promise.all([loadOrders(), loadInventory()]); }
async function saveStock(row) { await api.patch(`/admin/inventory/${row.product_id}`, { stock: row.nextStock, remark: '后台库存管理调整' }); ElMessage.success('库存已调整'); await loadInventory(); }
function openProduct(row) { Object.assign(productForm, JSON.parse(JSON.stringify(row))); productDialog.value = true; }
async function saveProduct() { await api.patch(`/admin/products/${productForm.id}`, { name: productForm.name, price: Number(productForm.price), status: productForm.status, grade: productForm.grade, origin: productForm.origin, description: productForm.description, stock: Number(productForm.stock), warn_stock: Number(productForm.warn_stock) }); ElMessage.success('商品已保存'); productDialog.value = false; await Promise.all([loadProducts(), loadInventory()]); }
function openUser(row) { Object.assign(userForm, JSON.parse(JSON.stringify(row))); userDialog.value = true; }
async function saveUser() { await api.patch(`/admin/users/${userForm.id}`, { nickname: userForm.nickname, phone: userForm.phone, role: userForm.role }); ElMessage.success('用户已保存'); userDialog.value = false; await loadUsers(); }
async function selectSession(row) { activeSession.value = row; chatMessages.value = await api.get(`/admin/chat/sessions/${row.id}/messages`); }
async function replyChat() { if (!replyText.value.trim() || !activeSession.value) return; await api.post(`/admin/chat/sessions/${activeSession.value.id}/reply`, { content: replyText.value.trim() }); ElMessage.success('客服回复已发送'); replyText.value = ''; await Promise.all([selectSession(activeSession.value), loadChatSessions()]); }
async function saveDeepSeek() { await api.put('/admin/settings/deepseek', { apiKey: deepseek.apiKey, model: deepseek.model, baseUrl: deepseek.baseUrl }); ElMessage.success('AI 配置已保存'); await loadDeepSeek(); }
async function testDeepSeek() {
  deepseekTest.value = '';
  const data = await api.post('/admin/settings/deepseek/test');
  deepseekTest.value = data.reply || data.message;
  ElMessage.success(data.message);
}

onMounted(async () => { await Promise.all([loadOrders(), loadInventory(), loadProducts(), loadUsers(), loadChatSessions(), loadDeepSeek()]); });
</script>

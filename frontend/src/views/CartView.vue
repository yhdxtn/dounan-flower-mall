<template>
  <div class="page split-page">
    <section class="panel table-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">采购清单</p>
          <h2>购物车</h2>
        </div>
        <el-tag effect="plain">{{ items.length }} 个品项</el-tag>
      </div>

      <el-table :data="items" empty-text="购物车为空">
        <el-table-column label="商品" min-width="220">
          <template #default="{ row }">
            <strong>{{ row.name }}</strong>
            <div class="muted">库存 {{ row.stock }} {{ row.unit }}</div>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="110" />
        <el-table-column label="数量" width="180">
          <template #default="{ row }">
            <el-input-number v-model="row.quantity" :min="1" :max="row.stock" size="small" @change="updateCart(row)" />
          </template>
        </el-table-column>
        <el-table-column label="小计" width="120">
          <template #default="{ row }">￥{{ (row.price * row.quantity).toFixed(2) }}</template>
        </el-table-column>
        <el-table-column width="90">
          <template #default="{ row }">
            <el-button type="danger" link @click="removeCart(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>

    <aside class="panel checkout-panel">
      <div class="section-head compact">
        <div>
          <p class="eyebrow">收货信息</p>
          <h2>提交订单</h2>
        </div>
      </div>

      <el-form :model="form" label-position="top">
        <el-form-item label="收货人"><el-input v-model="form.receiverName" /></el-form-item>
        <el-form-item label="电话"><el-input v-model="form.receiverPhone" /></el-form-item>
        <el-form-item label="地址"><el-input v-model="form.receiverAddress" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="form.remark" placeholder="配送时段、花材要求等" /></el-form-item>
      </el-form>

      <div class="total-box">
        <span>订单合计</span>
        <strong>￥{{ total.toFixed(2) }}</strong>
      </div>
      <el-button type="primary" size="large" :disabled="!items.length" @click="submitOrder">提交订单</el-button>
    </aside>
  </div>
</template>

<script setup>
import { computed, onMounted, reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { api } from '../api.js';

const router = useRouter();
const items = ref([]);
const form = reactive({
  receiverName: '斗南采购部',
  receiverPhone: '13800000000',
  receiverAddress: '云南省昆明市呈贡区斗南花市',
  remark: ''
});

const total = computed(() => items.value.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0));

async function loadCart() {
  items.value = await api.get('/cart');
}

async function updateCart(row) {
  await api.put(`/cart/${row.id}`, { quantity: row.quantity });
}

async function removeCart(row) {
  await api.delete(`/cart/${row.id}`);
  await loadCart();
}

async function submitOrder() {
  const order = await api.post('/orders', form);
  ElMessage.success(`订单 ${order.orderNo} 已创建`);
  router.push('/orders');
}

onMounted(loadCart);
</script>

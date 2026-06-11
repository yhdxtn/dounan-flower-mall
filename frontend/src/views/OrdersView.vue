<template>
  <div class="page">
    <section class="panel table-panel">
      <div class="section-head">
        <div>
          <p class="eyebrow">交易记录</p>
          <h2>我的订单</h2>
        </div>
        <el-button :icon="Refresh" @click="loadOrders">刷新</el-button>
      </div>

      <el-table :data="orders" empty-text="暂无订单">
        <el-table-column prop="order_no" label="订单号" min-width="190" />
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="statusType[row.status]">{{ statusText[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="total_amount" label="金额" width="120">
          <template #default="{ row }">￥{{ row.total_amount }}</template>
        </el-table-column>
        <el-table-column prop="receiver_name" label="收货人" width="140" />
        <el-table-column prop="created_at" label="创建时间" min-width="180" />
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button v-if="['pending_pay', 'paid'].includes(row.status)" type="danger" link @click="cancel(row)">取消</el-button>
          </template>
        </el-table-column>
      </el-table>
    </section>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { Refresh } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { api } from '../api.js';

const orders = ref([]);
const statusText = {
  pending_pay: '待支付',
  paid: '已支付',
  shipped: '已发货',
  completed: '已完成',
  cancelled: '已取消'
};
const statusType = {
  pending_pay: 'warning',
  paid: 'primary',
  shipped: 'success',
  completed: 'info',
  cancelled: 'danger'
};

async function loadOrders() {
  orders.value = await api.get('/orders');
}

async function cancel(row) {
  await api.post(`/orders/${row.id}/cancel`);
  ElMessage.success('订单已取消，库存已回补');
  await loadOrders();
}

onMounted(loadOrders);
</script>

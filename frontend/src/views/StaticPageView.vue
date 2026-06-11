<template>
  <div class="page static-page">
    <section class="static-hero">
      <p class="eyebrow">{{ page.eyebrow }}</p>
      <h1>{{ page.title }}</h1>
      <p>{{ page.desc }}</p>
      <el-button type="primary" round @click="$router.push({ path: '/', query: page.query })">去挑选鲜花</el-button>
    </section>

    <section class="static-grid">
      <div v-for="item in page.cards" :key="item.title" class="static-card">
        <strong>{{ item.title }}</strong>
        <p>{{ item.text }}</p>
      </div>
    </section>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();
const pages = {
  flowers: {
    eyebrow: 'Flower Categories',
    title: '鲜花分类',
    desc: '玫瑰、百合、康乃馨、配草配叶，按采购场景快速筛选。',
    query: {},
    cards: [
      { title: '玫瑰专区', text: '适合告白、纪念日、花束礼盒。' },
      { title: '百合专区', text: '适合乔迁、商务、家庭装饰。' },
      { title: '配草配叶', text: '让花束层次更自然丰满。' }
    ]
  },
  preserved: {
    eyebrow: 'Preserved Flowers',
    title: '永生花',
    desc: '适合长期保存的礼物场景，后续可扩展专属商品分类。',
    query: { keyword: '玫瑰' },
    cards: [
      { title: '礼盒陈列', text: '适合生日、纪念日和办公室摆件。' },
      { title: '稳定保存', text: '减少养护成本，保持仪式感。' },
      { title: '定制祝福', text: '支持搭配卡片和专属包装。' }
    ]
  },
  sets: {
    eyebrow: 'Flower Gift Sets',
    title: '花礼套装',
    desc: '鲜花、配草、包装和祝福卡组合成完整花礼。',
    query: { keyword: '玫瑰' },
    cards: [
      { title: '告白套装', text: '玫瑰与尤加利搭配，柔和高级。' },
      { title: '节庆套装', text: '按节日主题推荐花材组合。' },
      { title: '门店备货', text: '适合花店快速补货和陈列。' }
    ]
  },
  festival: {
    eyebrow: 'Festival Zone',
    title: '节日专区',
    desc: '面向情人节、母亲节、七夕等高峰交易场景。',
    query: { keyword: '康乃馨' },
    cards: [
      { title: '母亲节', text: '康乃馨与温柔色系花材推荐。' },
      { title: '七夕节', text: '玫瑰礼盒、花束组合。' },
      { title: '门店预售', text: '高峰期提前锁定库存。' }
    ]
  },
  about: {
    eyebrow: 'About Us',
    title: '关于我们',
    desc: '斗斗鲜花商城围绕斗南鲜花交易，提供商品、库存、订单和客服一体化服务。',
    query: {},
    cards: [
      { title: '斗南场景', text: '贴近批发采购和日常花店备货。' },
      { title: '库存同步', text: '下单扣减，取消回补，后台可查。' },
      { title: '客服支持', text: 'DeepSeek 智能客服优先，异常转人工。' }
    ]
  }
};

const page = computed(() => pages[route.meta.pageType] || pages.flowers);
</script>

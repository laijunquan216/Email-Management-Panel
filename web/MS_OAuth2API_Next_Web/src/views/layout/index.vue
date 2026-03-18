<template>
  <div class="layout-page">
    <aside class="sidebar">
      <div class="brand">
        <span class="logo">✉</span>
        <span>邮箱管家</span>
      </div>

      <div class="menu-list">
        <button
          v-for="item in menuItems"
          :key="item.routeName"
          class="menu-item"
          :class="{ active: route.name === item.routeName }"
          @click="go(item.routeName)"
        >
          {{ item.title }}
        </button>
      </div>
    </aside>

    <main class="main-panel">
      <header class="top-bar">
        <div>
          <h1>{{ pageTitle }}</h1>
          <p>{{ pageDesc }}</p>
        </div>
        <el-button plain @click="logout">退出登录</el-button>
      </header>
      <section class="page-content">
        <router-view />
      </section>
    </main>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import router from '@/router'

const menuItems = [
  { title: '总览', routeName: 'home' },
  { title: '邮箱列表', routeName: 'email' },
]

const route = useRoute()

const pageTitle = computed(() => (route.name === 'email' ? '邮箱管理' : '控制台总览'))
const pageDesc = computed(() =>
  route.name === 'email' ? '管理您的所有邮箱账号' : '欢迎使用邮箱管理后台'
)

const go = (name: string) => {
  router.push({ name })
}

const logout = async () => {
  try {
    await fetch('/auth/logout', {
      method: 'POST',
      credentials: 'include',
    })
    ElMessage.success('已退出登录')
  } finally {
    router.replace('/login')
  }
}
</script>

<style scoped>
.layout-page {
  min-height: 100vh;
  display: flex;
  background: #f2f5fb;
}

.sidebar {
  width: 250px;
  background: linear-gradient(180deg, #5ea0ff 0%, #4f86f2 100%);
  color: #fff;
  padding: 26px 20px;
  box-sizing: border-box;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 30px;
  font-weight: 700;
}

.logo {
  width: 40px;
  height: 40px;
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu-list {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.menu-item {
  border: none;
  height: 46px;
  border-radius: 12px;
  text-align: left;
  padding: 0 16px;
  color: #eaf2ff;
  background: transparent;
  font-size: 16px;
  cursor: pointer;
}

.menu-item.active,
.menu-item:hover {
  background: rgba(255, 255, 255, 0.2);
  color: #fff;
}

.main-panel {
  flex: 1;
  min-width: 0;
}

.top-bar {
  min-height: 110px;
  padding: 24px 36px;
  background: #fff;
  border-bottom: 1px solid #e8edf7;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

h1 {
  margin: 0;
  font-size: 40px;
  color: #1c3262;
}

p {
  margin: 8px 0 0;
  color: #7d8bb0;
}

.page-content {
  padding: 24px;
}

@media (max-width: 900px) {
  .sidebar {
    width: 180px;
  }

  h1 {
    font-size: 28px;
  }
}
</style>

<template>
  <div class="login-page">
    <div class="login-card">
      <h2>邮箱管理面板</h2>
      <p>请输入访问密码</p>
      <el-input
        v-model="password"
        type="password"
        show-password
        placeholder="请输入 WebUI 密码"
        @keyup.enter="handleLogin"
      />
      <el-button type="primary" :loading="loading" @click="handleLogin">登录</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import router from '@/router'

const password = ref('')
const loading = ref(false)

const checkStatus = async () => {
  const response = await fetch('/auth/status', { credentials: 'include' })
  const data = await response.json()
  if (!data?.data?.required || data?.data?.authenticated) {
    router.replace('/email')
  }
}

onMounted(() => {
  checkStatus().catch(() => undefined)
})

const handleLogin = async () => {
  if (!password.value.trim()) {
    ElMessage.warning('请输入密码')
    return
  }

  loading.value = true
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ password: password.value.trim() }),
    })
    const data = await response.json()

    if (response.ok && data.code === '200') {
      ElMessage.success('登录成功')
      router.replace('/email')
      return
    }

    ElMessage.error(data.error || '登录失败')
  } catch (_error) {
    ElMessage.error('登录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at top right, #89b7ff 0%, #4f91f8 30%, #325ec9 100%);
}

.login-card {
  width: min(420px, 90vw);
  background: rgba(255, 255, 255, 0.92);
  border-radius: 18px;
  padding: 36px;
  box-shadow: 0 20px 40px rgba(18, 41, 105, 0.25);
  display: flex;
  flex-direction: column;
  gap: 18px;
}

h2 {
  margin: 0;
  font-size: 30px;
  color: #17316b;
}

p {
  margin: 0;
  color: #6e7ba5;
}

.el-button {
  height: 42px;
  font-size: 16px;
}
</style>

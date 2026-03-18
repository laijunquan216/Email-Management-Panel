<template>
  <div class="home-container">
    <div class="content-box">
      <h3>介绍</h3>
      <p>这是 Email-Management-Panel 的控制台首页。</p>
      <p>
        项目仓库地址：
        <a href="https://github.com/laijunquan216/Email-Management-Panel" target="_blank">Email-Management-Panel</a>
      </p>

      <h3>面板功能</h3>
      <ul>
        <li>邮箱导入（文件上传、粘贴导入）</li>
        <li>邮箱列表管理（分页、批量删除、批量导出）</li>
        <li>备注在线编辑</li>
        <li>令牌状态检测</li>
        <li>收件箱 / 垃圾箱邮件查看与清空</li>
      </ul>

      <h3>部署提示</h3>
      <ul>
        <li>推荐使用 README 中的一键安装脚本（Ubuntu / Debian）。</li>
        <li>可按需开启 WebUI 登录密码与 Nginx 反向代理。</li>
      </ul>
    </div>
  </div>
</template>

<script lang="ts" setup>
</script>

<style scoped>
.content-box {
  background: #fff;
  border-radius: 8px;
}

h3 {
  color: #2c3e50;
  font-size: 1.5rem;
  margin-top: 2rem;
  margin-bottom: 1rem;
  font-weight: 600;
  border-bottom: 1px solid #eee;
  padding-bottom: 0.5rem;
}

p {
  margin-bottom: 1rem;
  color: #555;
}

a {
  color: #3498db;
  text-decoration: none;
  transition: color 0.2s ease;
}

a:hover {
  color: #2980b9;
  text-decoration: underline;
}

ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

li {
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  color: #555;
}

li:before {
  content: '•';
  color: #3498db;
  font-weight: bold;
  position: absolute;
  left: 0;
}

h3:first-of-type {
  margin-top: 0;
}

@media (max-width: 768px) {
  .home-container {
    padding: 1rem;
  }

  .content-box {
    padding: 1.5rem;
  }

  h3 {
    font-size: 1.3rem;
  }
}
</style>

<template>
  <div class="email-page">
    <el-card shadow="never" class="toolbar-card">
      <el-form :model="toolForm" ref="formRef" :inline="true">
        <el-form-item label="分隔符：" label-width="70px">
          <el-input v-model="toolForm.splitSymbol" />
        </el-form-item>
        <el-form-item>
          <el-upload
            ref="upload"
            :limit="1"
            :show-file-list="false"
            :on-exceed="handleExceed"
            :auto-upload="false"
            :on-change="handleFileChange"
            accept=".txt,.csv"
            class="custom-upload"
          >
            <template #trigger>
              <el-button type="primary">
                <el-icon><FilesIcon /></el-icon>
                {{ fileName || '选择文件' }}
              </el-button>
            </template>
          </el-upload>
        </el-form-item>
        <el-form-item><el-button type="success" @click="handleAdd">导入邮箱</el-button></el-form-item>
        <el-form-item><el-button type="success" @click="dialogCopyVisible = true">粘贴导入</el-button></el-form-item>
        <el-form-item><el-button type="warning" @click="handleBatchExport">批量导出</el-button></el-form-item>
        <el-form-item><el-button type="warning" @click="handleExportAll">全部导出</el-button></el-form-item>
        <el-form-item><el-button type="warning" @click="handleBatchDelete">批量删除</el-button></el-form-item>
        <el-form-item><el-button type="danger" @click="handleDeleteAll">全部删除</el-button></el-form-item>
      </el-form>
    </el-card>

    <el-card shadow="never" class="table-card">
      <el-table
        ref="multipleTableRef"
        :height="calcTableHeight"
        stripe
        :data="tableMailList"
        row-key="email"
        size="large"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />
        <el-table-column type="index" label="#" width="70" />
        <el-table-column show-overflow-tooltip prop="email" label="邮箱" min-width="240" />
        <el-table-column show-overflow-tooltip prop="password" label="邮箱密码" min-width="180" />

        <el-table-column label="备注" min-width="220">
          <template #default="scope">
            <el-input
              v-model="scope.row.note"
              placeholder="填写备注"
              @change="saveList"
              clearable
            />
          </template>
        </el-table-column>

        <el-table-column label="令牌状态" width="170">
          <template #default="scope">
            <el-tag :type="statusTagType(scope.row.tokenStatus)">{{ scope.row.tokenStatus || '未检测' }}</el-tag>
            <el-button link type="primary" @click="checkToken(scope.row)">检测</el-button>
          </template>
        </el-table-column>

        <el-table-column label="操作" width="270">
          <template #default="scope">
            <el-button size="small" type="primary" @click="handleEdit(scope.row, scope.$index)">编辑</el-button>
            <el-button size="small" type="success" @click="handleInbox(scope.row)">收件箱</el-button>
            <el-button size="small" type="success" @click="handleTrash(scope.row)">垃圾箱</el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row, scope.$index)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination" ref="tablePaginationRef">
        <el-pagination
          background
          v-model:current-page="tablePagination.currentPage"
          v-model:page-size="tablePagination.pageSize"
          :page-sizes="[5, 10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          :total="tablePagination.total"
          @size-change="handleTableSizeChange"
          @current-change="handleTableCurrentChange"
        />
      </div>
    </el-card>

    <el-dialog v-model="dialogCopyVisible" title="粘贴导入" width="800">
      <el-text type="warning">请粘贴邮箱地址（每行一条）</el-text>
      <el-input v-model="copyTextarea" style="margin-top: 12px" :rows="20" type="textarea" placeholder="请粘贴邮箱地址" />
      <template #footer>
        <el-button @click="dialogCopyVisible = false">取消</el-button>
        <el-button type="primary" @click="handlePasteAdd">导入</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogEditVisible" title="编辑" width="800">
      <el-form :model="editForm" label-width="120px">
        <el-form-item label="邮箱"><el-input v-model="editForm.email" /></el-form-item>
        <el-form-item label="密码"><el-input v-model="editForm.password" type="password" /></el-form-item>
        <el-form-item label="客户端ID"><el-input v-model="editForm.client_id" /></el-form-item>
        <el-form-item label="刷新令牌"><el-input v-model="editForm.refresh_token" type="textarea" :rows="6" /></el-form-item>
        <el-form-item label="备注"><el-input v-model="editForm.note" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogEditVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </template>
    </el-dialog>

    <el-dialog v-model="dialogEmailVisible" :title="postTitle" width="1000">
      <el-button type="primary" @click="handleReceive" :loading="postLoading">收取新邮件</el-button>
      <el-button type="danger" @click="handleClear">清空</el-button>
      <el-table :data="postList" height="calc(100vh - 350px)">
        <el-table-column prop="send" label="发件人" show-overflow-tooltip />
        <el-table-column prop="subject" label="主题" show-overflow-tooltip />
        <el-table-column prop="text" label="文本" show-overflow-tooltip />
        <el-table-column prop="date" label="日期" show-overflow-tooltip />
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewPost(scope.row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-dialog>

    <el-dialog v-model="dialogPostVisible" title="邮件内容" width="800">
      <div v-html="dialogEmailContent" style="height: calc(100vh - 400px); overflow: auto" />
    </el-dialog>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { genFileId, ElMessage, ElMessageBox } from 'element-plus'
import { Plus as FilesIcon } from '@element-plus/icons-vue'
import type { UploadInstance, UploadProps, UploadRawFile, TableInstance, FormInstance } from 'element-plus'

interface Email {
  email: string
  password: string
  client_id: string
  refresh_token: string
  note: string
  tokenStatus: string
}

interface Post {
  send: string
  subject: string
  text: string
  html: string
  date: string
}

const upload = ref<UploadInstance>()
const formRef = ref<FormInstance>()
const multipleTableRef = ref<TableInstance>()
const tablePaginationRef = ref<HTMLDivElement>()
const emailList = ref<string[]>([])
const fileName = ref('')
const toolForm = ref({ splitSymbol: '----' })
const multipleSelection = ref<Email[]>([])
const dialogCopyVisible = ref(false)
const copyTextarea = ref('')

const mailList = ref<Email[]>(JSON.parse(localStorage.getItem('localMailList') || '[]'))
mailList.value = mailList.value.map((item) => ({ ...item, note: item.note || '', tokenStatus: item.tokenStatus || '未检测' }))

const saveList = () => {
  localStorage.setItem('localMailList', JSON.stringify(mailList.value))
}

const tablePagination = ref({ currentPage: 1, pageSize: 10, total: mailList.value.length })
const tableMailList = computed(() => {
  const start = (tablePagination.value.currentPage - 1) * tablePagination.value.pageSize
  return mailList.value.slice(start, start + tablePagination.value.pageSize)
})

const handleSelectionChange = (val: Email[]) => {
  multipleSelection.value = val
}

const handleExceed: UploadProps['onExceed'] = (files) => {
  upload.value?.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  upload.value?.handleStart(file)
}

const handleFileChange: UploadProps['onChange'] = (_file, fileList = []) => {
  const rawFile = fileList[0]?.raw as UploadRawFile | undefined
  if (!rawFile) return
  fileName.value = rawFile.name
  parseFileContent(rawFile)
}

const parseFileContent = (file: UploadRawFile) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    const content = e.target?.result as string
    emailList.value = content.split('\n').map((item) => item.trim()).filter(Boolean)
  }
  reader.readAsText(file)
}

const parseLine = (line: string): Email => {
  const [email = '', password = '', client_id = '', refresh_token = '', note = ''] = line.split(toolForm.value.splitSymbol)
  return { email, password, client_id, refresh_token, note, tokenStatus: '未检测' }
}

const handleAdd = () => {
  if (!emailList.value.length) {
    ElMessage.warning('请先导入邮箱数据')
    return
  }

  mailList.value = mailList.value.concat(emailList.value.map(parseLine).filter((item) => item.email))
  tablePagination.value.total = mailList.value.length
  saveList()
  emailList.value = []
  copyTextarea.value = ''
  dialogCopyVisible.value = false
  fileName.value = ''
  upload.value?.clearFiles()
  ElMessage.success(`导入成功，共 ${mailList.value.length} 条`)
}

const handlePasteAdd = () => {
  emailList.value = copyTextarea.value.split('\n').map((item) => item.trim()).filter(Boolean)
  handleAdd()
}

const exportList = (list: Email[], filename: string) => {
  const exportContent = list
    .map((item) => [item.email, item.password, item.client_id, item.refresh_token, item.note || ''].join(toolForm.value.splitSymbol))
    .join('\n')
  const blob = new Blob([exportContent], { type: 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

const handleBatchExport = () => {
  if (!multipleSelection.value.length) return ElMessage.warning('请选择要导出的邮箱')
  exportList(multipleSelection.value, 'selected_mails.txt')
}

const handleExportAll = () => {
  if (!mailList.value.length) return ElMessage.warning('暂无邮箱数据')
  exportList(mailList.value, 'all_mails.txt')
}

const handleBatchDelete = () => {
  if (!multipleSelection.value.length) return ElMessage.warning('请选择要删除的邮箱')
  mailList.value = mailList.value.filter((item) => !multipleSelection.value.includes(item))
  tablePagination.value.total = mailList.value.length
  multipleTableRef.value?.clearSelection()
  saveList()
}

const handleDeleteAll = () => {
  mailList.value = []
  tablePagination.value.total = 0
  saveList()
  multipleTableRef.value?.clearSelection()
}

const dialogEditVisible = ref(false)
const editForm = ref<Email>({ email: '', password: '', client_id: '', refresh_token: '', note: '', tokenStatus: '未检测' })
const editIndex = ref(-1)

const handleEdit = (row: Email, index: number) => {
  editIndex.value = (tablePagination.value.currentPage - 1) * tablePagination.value.pageSize + index
  editForm.value = JSON.parse(JSON.stringify(row))
  dialogEditVisible.value = true
}

const handleSave = () => {
  if (editIndex.value < 0) return
  mailList.value[editIndex.value] = editForm.value
  saveList()
  dialogEditVisible.value = false
  ElMessage.success('保存成功')
}

const handleDelete = (_row: Email, index: number) => {
  const realIndex = (tablePagination.value.currentPage - 1) * tablePagination.value.pageSize + index
  mailList.value.splice(realIndex, 1)
  tablePagination.value.total = mailList.value.length
  saveList()
}

const statusTagType = (status: string) => {
  if (status === '正常') return 'success'
  if (status === '异常') return 'danger'
  if (status === '检测中') return 'warning'
  return 'info'
}

const checkToken = async (row: Email) => {
  if (!row.client_id || !row.refresh_token) {
    row.tokenStatus = '异常'
    saveList()
    ElMessage.error('缺少 client_id 或 refresh_token，无法检测')
    return
  }

  row.tokenStatus = '检测中'
  saveList()
  try {
    const response = await fetch('/api/mail_new', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        email: row.email,
        client_id: row.client_id,
        refresh_token: row.refresh_token,
        mailbox: 'INBOX',
      }),
    })
    const data = await response.json()
    row.tokenStatus = response.ok && data.code == 200 ? '正常' : '异常'
  } catch (_error) {
    row.tokenStatus = '异常'
  }
  saveList()
}

const handleTableSizeChange = (val: number) => (tablePagination.value.pageSize = val)
const handleTableCurrentChange = (val: number) => (tablePagination.value.currentPage = val)

const formHeight = ref(0)
const tablePaginationHeight = ref(0)
const calcTableHeight = computed(
  () => `calc(100vh - ${formHeight.value}px - ${tablePaginationHeight.value}px - 260px)`
)

let formResizeObserver: ResizeObserver | null = null
let paginationResizeObserver: ResizeObserver | null = null

onMounted(() => {
  nextTick(() => {
    formHeight.value = formRef.value?.$el?.offsetHeight || 0
    tablePaginationHeight.value = tablePaginationRef.value?.offsetHeight || 0
    if (formRef.value?.$el) {
      formResizeObserver = new ResizeObserver((entries) => {
        const first = entries[0]
        if (first) formHeight.value = first.contentRect.height
      })
      formResizeObserver.observe(formRef.value.$el)
    }
    if (tablePaginationRef.value) {
      paginationResizeObserver = new ResizeObserver((entries) => {
        const first = entries[0]
        if (first) tablePaginationHeight.value = first.contentRect.height
      })
      paginationResizeObserver.observe(tablePaginationRef.value)
    }
  })
})

onBeforeUnmount(() => {
  formResizeObserver?.disconnect()
  paginationResizeObserver?.disconnect()
})

const dialogEmailVisible = ref(false)
const postList = ref<Post[]>([])
const postTitle = ref('')
const postLoading = ref(false)
const boxType = ref('INBOX')
const nowPost = ref<Email>({ email: '', password: '', client_id: '', refresh_token: '', note: '', tokenStatus: '未检测' })

const getPosts = async (email: string, password: string, client_id: string, refresh_token: string, mailbox: string) => {
  postLoading.value = true
  try {
    const response = await fetch('/api/mail_all', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password, client_id, refresh_token, mailbox }),
    })
    const data = await response.json()
    if (data.code == 200) {
      postList.value = data.data
      localStorage.setItem(nowPost.value.email + boxType.value, JSON.stringify(postList.value))
      ElMessage.success('收取成功')
    } else {
      ElMessage.error(data.message || '收取失败')
    }
  } catch (_error) {
    ElMessage.error('收取失败')
  }
  postLoading.value = false
}

const handlePost = (row: Email) => {
  nowPost.value = row
  postList.value = JSON.parse(localStorage.getItem(row.email + boxType.value) || '[]')
  getPosts(row.email, row.password, row.client_id, row.refresh_token, boxType.value)
  dialogEmailVisible.value = true
}

const handleInbox = (row: Email) => {
  boxType.value = 'INBOX'
  postTitle.value = `${row.email} 的收件箱`
  handlePost(row)
}

const handleTrash = (row: Email) => {
  boxType.value = 'Junk'
  postTitle.value = `${row.email} 的垃圾箱`
  handlePost(row)
}

const handleReceive = () => {
  const { email, password, client_id, refresh_token } = nowPost.value
  getPosts(email, password, client_id, refresh_token, boxType.value)
}

const clearPosts = (email: string, password: string, client_id: string, refresh_token: string, mailbox: string) => {
  fetch('/api/process-mailbox', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password, client_id, refresh_token, mailbox }),
  })
}

const handleClear = () => {
  ElMessageBox.confirm(`确认清空邮箱 ${nowPost.value.email} 的所有邮件吗？`, '清空确认', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      postList.value = []
      localStorage.setItem(nowPost.value.email + boxType.value, JSON.stringify(postList.value))
      clearPosts(nowPost.value.email, nowPost.value.password, nowPost.value.client_id, nowPost.value.refresh_token, boxType.value)
      ElMessage.success('邮箱正在清空中... 请稍后查看')
    })
    .catch(() => undefined)
}

const dialogPostVisible = ref(false)
const dialogEmailContent = ref('')
const viewPost = (post: Post) => {
  dialogPostVisible.value = true
  dialogEmailContent.value = post.html
}
</script>

<style scoped>
.email-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar-card,
.table-card {
  border: none;
  border-radius: 16px;
}

.table-card :deep(.el-card__body) {
  padding: 14px 16px;
}

.custom-upload :deep(.el-upload__tip),
.custom-upload :deep(.el-upload__list) {
  display: none;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}
</style>

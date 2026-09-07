<!-- src/components/UpdateNotification.vue -->
<template>
  <el-dialog
    v-model="dialogVisible"
    title="🎉 网站已更新"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    width="520px"
    top="15vh"
    destroy-on-close
  >
    <div class="update-content">
      <div class="update-meta">
        <el-tag size="small" type="info">
          版本：{{ versionInfo?.version }}
        </el-tag>
        <span class="update-time">
          {{ formatTime(versionInfo?.buildTime) }}
        </span>
      </div>

      <div v-if="versionInfo?.releaseNotes?.length" class="release-notes">
        <p class="notes-title">📋 更新内容</p>
        <div
          v-for="(note, index) in versionInfo.releaseNotes"
          :key="index"
          class="note-item"
        >
          <span v-html="highlightNote(note)" />
        </div>
      </div>

      <div v-else class="release-notes">
        <p class="notes-empty">暂无更新备注</p>
      </div>
    </div>

    <template #footer>
      <el-button @click="handleLater">稍后刷新</el-button>
      <el-button type="primary" @click="handleRefresh"> 立即刷新 </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { ElMessage } from 'element-plus';
import { updateChecker, type VersionInfo } from '@/utils/updateChecker';

const dialogVisible = ref(false);
const versionInfo = ref<VersionInfo | null>(null);

// 显示更新弹窗
function showUpdate(info: VersionInfo) {
  versionInfo.value = info;
  dialogVisible.value = true;
}

// 立即刷新
function handleRefresh() {
  if (versionInfo.value) {
    updateChecker.markAsSeen(versionInfo.value.version);
  }
  // 强制刷新，绕过缓存
  window.location.reload();
}

// 稍后刷新
function handleLater() {
  if (versionInfo.value) {
    // 标记为已读，避免重复弹窗
    updateChecker.markAsSeen(versionInfo.value.version);
    // 恢复轮询
    updateChecker.resume();
  }
  dialogVisible.value = false;
  ElMessage.info('可在下次空闲时手动刷新页面获取更新');
}

// 格式化时间
function formatTime(time?: string): string {
  if (!time) return '';
  const date = new Date(time);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// 高亮备注中的关键词（简单示例）
function highlightNote(note: string): string {
  // 将 emoji 和文字区分显示，可自定义
  return note;
}

// 初始化检测器
onMounted(() => {
  updateChecker.init((info) => {
    showUpdate(info);
  }, 60000); // 60 秒检测一次
});

// 组件销毁时清理
onUnmounted(() => {
  updateChecker.destroy();
});
</script>

<style scoped>
.update-content {
  padding: 4px 0;
}

.update-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
  margin-bottom: 16px;
}

.update-time {
  color: var(--el-text-color-secondary);
  font-size: 13px;
}

.release-notes {
  max-height: 300px;
  overflow-y: auto;
}

.notes-title {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 12px;
  color: var(--el-text-color-primary);
}

.note-item {
  padding: 8px 12px;
  margin-bottom: 6px;
  border-radius: 6px;
  background: var(--el-fill-color-light);
  font-size: 14px;
  line-height: 1.6;
  transition: background 0.2s;
}

.note-item:hover {
  background: var(--el-fill-color);
}

.note-item:last-child {
  margin-bottom: 0;
}

.notes-empty {
  color: var(--el-text-color-secondary);
  font-size: 14px;
  text-align: center;
  padding: 20px 0;
}

/* 滚动条优化 */
.release-notes::-webkit-scrollbar {
  width: 4px;
}

.release-notes::-webkit-scrollbar-track {
  background: transparent;
}

.release-notes::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 4px;
}

.release-notes::-webkit-scrollbar-thumb:hover {
  background: var(--el-border-color-darker);
}
</style>

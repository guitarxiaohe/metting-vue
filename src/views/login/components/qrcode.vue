<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import QRCode from 'qrcode';
import { getWxQrCode, getWxScanStatus } from '@/api/modules/wechat';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const emit = defineEmits<{
  'login-success': [token: string];
  back: [];
}>();

/******************************** 状态 ********************************/

type QrStatus =
  | 'loading'
  | 'ready'
  | 'scanning'
  | 'scanned'
  | 'expired'
  | 'error';

const qrStatus = ref<QrStatus>('loading');
const qrDataUrl = ref('');
const uuid = ref('');
const errorMsg = ref('');
const expireCountdown = ref(0);

let pollTimer: ReturnType<typeof setInterval> | null = null;
let countdownTimer: ReturnType<typeof setInterval> | null = null;

/******************************** 生成二维码 ********************************/

const generateQR = async (text: string): Promise<string> => {
  return QRCode.toDataURL(text, {
    width: 240,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });
};

/******************************** 获取 UUID 并生成二维码 ********************************/

const fetchUUID = async () => {
  qrStatus.value = 'loading';
  errorMsg.value = '';
  qrDataUrl.value = '';
  uuid.value = '';

  try {
    const res = await getWxQrCode();
    const data = res.data;
    if (!data?.uuid) {
      throw new Error('获取二维码失败');
    }
    uuid.value = data.uuid;

    // 生成二维码内容：小程序普通链接二维码规则匹配的 URL
    // 微信扫码后会打开对应小程序，小程序路径及参数由后台规则映射
    const qrContent =
      data.qrUrl || `https://www.guitarxiaohe.top/wx/${data.uuid}`;
    console.log('qrContent ==>', qrContent);
    qrDataUrl.value = await generateQR(qrContent);

    // 设置过期倒计时（后端返回秒，默认 180 秒 = 3 分钟）
    expireCountdown.value = data.expireSeconds ?? 180;

    qrStatus.value = 'ready';
    startPolling();
    startCountdown();
  } catch (err: any) {
    qrStatus.value = 'error';
    errorMsg.value = err?.msg || err?.message || t('common.error');
  }
};

/******************************** 轮询扫码状态 ********************************/

const startPolling = () => {
  stopPolling();
  pollTimer = setInterval(async () => {
    if (!uuid.value) return;

    try {
      const res = await getWxScanStatus(uuid.value);
      const data = res.data;
      if (!data) return;

      if (data.status === 'SCANNING') {
        qrStatus.value = 'scanning';
      } else if (data.status === 'CONFIRMED') {
        qrStatus.value = 'scanned';
        stopPolling();
        stopCountdown();

        if (data.token) {
          const token = data.token;
          localStorage.setItem('token', token);
          setTimeout(() => {
            emit('login-success', token);
          }, 1000);
        }
      } else if (data.status === 'EXPIRED') {
        qrStatus.value = 'expired';
        stopPolling();
        stopCountdown();
      }
    } catch {
      // 轮询失败不中断，继续尝试
    }
  }, 2000);
};

const stopPolling = () => {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
};

/******************************** 倒计时 ********************************/

const startCountdown = () => {
  stopCountdown();
  countdownTimer = setInterval(() => {
    if (expireCountdown.value > 0) {
      expireCountdown.value--;
    } else {
      qrStatus.value = 'expired';
      stopPolling();
      stopCountdown();
    }
  }, 1000);
};

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

/******************************** 刷新二维码 ********************************/

const refresh = () => {
  stopPolling();
  stopCountdown();
  fetchUUID();
};

/******************************** 生命周期 ********************************/

onMounted(() => {
  fetchUUID();
});

onUnmounted(() => {
  stopPolling();
  stopCountdown();
});
</script>

<template>
  <div class="wx-qrcode flex flex-col items-center justify-center gap-4">
    <!-- 加载中 -->
    <div
      v-if="qrStatus === 'loading'"
      class="qr-loading flex flex-col items-center gap-3"
    >
      <div class="qr-spinner" />
      <span class="text-sm text-gray-500">{{ t('common.loading') }}...</span>
    </div>

    <!-- 二维码 -->
    <div
      v-else-if="
        qrStatus === 'ready' ||
        qrStatus === 'scanning' ||
        qrStatus === 'scanned'
      "
      class="qr-wrapper relative"
    >
      <img
        :src="qrDataUrl"
        alt="微信扫码登录二维码"
        class="qr-image"
        :class="{
          'qr-masked': qrStatus === 'scanning' || qrStatus === 'scanned',
        }"
      />
      <!-- 扫码确认中遮罩 -->
      <div
        v-if="qrStatus === 'scanning'"
        class="qr-scan-overlay absolute inset-0 flex flex-col items-center justify-center rounded-lg"
      >
        <div class="qr-spinner" />
        <span class="text-sm text-blue-600 font-medium mt-2"
          >已扫码，确认中...</span
        >
      </div>
      <!-- 登录成功遮罩 -->
      <div
        v-if="qrStatus === 'scanned'"
        class="qr-scan-overlay absolute inset-0 flex flex-col items-center justify-center rounded-lg"
      >
        <div class="qr-scan-check">✓</div>
        <span class="text-sm text-green-600 font-medium mt-2">登录成功</span>
      </div>
    </div>

    <!-- 已过期 -->
    <div
      v-else-if="qrStatus === 'expired'"
      class="qr-expired flex flex-col items-center gap-3"
    >
      <div class="qr-expired-icon">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#999"
          stroke-width="1.5"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <span class="text-sm text-gray-500">二维码已过期</span>
      <button class="qr-refresh-btn" @click="refresh">点击刷新</button>
    </div>

    <!-- 错误 -->
    <div
      v-else-if="qrStatus === 'error'"
      class="qr-error flex flex-col items-center gap-3"
    >
      <span class="text-sm text-red-500">{{ errorMsg }}</span>
      <button class="qr-refresh-btn" @click="refresh">重试</button>
    </div>

    <!-- 提示文字 -->
    <div v-if="qrStatus === 'ready'" class="qr-tips text-center">
      <p class="text-sm text-gray-600">打开微信扫描二维码登录</p>
      <p class="text-xs text-gray-400 mt-1">
        有效期 {{ Math.floor(expireCountdown / 60) }}:{{
          String(expireCountdown % 60).padStart(2, '0')
        }}
      </p>
    </div>

    <!-- 返回账号登录 -->
    <button
      class="qr-back-btn text-sm text-gray-400 hover:text-gray-600"
      @click="emit('back')"
    >
      返回账号密码登录
    </button>
  </div>
</template>

<style lang="scss" scoped>
.wx-qrcode {
  padding: 2rem;
}

.qr-wrapper {
  padding: 1rem;
  background: #fff;
  border-radius: 0.75rem;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.qr-image {
  width: 240px;
  height: 240px;
  transition:
    opacity 0.3s,
    filter 0.3s;

  &.qr-masked {
    opacity: 0.3;
    filter: blur(4px);
  }
}

.qr-scan-overlay {
  background: rgba(255, 255, 255, 0.85);

  .qr-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  .qr-scan-check {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: #52c41a;
    color: #fff;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: bold;
  }
}

.qr-refresh-btn {
  padding: 0.5rem 1.5rem;
  border: 1px solid var(--color-primary, #6c3ff5);
  border-radius: 0.5rem;
  background: transparent;
  color: var(--color-primary, #6c3ff5);
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;

  &:hover {
    background: var(--color-primary, #6c3ff5);
    color: #fff;
  }
}

.qr-back-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  transition: color 0.2s;
}

.qr-loading {
  .qr-spinner {
    width: 40px;
    height: 40px;
    border: 3px solid #e5e7eb;
    border-top-color: var(--color-primary, #6c3ff5);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>

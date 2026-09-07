// src/utils/updateChecker.ts
export interface VersionInfo {
  version: string;
  hash: string;
  branch: string;
  releaseNotes: string[];
  buildTime: string;
}

export type UpdateCallback = (info: VersionInfo) => void;

class UpdateChecker {
  private currentVersion: string | null = null;
  private timer: number | null = null;
  private isChecking = false;
  private onUpdateCallback: UpdateCallback | null = null;
  private interval = 60000; // 默认 60 秒

  /**
   * 初始化检测器
   * @param onUpdate 发现更新时的回调
   * @param interval 轮询间隔（毫秒）
   */
  init(onUpdate: UpdateCallback, interval = 60000) {
    this.onUpdateCallback = onUpdate;
    this.interval = interval;

    // 从 localStorage 恢复已读版本
    const seen = localStorage.getItem('lastSeenVersion');
    if (seen) {
      this.currentVersion = seen;
    }

    // 首次检测
    this.check().then(() => {
      this.startPolling();
    });

    // 页面可见性变化时立即检测
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  }

  /**
   * 销毁检测器
   */
  destroy() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    document.removeEventListener(
      'visibilitychange',
      this.handleVisibilityChange
    );
  }

  /**
   * 暂停检测
   */
  pause() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  /**
   * 恢复检测
   */
  resume() {
    if (!this.timer) {
      this.startPolling();
    }
  }

  /**
   * 标记版本为已读
   */
  markAsSeen(version: string) {
    localStorage.setItem('lastSeenVersion', version);
    this.currentVersion = version;
  }

  /**
   * 获取当前版本
   */
  getCurrentVersion(): string | null {
    return this.currentVersion;
  }

  /**
   * 手动检测更新
   */
  async check(): Promise<VersionInfo | null> {
    if (this.isChecking) return null;
    this.isChecking = true;

    try {
      const resp = await fetch(`/version.json?t=${Date.now()}`, {
        headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const data: VersionInfo = await resp.json();

      // 首次加载，记录版本
      if (!this.currentVersion) {
        this.currentVersion = data.version;
        this.isChecking = false;
        return data;
      }

      // 检查是否已读此版本
      const seen = localStorage.getItem('lastSeenVersion');
      if (seen === data.version) {
        this.currentVersion = data.version;
        this.isChecking = false;
        return data;
      }

      // 发现新版本
      if (data.version !== this.currentVersion) {
        // 暂停轮询，等待用户操作
        this.pause();
        this.onUpdateCallback?.(data);
        this.isChecking = false;
        return data;
      }

      this.isChecking = false;
      return data;
    } catch (error) {
      console.warn('[UpdateChecker] 版本检测失败:', error);
      this.isChecking = false;
      return null;
    }
  }

  private startPolling() {
    if (this.timer) {
      clearInterval(this.timer);
    }
    this.timer = window.setInterval(() => {
      this.check();
    }, this.interval);
  }

  private handleVisibilityChange = () => {
    if (!document.hidden) {
      this.check();
    }
  };
}

// 导出单例
export const updateChecker = new UpdateChecker();

import type { Component } from 'vue';

/******************************** 动态组件工具 ********************************/

// 仅允许真正的组件对象或函数进入 `:is` / `h(...)`
export function resolveSafeComponent(value: unknown): Component | null {
  if (typeof value === 'function') {
    return value as Component;
  }

  if (value != null && typeof value === 'object') {
    return value as Component;
  }

  return null;
}

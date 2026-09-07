// scripts/vite-plugin-version.ts
import type { Plugin } from 'vite';
import { execSync } from 'child_process';
import fs from 'fs';

export function versionPlugin(): Plugin {
  return {
    name: 'vite-plugin-version',
    buildStart() {
      // 生成 version.json 到 public 目录
      const hash = execSync('git rev-parse --short HEAD', {
        encoding: 'utf-8',
      }).trim();
      const logs = execSync('git log -3 --pretty=format:"%s"', {
        encoding: 'utf-8',
      })
        .split('\n')
        .filter(Boolean);

      const releaseNotes = logs.map((msg) => {
        if (msg.startsWith('feat'))
          return `✨ 新增：${msg.replace(/^feat:\s*/, '')}`;
        if (msg.startsWith('fix'))
          return `🐛 修复：${msg.replace(/^fix:\s*/, '')}`;
        return `📌 ${msg}`;
      });

      const versionInfo = {
        version: `${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}-${hash}`,
        hash,
        releaseNotes,
        buildTime: new Date().toISOString(),
      };

      const publicDir = './public';
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      fs.writeFileSync(
        `${publicDir}/version.json`,
        JSON.stringify(versionInfo, null, 2)
      );
      console.log(`✅ [version-plugin] 版本: ${versionInfo.version}`);
    },
  };
}

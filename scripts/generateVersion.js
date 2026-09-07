// scripts/generateVersion.js
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 获取 Git 信息
function getGitInfo() {
  try {
    const hash = execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
    }).trim();
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      encoding: 'utf-8',
    }).trim();

    // 获取最近 5 条 commit，按类型分类
    const logs = execSync('git log -5 --pretty=format:"%s"', {
      encoding: 'utf-8',
    })
      .split('\n')
      .filter(Boolean);

    // 解析 commit 信息
    const releaseNotes = logs.map((msg) => {
      // 支持 conventional commits 格式
      if (msg.startsWith('feat'))
        return `✨ 新增：${msg.replace(/^feat(\([^)]+\))?:\s*/, '')}`;
      if (msg.startsWith('fix'))
        return `🐛 修复：${msg.replace(/^fix(\([^)]+\))?:\s*/, '')}`;
      if (msg.startsWith('perf'))
        return `⚡ 优化：${msg.replace(/^perf(\([^)]+\))?:\s*/, '')}`;
      if (msg.startsWith('docs'))
        return `📝 文档：${msg.replace(/^docs(\([^)]+\))?:\s*/, '')}`;
      if (msg.startsWith('style'))
        return `💄 样式：${msg.replace(/^style(\([^)]+\))?:\s*/, '')}`;
      if (msg.startsWith('refactor'))
        return `♻️ 重构：${msg.replace(/^refactor(\([^)]+\))?:\s*/, '')}`;
      if (msg.startsWith('chore'))
        return `🔧 杂务：${msg.replace(/^chore(\([^)]+\))?:\s*/, '')}`;
      return `📌 ${msg}`;
    });

    return {
      version: `${new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14)}-${hash}`,
      hash,
      branch,
      releaseNotes,
      buildTime: new Date().toISOString(),
    };
  } catch (e) {
    // 不在 Git 仓库中时的降级方案
    return {
      version: new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14),
      hash: 'unknown',
      branch: 'unknown',
      releaseNotes: ['📌 版本更新'],
      buildTime: new Date().toISOString(),
    };
  }
}

// 写入 public 目录
function generateVersionFile() {
  const info = getGitInfo();
  const targetPath = path.resolve(__dirname, '../public/version.json');

  // 确保目录存在
  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(targetPath, JSON.stringify(info, null, 2), 'utf-8');
  console.log(`✅ 已生成 version.json: ${info.version}`);
  console.log(`📝 更新备注: ${info.releaseNotes.join(' | ')}`);
}

generateVersionFile();

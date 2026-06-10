import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV === 'development';

/**
 * 部署基础路径
 *
 * 通过 BASE_PATH 环境变量控制：
 * - Vercel 根目录部署：不设置（默认 ''）
 * - GitHub Pages 二级目录：BASE_PATH=/wanjie-MUD
 *
 * 开发环境始终使用根路径（''）
 */
const basePath = isDev ? '' : (process.env.BASE_PATH || '');

const nextConfig: NextConfig = {
  // 尾部斜杠
  trailingSlash: true,

  // 指定工作区根目录，避免多 lockfile 警告
  turbopack: {
    root: __dirname,
  },

  // 部署路径前缀
  basePath,

  // 服务端模式，支持 API Routes
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

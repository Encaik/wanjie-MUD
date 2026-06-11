import type { NextConfig } from 'next';

/**
 * Next.js 配置
 *
 * Docker 容器化部署，使用 standalone 模式输出自包含构建产物。
 */
const nextConfig = {
  // Docker standalone 独立运行模式
  output: 'standalone',

  // Docker 容器内无 sharp，禁用图片优化
  images: {
    unoptimized: true,
  },

  // Turbopack 配置：显式指定项目根目录，防止误判
  turbopack: {
    root: __dirname,
  },

  // 服务端外部包：这些包不会被打包，运行时通过 Node.js require 加载
  // better-sqlite3 为原生模块，sql.js 为 WASM 模块，均不可打包
  serverExternalPackages: ['better-sqlite3', 'sql.js'],

  // sql.js 需要 WASM 文件在运行时可用
  // standalone 模式下文件追踪不会自动包含 WASM，需要显式声明
  outputFileTracingIncludes: {
    '/api/**/*': ['./node_modules/sql.js/dist/*.wasm'],
  },
};

export default nextConfig as NextConfig;

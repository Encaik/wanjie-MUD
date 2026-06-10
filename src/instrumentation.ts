/**
 * Next.js 服务端启动钩子
 *
 * 服务进程启动时自动初始化世界系统（加载 Mod 数据到注册中心），
 * 确保首个 API 请求到达前数据已就绪。
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // 动态导入，确保仅在 Node.js 服务端执行（不在 Edge / 浏览器 bundle 中）
    const { ensureWorldSystemInitialized } = await import('@/app/api/init');
    const { createLogger } = await import('@/core/logger');
    const log = createLogger('Instrumentation');
    ensureWorldSystemInitialized();
    log.info('世界系统已随服务启动自动初始化');
  }
}

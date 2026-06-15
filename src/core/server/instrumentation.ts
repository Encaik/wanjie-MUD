/**
 * Next.js 服务端启动钩子
 *
 * 服务进程启动时自动初始化世界系统（加载 Mod 数据到注册中心），
 * 仅在 Node.js 运行时执行（instrumentation.ts 为 Next.js 服务端专属钩子）。
 */
import { ensureWorldSystemInitialized } from '@/app/api/init';
import { createLogger } from '@/core/logger';

const log = createLogger('Instrumentation');

export async function register() {
  await ensureWorldSystemInitialized();
  log.info('世界系统已随服务启动自动初始化');
}

/**
 * GET /api/v1/status
 *
 * 服务状态探测接口，可用于健康检查和前后端连通性测试。
 */

import { apiSuccess, apiError } from '@/app/api/result';

/** 服务端运行时信息 */
interface StatusData {
  /** 是否在线 */
  online: boolean;
  /** 服务器时间（ISO 字符串） */
  serverTime: string;
  /** 运行模式 */
  mode: 'development' | 'production';
}

/**
 * GET /api/v1/status
 *
 * @example
 * curl http://localhost:3000/api/v1/status
 * → { code: 200, data: { online: true, ... }, message: "ok" }
 */
export async function GET() {
  try {
    const data: StatusData = {
      online: true,
      serverTime: new Date().toISOString(),
      mode: process.env.NODE_ENV === 'development' ? 'development' : 'production',
    };
    return apiSuccess(data);
  } catch {
    return apiError(500, '服务器内部错误');
  }
}

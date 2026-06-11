/**
 * 前端 API 调用客户端
 *
 * 封装 fetch，自动拼接 basePath、处理统一 ApiResult 返回格式。
 * 服务于浏览器端代码，与 src/app/api/result.ts 配套。
 *
 * @example
 * // GET 请求
 * const res = await get<UserInfo>('/api/v1/user/info');
 * if (res.code === 200) { console.log(res.data.nickname); }
 *
 * @example
 * // POST 请求
 * const res = await post<UserInfo>('/api/v1/user/login', { username: 'test' });
 * if (res.code !== 200) { showError(res.message); }
 */

import type { ApiResult } from '@/app/api/result';

// ============================================
// 配置
// ============================================

/** 请求超时时间（毫秒） */
const DEFAULT_TIMEOUT = 15_000;

// ============================================
// 内部工具
// ============================================

/**
 * 获取 API 请求基础 URL
 *
 * 优先级：
 *   1. NEXT_PUBLIC_API_BASE_URL — 完整 URL（如 http://172.16.11.0:3000），用于测试/跨域
 *   2. NEXT_PUBLIC_BASE_PATH    — 路径前缀（如 /wanjie-MUD），用于子目录部署
 *   3. 空字符串                   — 同域请求
 */
function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  return process.env.NEXT_PUBLIC_BASE_PATH || '';
}

// ============================================
// 核心请求函数
// ============================================

/**
 * 发送 API 请求
 *
 * 自动拼接 basePath，统一返回 ApiResult。
 * 网络错误、超时、HTTP 非 2xx 均被包装为 error 结果，不会 throw。
 *
 * @param endpoint - API 路径，如 `/api/v1/user/info`
 * @param options  - 标准 fetch 选项
 * @returns 始终返回 ApiResult，永远不会 reject
 */
export async function request<T = null>(
  endpoint: string,
  options?: RequestInit & { timeout?: number },
): Promise<ApiResult<T>> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const timeout = options?.timeout ?? DEFAULT_TIMEOUT;

  // 超时控制
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: options?.signal ?? controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timer);

    // HTTP 状态码非 2xx
    if (!response.ok) {
      try {
        const errorBody = await response.json() as ApiResult;
        return {
          code: errorBody.code || response.status,
          data: null as T,
          message: errorBody.message || `HTTP ${response.status}`,
        };
      } catch {
        return {
          code: response.status,
          data: null as T,
          message: `请求失败 (${response.status})`,
        };
      }
    }

    // 解析 JSON body
    const body = (await response.json()) as ApiResult<T>;

    return {
      code: body.code ?? 200,
      data: body.data as T,
      message: body.message ?? 'ok',
    };
  } catch (err: unknown) {
    clearTimeout(timer);

    // 区分超时、网络错误
    if (err instanceof DOMException && err.name === 'AbortError') {
      return {
        code: -1,
        data: null as T,
        message: `请求超时（${timeout / 1000}s）`,
      };
    }

    return {
      code: -2,
      data: null as T,
      message: err instanceof Error ? `网络错误：${err.message}` : '未知网络错误',
    };
  }
}

// ============================================
// 便捷方法
// ============================================

/**
 * GET 请求
 *
 * @example
 * const { code, data } = await get<UserList>('/api/v1/users?page=1');
 */
export function get<T = null>(endpoint: string, options?: RequestInit): Promise<ApiResult<T>> {
  return request<T>(endpoint, { ...options, method: 'GET' });
}

/**
 * POST 请求
 *
 * @example
 * const { code, data, message } = await post('/api/v1/user/login', { username: 'test' });
 */
export async function post<T = null>(
  endpoint: string,
  body?: unknown,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  return request<T>(endpoint, {
    ...options,
    method: 'POST',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * PUT 请求
 */
export async function put<T = null>(
  endpoint: string,
  body?: unknown,
  options?: RequestInit,
): Promise<ApiResult<T>> {
  return request<T>(endpoint, {
    ...options,
    method: 'PUT',
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

/**
 * DELETE 请求
 */
export function del<T = null>(endpoint: string, options?: RequestInit): Promise<ApiResult<T>> {
  return request<T>(endpoint, { ...options, method: 'DELETE' });
}

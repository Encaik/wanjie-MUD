/**
 * 统一 API 返回格式
 *
 * 所有服务端接口必须使用此格式返回数据，确保前后端契约一致。
 *
 * ┌─────────────┬──────────────────────────────────────────┐
 * │ code        │ 说明                                     │
 * ├─────────────┼──────────────────────────────────────────┤
 * │ 200         │ 成功                                     │
 * │ 400         │ 请求参数错误                             │
 * │ 401         │ 未登录 / 身份过期                       │
 * │ 403         │ 无权限                                   │
 * │ 404         │ 资源不存在                               │
 * │ 409         │ 业务冲突（如重复操作）                   │
 * │ 500         │ 服务端内部错误                           │
 * ├─────────────┼──────────────────────────────────────────┤
 * │ < 0（负数） │ 前端本地错误（网络断开、超时等）         │
 * └─────────────┴──────────────────────────────────────────┘
 */

import { NextResponse } from 'next/server';

// ============================================
// 类型定义
// ============================================

/** 统一 API 响应结构 */
export interface ApiResult<T = null> {
  /** 状态码，200 表示成功，其余见上表 */
  code: number;
  /** 响应数据，失败时为 null */
  data: T;
  /** 人类可读的提示信息 */
  message: string;
}

// ============================================
// 服务端响应工具函数
// ============================================

/**
 * 构建成功响应
 *
 * @example
 * return apiSuccess({ name: '张三' });
 * return apiSuccess(null, '操作成功');
 */
export function apiSuccess<T>(data: T, message = 'ok', status = 200): NextResponse<ApiResult<T>> {
  return NextResponse.json(
    { code: 200, data, message },
    { status },
  );
}

/**
 * 构建失败响应
 *
 * @example
 * return apiError(400, '缺少必要参数 name');
 * return apiError(401, '请先登录');
 * return apiError(500, '服务器内部错误，请稍后重试');
 */
export function apiError(code: number, message: string, status?: number): NextResponse<ApiResult<null>> {
  return NextResponse.json(
    { code, data: null, message },
    { status: status ?? (code >= 100 && code < 600 ? code : 500) },
  );
}

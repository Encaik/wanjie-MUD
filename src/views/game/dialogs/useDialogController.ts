/**
 * useDialogController — 声明式弹窗管理
 *
 * 提供 open/close API，任何组件可调用。
 * DialogLayer 统一渲染活跃弹窗。
 */

'use client';

import { useState, useCallback, useEffect } from 'react';

/** 弹窗类型 */
export type DialogType =
  | 'resetConfirm'
  | 'exitAdventure'
  | 'upgrade'
  | 'pathSelect'
  | 'settings'
  | 'dev'
  | 'guardianBattle'
  | 'inheritanceSelect'
  | 'worldReveal'
  | 'noviceComplete'
  | 'tutorialComplete'
  | 'questDialog'
  | 'death';

/** 弹窗条目 */
export interface DialogEntry {
  id: string;
  type: DialogType;
  props: Record<string, unknown>;
}

/** 模块级弹窗注册表（避免 React state 批量重渲染） */
let dialogIdCounter = 0;
let activeDialogs: DialogEntry[] = [];
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach(fn => fn());
}

export function openDialog(type: DialogType, props?: Record<string, unknown>): string {
  const id = `dialog_${++dialogIdCounter}`;
  // 同类型弹窗覆盖
  activeDialogs = activeDialogs.filter(d => d.type !== type);
  activeDialogs = [...activeDialogs, { id, type, props: props || {} }];
  notifyListeners();
  return id;
}

export function closeDialog(type: DialogType) {
  activeDialogs = activeDialogs.filter(d => d.type !== type);
  notifyListeners();
}

export function getActiveDialogs(): DialogEntry[] {
  return activeDialogs;
}

/**
 * React Hook：订阅弹窗注册表变化
 */
export function useDialogController() {
  const [, setTick] = useState(0);

  // 订阅模块级弹窗注册表变化，触发重渲染
  useEffect(() => {
    const listener = () => setTick(t => t + 1);
    listeners.add(listener);
    return () => { listeners.delete(listener); };
  }, []);

  const open = useCallback((type: DialogType, props?: Record<string, unknown>) => {
    return openDialog(type, props);
  }, []);

  const close = useCallback((type: DialogType) => {
    closeDialog(type);
  }, []);

  const getActive = useCallback(() => activeDialogs, []);

  return { open, close, getActive, activeDialogs };
}

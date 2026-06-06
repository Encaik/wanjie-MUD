/**
 * 存档安全工具集
 * 实现原子写入、备份和错误恢复
 */

import { GameState } from '../types';

const STORAGE_KEY = 'gameState';
const BACKUP_KEY = 'gameState_backup';
const TEMP_KEY = 'gameState_temp';

/** 存档空间限制（5MB，预留0.5MB） */
const STORAGE_LIMIT = 4.5 * 1024 * 1024;

/** 存档结果 */
export interface SaveResult {
  success: boolean;
  error?: string;
  compressed?: boolean;
}

/**
 * 检查存储空间是否足够
 */
function checkStorageSpace(additionalSize: number): boolean {
  try {
    const usedSpace = JSON.stringify(localStorage).length;
    return usedSpace + additionalSize < STORAGE_LIMIT;
  } catch {
    return false;
  }
}

/**
 * 压缩游戏状态（减少消息历史）
 */
function compressGameState(state: GameState): GameState {
  return {
    ...state,
    messages: state.messages.slice(0, 50), // 只保留最新50条消息
  };
}

/**
 * 安全存档函数
 * 实现：备份 + 原子写入 + 错误回滚
 */
export function safeSaveGameState(state: GameState): SaveResult {
  try {
    const json = JSON.stringify(state);
    
    // 1. 检查存储空间
    if (!checkStorageSpace(json.length)) {
      // 尝试压缩后保存
      const compressedState = compressGameState(state);
      const compressedJson = JSON.stringify(compressedState);
      
      if (!checkStorageSpace(compressedJson.length)) {
        return { success: false, error: '存储空间不足，请清理浏览器缓存后重试' };
      }
      
      // 压缩后继续保存
      return saveToStorage(compressedJson, true);
    }
    
    return saveToStorage(json, false);
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    return { success: false, error };
  }
}

/**
 * 实际写入存储
 */
function saveToStorage(json: string, compressed: boolean): SaveResult {
  try {
    // 2. 备份当前存档
    const currentSave = localStorage.getItem(STORAGE_KEY);
    if (currentSave) {
      localStorage.setItem(BACKUP_KEY, currentSave);
    }
    
    // 3. 原子写入（先写临时文件）
    localStorage.setItem(TEMP_KEY, json);
    
    // 4. 切换（原子操作模拟）
    localStorage.removeItem(STORAGE_KEY);
    localStorage.setItem(STORAGE_KEY, json);
    localStorage.removeItem(TEMP_KEY);
    
    return { success: true, compressed };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    
    // 5. 回滚
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      try {
        localStorage.setItem(STORAGE_KEY, backup);
      } catch (rollbackError) {
        console.error('[SaveUtils] Rollback failed:', rollbackError);
      }
    }
    
    // 清理临时文件
    try {
      localStorage.removeItem(TEMP_KEY);
    } catch {}
    
    return { success: false, error };
  }
}

/**
 * 加载游戏状态（带恢复）
 */
export function loadGameStateWithRecovery(): GameState | null {
  try {
    // 尝试加载主存档
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // 验证基本结构
      if (parsed && typeof parsed.phase === 'string') {
        return parsed as GameState;
      }
    }
    
    // 主存档损坏或不存在，尝试备份
    console.warn('[SaveUtils] Main save corrupted or missing, trying backup...');
    const backup = localStorage.getItem(BACKUP_KEY);
    if (backup) {
      const parsed = JSON.parse(backup);
      if (parsed && typeof parsed.phase === 'string') {
        // 恢复主存档
        localStorage.setItem(STORAGE_KEY, backup);
        console.log('[SaveUtils] Restored from backup');
        return parsed as GameState;
      }
    }
    
    return null;
  } catch (e) {
    console.error('[SaveUtils] Load failed:', e);
    
    // 尝试备份恢复
    try {
      const backup = localStorage.getItem(BACKUP_KEY);
      if (backup) {
        const parsed = JSON.parse(backup);
        if (parsed && typeof parsed.phase === 'string') {
          localStorage.setItem(STORAGE_KEY, backup);
          return parsed as GameState;
        }
      }
    } catch {}
    
    return null;
  }
}

/**
 * 清理所有存档数据
 */
export function clearAllSaveData(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(BACKUP_KEY);
    localStorage.removeItem(TEMP_KEY);
  } catch (e) {
    console.error('[SaveUtils] Clear failed:', e);
  }
}

/**
 * 导出存档为字符串
 */
export function exportSaveToString(state: GameState): string {
  try {
    return JSON.stringify(state);
  } catch (e) {
    console.error('[SaveUtils] Export failed:', e);
    return '';
  }
}

/**
 * 从字符串导入存档
 */
export function importSaveFromString(jsonString: string): GameState | null {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && typeof parsed.phase === 'string') {
      return parsed as GameState;
    }
    return null;
  } catch (e) {
    console.error('[SaveUtils] Import failed:', e);
    return null;
  }
}

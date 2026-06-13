/**
 * 对话引擎
 *
 * 处理 NPC 对话选项分支、核心值门槛、CRPG 检定集成。
 * 纯函数集合，不依赖 React。
 *
 * @module modules/npc/logic
 */

import type {
  NPCDefinition,
  NPCDialogueLine,
  NPCDialogueOption,
  StatGate,
  CoreStatKey,
  DialogueCheck,
} from '@/core/types';

// ============================================
// 选项评估结果
// ============================================

/** 单个选项的评估结果 */
export interface OptionEvaluation {
  /** 选项 ID */
  optionId: string;
  /** 选项文本 */
  text: string;
  /** 是否可用 */
  available: boolean;
  /** 不可用原因（available=false 时填充） */
  disabledReason?: string;
  /** 态度门槛是否通过 */
  attitudePassed: boolean;
  /** 核心值门槛评估详情 */
  gateResults: GateResult[];
  /** 是否有 CRPG 检定 */
  hasCheck: boolean;
  /** 跳转目标（available=true 时有效） */
  resultBranch?: string;
}

/** 单个核心值门槛的评估结果 */
export interface GateResult {
  coreStat: CoreStatKey;
  required: number;
  current: number;
  passed: boolean;
  failureHint: string;
}

// ============================================
// 核心值门槛评估
// ============================================

/**
 * 检查选项的所有 statGates，返回每个门槛的评估结果
 *
 * @param option - 对话选项
 * @param coreStats - 角色的核心值
 * @returns 门槛评估结果数组
 */
export function evaluateOptionGates(
  option: NPCDialogueOption,
  coreStats: Record<CoreStatKey, number>,
): GateResult[] {
  if (!option.statGates || option.statGates.length === 0) return [];

  return option.statGates.map((gate: StatGate) => ({
    coreStat: gate.coreStat,
    required: gate.minValue,
    current: coreStats[gate.coreStat] ?? 0,
    passed: (coreStats[gate.coreStat] ?? 0) >= gate.minValue,
    failureHint: gate.failureHint,
  }));
}

/**
 * 检查选项的所有 statGates 是否全部通过
 */
export function allGatesPassed(gateResults: GateResult[]): boolean {
  return gateResults.length === 0 || gateResults.every(g => g.passed);
}

/**
 * 获取首个不达标的门槛（用于显示失败提示）
 */
export function firstFailedGate(gateResults: GateResult[]): GateResult | undefined {
  return gateResults.find(g => !g.passed);
}

// ============================================
// 选项评估
// ============================================

/**
 * 评估单个对话选项的可用性
 *
 * 三层把关：态度门槛 → 核心值门槛 → 待 CRPG 检定
 *
 * @param option - 对话选项
 * @param attitude - 当前态度值
 * @param coreStats - 角色核心值
 * @returns 选项评估结果
 */
export function evaluateOption(
  option: NPCDialogueOption,
  attitude: number,
  coreStats: Record<CoreStatKey, number>,
): OptionEvaluation {
  const gateResults = evaluateOptionGates(option, coreStats);
  const attitudePassed = option.minAttitude === undefined || attitude >= option.minAttitude;
  const gatesPassed = allGatesPassed(gateResults);

  let available = true;
  let disabledReason: string | undefined;

  if (!attitudePassed) {
    available = false;
    disabledReason = `需要好感度达到 ${option.minAttitude}（当前 ${attitude}）`;
  } else if (!gatesPassed) {
    const failed = firstFailedGate(gateResults);
    available = false;
    disabledReason = failed?.failureHint || '核心值不满足要求';
  }

  return {
    optionId: option.id,
    text: option.text,
    available,
    disabledReason,
    attitudePassed,
    gateResults,
    hasCheck: !!option.check,
    resultBranch: available ? option.resultBranch : undefined,
  };
}

// ============================================
// 对话行获取
// ============================================

/** 对话行获取结果 */
export interface DialogueLineResult {
  /** 对话行数据 */
  line: NPCDialogueLine;
  /** 各选项的评估结果 */
  options: OptionEvaluation[];
}

/**
 * 获取对话行及其选项的评估结果
 *
 * @param npc - NPC 定义
 * @param lineId - 对话行 ID
 * @param attitude - 当前态度值
 * @param coreStats - 角色核心值
 * @returns 对话行 + 选项评估，若 lineId 不存在则返回 undefined
 */
export function getAvailableDialogueLine(
  npc: NPCDefinition,
  lineId: string,
  attitude: number,
  coreStats: Record<CoreStatKey, number>,
): DialogueLineResult | undefined {
  const line = npc.dialogueLines[lineId];
  if (!line) return undefined;

  const options = line.options.map(opt =>
    evaluateOption(opt, attitude, coreStats)
  );

  return { line, options };
}

/**
 * 获取对话行的检定信息（用于 CRPG 检定执行）
 *
 * @param option - 对话选项
 * @returns 检定定义，若无检定则返回 undefined
 */
export function getOptionCheck(option: NPCDialogueOption): DialogueCheck | undefined {
  return option.check;
}

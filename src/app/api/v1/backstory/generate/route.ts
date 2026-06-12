/**
 * POST /api/v1/backstory/generate
 *
 * 基于角色属性、种族、世界观生成背景故事文本。
 * 使用模板系统，确定性地产出风格化的背景故事。
 */

import { NextRequest } from 'next/server';
import { apiSuccess, apiError } from '@/app/api/result';
import { createLogger } from '@/core/logger';

const log = createLogger('Backstory Generate');

interface BackstoryRequest {
  name: string;
  gender: string;
  raceId: string;
  attributes: Record<string, number | string>;
  worldName: string;
}

// 种族背景模板
const RACE_ORIGINS: Record<string, string[]> = {
  human: [
    '出身于一个普通的凡人家庭，{name}自幼便展现出与众不同的天赋。',
    '生于乱世之中，{name}在战火中成长，磨砺出坚韧的意志。',
    '{name}的家族世代传承着一门古老的技艺，如今传到了这一代。',
  ],
  demon: [
    '在深山古林中长大的妖族后裔，{name}体内流淌着远古大妖的血脉。',
    '作为妖族部落的年轻一代，{name}背负着振兴族群的使命。',
    '从小被遗弃在荒野的妖族弃儿，{name}凭本能与天赋活了下来。',
  ],
  spirit: [
    '天地灵气孕育而生的灵族，{name}自诞生之日起便与大道共鸣。',
    '在古老的灵脉圣地中化形，{name}带着对世界的好奇踏入凡尘。',
    '作为最后的灵族血脉之一，{name}承载着已经消逝的灵族记忆。',
  ],
};

// 属性对应的性格描述
function describeAttributes(attrs: Record<string, number | string>): string {
  const numericAttrs = Object.entries(attrs)
    .filter(([, v]) => typeof v === 'number')
    .sort(([, a], [, b]) => (b as number) - (a as number));

  if (numericAttrs.length < 2) return '资质平平';

  const highest = numericAttrs[0];
  const lowest = numericAttrs[numericAttrs.length - 1];

  const descriptors: Record<string, string> = {
    constitution: '体魄强健',
    physique: '体魄强健',
    fitness: '身体健壮',
    strength: '力大无穷',
    insight: '悟性极高',
    luck: '气运加身',
    willpower: '意志坚定',
    spiritPower: '灵力充沛',
    intelligence: '聪慧过人',
    spiritRoot: '灵根不凡',
    magic: '魔力充盈',
    battleWill: '战意昂扬',
    daoHeart: '道心坚定',
    perseverance: '坚韧不拔',
    swordHeart: '剑心通明',
    adaptability: '适应力强',
  };

  const highDesc = descriptors[highest[0]] || `${highest[0]}出众`;
  const lowDesc = descriptors[lowest[0]] || `${lowest[0]}稍弱`;

  return `${highDesc}，但${lowDesc}`;
}

function generateBackstoryText(req: BackstoryRequest): string {
  const origins = RACE_ORIGINS[req.raceId] || RACE_ORIGINS.human;
  const origin = origins[Math.abs(hashStr(req.name)) % origins.length];
  const desc = describeAttributes(req.attributes);

  return `${origin.replace('{name}', req.name)}${desc}。在${req.worldName}的广阔天地间，等待着属于${req.name === '他' || req.name === '她' ? 'ta' : req.name}的机缘与挑战。`;
}

/** 简单字符串 hash */
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h) + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

export async function POST(request: NextRequest) {
  let body: BackstoryRequest;
  try {
    body = (await request.json()) as BackstoryRequest;
  } catch {
    return apiError(400, '请求体格式错误');
  }

  if (!body.name) {
    return apiError(400, '缺少 name 参数');
  }

  try {
    const backstory = generateBackstoryText(body);
    return apiSuccess({ backstory }, '背景故事已生成');
  } catch (err) {
    log.error('生成失败:', err);
    return apiError(500, '生成背景故事失败');
  }
}

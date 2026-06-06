/**
 * 角色相关类型定义
 */

import { ImpactLevel } from './base';

// 角色属性
export interface CharacterStats {
  体质: number;
  灵根: number;
  悟性: number;
  幸运: number;
  意志: number;
}

// 属性影响
export interface StatImpact {
  体质?: number;
  灵根?: number;
  悟性?: number;
  幸运?: number;
  意志?: number;
}

// 带影响的词条
export interface ImpactfulTrait {
  name: string;
  description: string;
  impact: StatImpact;
  totalImpact: number;
  level: ImpactLevel;
}

// 角色信息
export interface Character {
  id: number;
  name: string;
  gender: '男' | '女';
  age: number;
  origin: ImpactfulTrait;
  trait: ImpactfulTrait;
  personality: ImpactfulTrait;
  talent: ImpactfulTrait;
  background: string;
  stats: CharacterStats;
  totalPower: number;
}

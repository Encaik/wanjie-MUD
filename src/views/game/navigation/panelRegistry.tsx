/**
 * panelRegistry — 统一面板注册表
 *
 * 项目中所有功能面板元数据的唯一数据源。
 * GameMenu 和 WanjiePanel 都从此注册表获取面板列表。
 */

import {
  Sparkles, Swords, Building2, ScrollText, ShoppingBag, Package,
  Shield, FlaskConical, Landmark, Trophy, BookOpen, BarChart3,
} from 'lucide-react';

/** 面板元数据定义 */
export interface PanelDefinition {
  id: string;
  label: string;
  icon: React.ReactNode;
  category: 'primary' | 'secondary';
  group?: string;
  route: string;
}

export const PANELS: Record<string, PanelDefinition> = {
  // —— 主标签（6 个）——
  cultivation: { id: 'cultivation', label: '修炼',  icon: <Sparkles className="w-4 h-4" />,      category: 'primary',   route: '/game/cultivation' },
  adventure:   { id: 'adventure',   label: '机缘',  icon: <Swords className="w-4 h-4" />,        category: 'primary',   route: '/game/adventure' },
  quest:       { id: 'quest',       label: '任务',  icon: <ScrollText className="w-4 h-4" />,    category: 'primary',   route: '/game/quest' },
  faction:     { id: 'faction',     label: '势力',  icon: <Building2 className="w-4 h-4" />,     category: 'primary',   route: '/game/faction' },
  shop:        { id: 'shop',        label: '商店',  icon: <ShoppingBag className="w-4 h-4" />,   category: 'primary',   route: '/game/shop' },
  backpack:    { id: 'backpack',    label: '背包',  icon: <Package className="w-4 h-4" />,       category: 'primary',   route: '/game/backpack' },

  // —— "更多"（5 个）——
  craft:       { id: 'craft',       label: '炼制', icon: <FlaskConical className="w-5 h-5" />,  category: 'secondary', group: '炼造', route: '/game/craft' },
  equipManage: { id: 'equipManage', label: '装备管理', icon: <Shield className="w-5 h-5" />,     category: 'secondary', group: '武备', route: '/game/equip-manage' },
  tower:       { id: 'tower',       label: '试炼', icon: <Landmark className="w-5 h-5" />,        category: 'secondary', group: '武备', route: '/game/tower' },
  achievement: { id: 'achievement', label: '成就', icon: <Trophy className="w-5 h-5" />,          category: 'secondary', group: '记载', route: '/game/achievement' },
  collection:  { id: 'collection',  label: '图鉴', icon: <BookOpen className="w-5 h-5" />,        category: 'secondary', group: '记载', route: '/game/collection' },
  statistics:  { id: 'statistics',  label: '统计', icon: <BarChart3 className="w-5 h-5" />,       category: 'secondary', group: '记载', route: '/game/statistics' },
};

export const PRIMARY_PANELS = Object.values(PANELS).filter(p => p.category === 'primary');
export const SECONDARY_PANELS = Object.values(PANELS).filter(p => p.category === 'secondary');

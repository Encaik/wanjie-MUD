/**
 * panelRegistry — 统一面板注册表
 *
 * 项目中所有功能面板元数据的唯一数据源。
 * GameMenu 和 WanjiePanel 都从此注册表获取面板列表。
 * 新增面板只需在此文件中添加一条记录。
 */

import {
  Sparkles, Swords, Building2, ScrollText, ShoppingBag, Package,
  Zap, Shield, FlaskConical, Anvil, Landmark, Trophy, BookOpen, BarChart3,
} from 'lucide-react';

/** 面板元数据定义 */
export interface PanelDefinition {
  /** 面板唯一标识 */
  id: string;
  /** 中文显示名 */
  label: string;
  /** lucide-react 图标 */
  icon: React.ReactNode;
  /** primary = 固定标签展示，secondary = "更多"万界盘 */
  category: 'primary' | 'secondary';
  /** secondary 面板在万界盘中的分组（primary 面板不需要） */
  group?: string;
  /** 路由路径 */
  route: string;
}

/** 所有面板注册表 */
export const PANELS: Record<string, PanelDefinition> = {
  // —— 主标签（6 个，显示在顶部菜单栏）——
  cultivation: { id: 'cultivation', label: '修炼',  icon: <Sparkles className="w-4 h-4" />,      category: 'primary',   route: '/game/cultivation' },
  adventure:   { id: 'adventure',   label: '机缘',  icon: <Swords className="w-4 h-4" />,        category: 'primary',   route: '/game/adventure' },
  quest:       { id: 'quest',       label: '任务',  icon: <ScrollText className="w-4 h-4" />,    category: 'primary',   route: '/game/quest' },
  faction:     { id: 'faction',     label: '势力',  icon: <Building2 className="w-4 h-4" />,     category: 'primary',   route: '/game/faction' },
  shop:        { id: 'shop',        label: '商店',  icon: <ShoppingBag className="w-4 h-4" />,   category: 'primary',   route: '/game/shop' },
  backpack:    { id: 'backpack',    label: '背包',  icon: <Package className="w-4 h-4" />,       category: 'primary',   route: '/game/backpack' },

  // —— "更多"（10 个，在万界盘中展示）——
  alchemy:     { id: 'alchemy',     label: '炼丹', icon: <FlaskConical className="w-5 h-5" />,  category: 'secondary', group: '炼造', route: '/game/alchemy' },
  forge:       { id: 'forge',       label: '炼器', icon: <Anvil className="w-5 h-5" />,           category: 'secondary', group: '炼造', route: '/game/forge' },
  fragment:    { id: 'fragment',    label: '碎片', icon: <Package className="w-5 h-5" />,         category: 'secondary', group: '炼造', route: '/game/fragment' },
  skill:       { id: 'skill',       label: '技能', icon: <Swords className="w-5 h-5" />,          category: 'secondary', group: '武备', route: '/game/skill' },
  tower:       { id: 'tower',       label: '试炼', icon: <Landmark className="w-5 h-5" />,        category: 'secondary', group: '武备', route: '/game/tower' },
  technique:   { id: 'technique',   label: '功法', icon: <Zap className="w-5 h-5" />,            category: 'secondary', group: '武备', route: '/game/technique' },
  equipment:   { id: 'equipment',   label: '装备', icon: <Shield className="w-5 h-5" />,         category: 'secondary', group: '武备', route: '/game/equipment' },
  achievement: { id: 'achievement', label: '成就', icon: <Trophy className="w-5 h-5" />,          category: 'secondary', group: '记载', route: '/game/achievement' },
  collection:  { id: 'collection',  label: '图鉴', icon: <BookOpen className="w-5 h-5" />,        category: 'secondary', group: '记载', route: '/game/collection' },
  statistics:  { id: 'statistics',  label: '统计', icon: <BarChart3 className="w-5 h-5" />,       category: 'secondary', group: '记载', route: '/game/statistics' },
};

/** 主标签面板列表（6 个） */
export const PRIMARY_PANELS = Object.values(PANELS).filter(p => p.category === 'primary');

/** 次要面板列表（10 个），按 group 分组后供万界盘使用 */
export const SECONDARY_PANELS = Object.values(PANELS).filter(p => p.category === 'secondary');

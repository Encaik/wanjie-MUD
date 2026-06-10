/**
 * 技能装备管理系统
 * 
 * 管理功法法技和武器斗技的装备/卸下/交换
 */

import { TechniqueSkill, WeaponTechnique, EquipResult, getUnlockedSlotCount } from './skillTypes';
import { Technique } from '@/core/types';
import { Equipment } from '@/core/types';

// ============================================
// 功法技能装备管理
// ============================================

/**
 * 获取功法已解锁的技能列表
 */
export function getUnlockedSkills(technique: Technique): TechniqueSkill[] {
  if (!technique.allSkills) return [];
  return technique.allSkills.filter(
    skill => skill.unlockLevel <= technique.level
  );
}

/**
 * 获取功法当前装备的有效技能列表
 */
export function getEquippedSkills(technique: Technique): TechniqueSkill[] {
  if (!technique.allSkills) return [];
  return technique.equippedSkills
    .filter((id): id is string => id !== null)
    .map(id => technique.allSkills.find(s => s.id === id))
    .filter((skill): skill is TechniqueSkill => skill !== undefined);
}

/**
 * 装备技能到槽位
 */
export function equipSkill(
  technique: Technique,
  skillId: string,
  slotIndex: number
): EquipResult {
  // 残本检查
  if (technique.isFragment) {
    return { success: false, error: '残本无法装备技能' };
  }
  
  // 边界检查
  if (slotIndex < 0 || slotIndex >= technique.maxSkillSlots) {
    return { success: false, error: '槽位索引无效' };
  }
  
  // 槽位解锁检查
  if (slotIndex >= technique.skillSlots) {
    return { success: false, error: `该槽位尚未解锁（需要等级${slotIndex + 1}）` };
  }
  
  // 技能存在检查
  if (!technique.allSkills) {
    return { success: false, error: '技能不存在' };
  }
  const skill = technique.allSkills.find(s => s.id === skillId);
  if (!skill) {
    return { success: false, error: '技能不存在' };
  }
  
  // 技能解锁检查
  if (skill.unlockLevel > technique.level) {
    return { success: false, error: `需要功法等级${skill.unlockLevel}才能使用此技能` };
  }
  
  // 已装备检查（同一技能不可重复装备）
  const alreadyEquipped = technique.equippedSkills.some(
    (id, idx) => id === skillId && idx !== slotIndex
  );
  if (alreadyEquipped) {
    return { success: false, error: '该技能已在其他槽位装备' };
  }
  
  // 执行装备 - 创建新数组
  const newEquippedSkills = [...technique.equippedSkills];
  
  // 确保数组长度正确
  while (newEquippedSkills.length < technique.maxSkillSlots) {
    newEquippedSkills.push(null);
  }
  
  newEquippedSkills[slotIndex] = skillId;
  
  // 返回新对象（使用浅拷贝 + 新数组）
  const updatedTechnique = {
    ...technique,
    equippedSkills: newEquippedSkills
  };
  
  return { 
    success: true, 
    message: `已将【${skill.name}】装备到槽位${slotIndex + 1}`,
    updatedTechnique
  };
}

/**
 * 从槽位卸下技能
 */
export function unequipSkill(
  technique: Technique,
  slotIndex: number
): EquipResult {
  // 边界检查
  if (slotIndex < 0 || slotIndex >= technique.skillSlots) {
    return { success: false, error: '槽位索引无效' };
  }
  
  // 空槽检查
  const currentSkillId = technique.equippedSkills[slotIndex];
  if (!currentSkillId) {
    return { success: false, error: '该槽位为空' };
  }
  
  // 执行卸下 - 创建新数组
  if (!technique.allSkills) {
    const newEquippedSkills = [...technique.equippedSkills];
    newEquippedSkills[slotIndex] = null;
    return { 
      success: true, 
      message: '已从槽位卸下',
      updatedTechnique: { ...technique, equippedSkills: newEquippedSkills }
    };
  }
  const skill = technique.allSkills.find(s => s.id === currentSkillId);
  const newEquippedSkills = [...technique.equippedSkills];
  newEquippedSkills[slotIndex] = null;
  
  // 返回新对象
  const updatedTechnique = {
    ...technique,
    equippedSkills: newEquippedSkills
  };
  
  return { 
    success: true, 
    message: `已将【${skill?.name || '技能'}】从槽位${slotIndex + 1}卸下`,
    updatedTechnique
  };
}

/**
 * 快捷装备（自动分配到空槽位）
 */
export function quickEquipSkill(
  technique: Technique,
  skillId: string
): EquipResult {
  // 残本检查
  if (technique.isFragment) {
    return { success: false, error: '残本无法装备技能' };
  }
  
  // 检查技能有效性
  if (!technique.allSkills) {
    return { success: false, error: '功法没有可装备的技能' };
  }
  const skill = technique.allSkills.find(s => s.id === skillId);
  if (!skill) {
    return { success: false, error: '技能不存在' };
  }
  
  if (skill.unlockLevel > technique.level) {
    return { success: false, error: `需要功法等级${skill.unlockLevel}` };
  }
  
  // 已装备检查
  if (technique.equippedSkills.includes(skillId)) {
    return { success: false, error: '该技能已装备' };
  }
  
  // 寻找空槽位
  for (let i = 0; i < technique.skillSlots; i++) {
    if (!technique.equippedSkills[i]) {
      return equipSkill(technique, skillId, i);
    }
  }
  
  // 无空槽位
  return { 
    success: false, 
    error: '所有槽位已满，请先卸下其他技能',
    hint: '可使用交换功能替换现有技能'
  };
}

/**
 * 交换两个槽位的技能
 */
export function swapSkills(
  technique: Technique,
  slotIndex1: number,
  slotIndex2: number
): EquipResult {
  // 边界检查
  if (slotIndex1 < 0 || slotIndex1 >= technique.skillSlots ||
      slotIndex2 < 0 || slotIndex2 >= technique.skillSlots) {
    return { success: false, error: '槽位索引无效' };
  }
  
  // 执行交换 - 创建新数组
  const newEquippedSkills = [...technique.equippedSkills];
  const temp = newEquippedSkills[slotIndex1];
  newEquippedSkills[slotIndex1] = newEquippedSkills[slotIndex2];
  newEquippedSkills[slotIndex2] = temp;
  
  // 返回新对象
  const updatedTechnique = {
    ...technique,
    equippedSkills: newEquippedSkills
  };
  
  return { success: true, message: '技能位置已交换', updatedTechnique };
}

// ============================================
// 武器技巧装备管理
// ============================================

/**
 * 获取武器已解锁的技巧列表
 */
export function getUnlockedTechniques(equipment: Equipment): WeaponTechnique[] {
  if (!equipment.allTechniques) return [];
  return equipment.allTechniques.filter(
    tech => tech.unlockLevel <= equipment.level
  );
}

/**
 * 获取武器当前装备的有效技巧列表
 */
export function getEquippedTechniques(equipment: Equipment): WeaponTechnique[] {
  if (!equipment.allTechniques) return [];
  return equipment.equippedTechniques
    .filter((id): id is string => id !== null)
    .map(id => equipment.allTechniques.find(t => t.id === id))
    .filter((tech): tech is WeaponTechnique => tech !== undefined);
}

/**
 * 装备技巧到槽位
 */
export function equipTechnique(
  equipment: Equipment,
  techniqueId: string,
  slotIndex: number
): EquipResult {
  // 残片检查
  if (equipment.isFragment) {
    return { success: false, error: '残片无法装备技巧' };
  }
  
  // 非武器检查
  const isWeapon = equipment.slot === 'melee' || equipment.slot === 'ranged';
  if (!isWeapon) {
    return { success: false, error: '只有武器才能装备技巧' };
  }
  
  // 边界检查
  if (slotIndex < 0 || slotIndex >= equipment.maxTechniqueSlots) {
    return { success: false, error: '槽位索引无效' };
  }
  
  // 槽位解锁检查
  if (slotIndex >= equipment.techniqueSlots) {
    return { success: false, error: `该槽位尚未解锁（需要等级${slotIndex + 1}）` };
  }
  
  // 技巧存在检查
  if (!equipment.allTechniques) {
    return { success: false, error: '武器没有可装备的技巧' };
  }
  const technique = equipment.allTechniques.find(t => t.id === techniqueId);
  if (!technique) {
    return { success: false, error: '技巧不存在' };
  }
  
  // 技巧解锁检查
  if (technique.unlockLevel > equipment.level) {
    return { success: false, error: `需要武器等级${technique.unlockLevel}才能使用此技巧` };
  }
  
  // 已装备检查
  const alreadyEquipped = equipment.equippedTechniques.some(
    (id, idx) => id === techniqueId && idx !== slotIndex
  );
  if (alreadyEquipped) {
    return { success: false, error: '该技巧已在其他槽位装备' };
  }
  
  // 执行装备 - 创建新数组
  const newEquippedTechniques = [...equipment.equippedTechniques];
  
  // 确保数组长度正确
  while (newEquippedTechniques.length < equipment.maxTechniqueSlots) {
    newEquippedTechniques.push(null);
  }
  
  newEquippedTechniques[slotIndex] = techniqueId;
  
  // 返回新对象
  const updatedEquipment = {
    ...equipment,
    equippedTechniques: newEquippedTechniques
  };
  
  return { 
    success: true, 
    message: `已将【${technique.name}】装备到槽位${slotIndex + 1}`,
    updatedEquipment
  };
}

/**
 * 从槽位卸下技巧
 */
export function unequipTechnique(
  equipment: Equipment,
  slotIndex: number
): EquipResult {
  // 边界检查
  if (slotIndex < 0 || slotIndex >= equipment.techniqueSlots) {
    return { success: false, error: '槽位索引无效' };
  }
  
  // 空槽检查
  const currentTechniqueId = equipment.equippedTechniques[slotIndex];
  if (!currentTechniqueId) {
    return { success: false, error: '该槽位为空' };
  }
  
  // 执行卸下 - 创建新数组
  if (!equipment.allTechniques) {
    const newEquippedTechniques = [...equipment.equippedTechniques];
    newEquippedTechniques[slotIndex] = null;
    return { 
      success: true, 
      message: '已从槽位卸下',
      updatedEquipment: { ...equipment, equippedTechniques: newEquippedTechniques }
    };
  }
  const tech = equipment.allTechniques.find(t => t.id === currentTechniqueId);
  const newEquippedTechniques = [...equipment.equippedTechniques];
  newEquippedTechniques[slotIndex] = null;
  
  // 返回新对象
  const updatedEquipment = {
    ...equipment,
    equippedTechniques: newEquippedTechniques
  };
  
  return { 
    success: true, 
    message: `已将【${tech?.name || '技巧'}】从槽位${slotIndex + 1}卸下`,
    updatedEquipment
  };
}

/**
 * 快捷装备技巧
 */
export function quickEquipTechnique(
  equipment: Equipment,
  techniqueId: string
): EquipResult {
  // 残片检查
  if (equipment.isFragment) {
    return { success: false, error: '残片无法装备技巧' };
  }
  
  // 非武器检查
  const isWeapon = equipment.slot === 'melee' || equipment.slot === 'ranged';
  if (!isWeapon) {
    return { success: false, error: '只有武器才能装备技巧' };
  }
  
  // 检查技巧有效性
  if (!equipment.allTechniques) {
    return { success: false, error: '武器没有可装备的技巧' };
  }
  const technique = equipment.allTechniques.find(t => t.id === techniqueId);
  if (!technique) {
    return { success: false, error: '技巧不存在' };
  }
  
  if (technique.unlockLevel > equipment.level) {
    return { success: false, error: `需要武器等级${technique.unlockLevel}` };
  }
  
  // 已装备检查
  if (equipment.equippedTechniques.includes(techniqueId)) {
    return { success: false, error: '该技巧已装备' };
  }
  
  // 寻找空槽位
  for (let i = 0; i < equipment.techniqueSlots; i++) {
    if (!equipment.equippedTechniques[i]) {
      return equipTechnique(equipment, techniqueId, i);
    }
  }
  
  // 无空槽位
  return { 
    success: false, 
    error: '所有槽位已满，请先卸下其他技巧',
    hint: '可使用交换功能替换现有技巧'
  };
}

/**
 * 交换两个槽位的技巧
 */
export function swapTechniques(
  equipment: Equipment,
  slotIndex1: number,
  slotIndex2: number
): EquipResult {
  // 边界检查
  if (slotIndex1 < 0 || slotIndex1 >= equipment.techniqueSlots ||
      slotIndex2 < 0 || slotIndex2 >= equipment.techniqueSlots) {
    return { success: false, error: '槽位索引无效' };
  }
  
  // 执行交换 - 创建新数组
  const newEquippedTechniques = [...equipment.equippedTechniques];
  const temp = newEquippedTechniques[slotIndex1];
  newEquippedTechniques[slotIndex1] = newEquippedTechniques[slotIndex2];
  newEquippedTechniques[slotIndex2] = temp;
  
  // 返回新对象
  const updatedEquipment = {
    ...equipment,
    equippedTechniques: newEquippedTechniques
  };
  
  return { success: true, message: '技巧位置已交换', updatedEquipment };
}

// ============================================
// 验证函数
// ============================================

/**
 * 验证功法技能装备状态
 */
export function validateTechniqueSkills(technique: Technique): string[] {
  const errors: string[] = [];
  
  // 技能槽位检查
  const equippedCount = technique.equippedSkills.filter(id => id !== null).length;
  if (equippedCount > technique.skillSlots) {
    errors.push(`装备技能数(${equippedCount})超过已解锁槽位数(${technique.skillSlots})`);
  }
  
  // 技能ID有效性检查
  for (const skillId of technique.equippedSkills) {
    if (skillId === null) continue;
    if (!technique.allSkills.find(s => s.id === skillId)) {
      errors.push(`技能${skillId}不存在于功法技能列表中`);
    }
  }
  
  // 技能解锁检查
  for (const skillId of technique.equippedSkills) {
    if (skillId === null) continue;
    const skill = technique.allSkills.find(s => s.id === skillId);
    if (skill && skill.unlockLevel > technique.level) {
      errors.push(`技能【${skill.name}】需要等级${skill.unlockLevel}，当前功法等级${technique.level}不足`);
    }
  }
  
  // 重复装备检查
  const validSkillIds = technique.equippedSkills.filter((id): id is string => id !== null);
  const uniqueSkillIds = new Set(validSkillIds);
  if (uniqueSkillIds.size !== validSkillIds.length) {
    errors.push('存在重复装备的技能');
  }
  
  return errors;
}

/**
 * 验证武器技巧装备状态
 */
export function validateEquipmentTechniques(equipment: Equipment): string[] {
  const errors: string[] = [];
  
  // 技巧槽位检查
  const equippedCount = equipment.equippedTechniques.filter(id => id !== null).length;
  if (equippedCount > equipment.techniqueSlots) {
    errors.push(`装备技巧数(${equippedCount})超过已解锁槽位数(${equipment.techniqueSlots})`);
  }
  
  // 技巧ID有效性检查
  for (const techniqueId of equipment.equippedTechniques) {
    if (techniqueId === null) continue;
    if (!equipment.allTechniques.find(t => t.id === techniqueId)) {
      errors.push(`技巧${techniqueId}不存在于武器技巧列表中`);
    }
  }
  
  // 技巧解锁检查
  for (const techniqueId of equipment.equippedTechniques) {
    if (techniqueId === null) continue;
    const technique = equipment.allTechniques.find(t => t.id === techniqueId);
    if (technique && technique.unlockLevel > equipment.level) {
      errors.push(`技巧【${technique.name}】需要等级${technique.unlockLevel}，当前武器等级${equipment.level}不足`);
    }
  }
  
  // 重复装备检查
  const validTechniqueIds = equipment.equippedTechniques.filter((id): id is string => id !== null);
  const uniqueTechniqueIds = new Set(validTechniqueIds);
  if (uniqueTechniqueIds.size !== validTechniqueIds.length) {
    errors.push('存在重复装备的技巧');
  }
  
  return errors;
}

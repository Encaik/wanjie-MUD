/**
 * 技能装备系统测试
 * 测试 getUnlockedSkills, getEquippedSkills, getUnlockedTechniques, getEquippedTechniques 等函数
 */

import {
  getUnlockedSkills,
  getEquippedSkills,
  equipSkill,
  unequipSkill,
  quickEquipSkill,
  getUnlockedTechniques,
  getEquippedTechniques,
  equipTechnique,
  unequipTechnique,
  quickEquipTechnique,
} from '@/lib/game/skillEquipSystem';
import { TechniqueSkill, WeaponTechnique } from '@/lib/game/skillTypes';
import { Technique } from '@/lib/game/types';
import { Equipment } from '@/lib/game/types';

// 创建测试用功法
function createTestTechnique(overrides: Partial<Technique> = {}): Technique {
  const allSkills: TechniqueSkill[] = [
    { id: 'skill1', name: '技能1', description: '测试技能1', unlockLevel: 1, mpCost: 10, cooldown: 2, effects: [], tags: ['instant'] },
    { id: 'skill2', name: '技能2', description: '测试技能2', unlockLevel: 3, mpCost: 15, cooldown: 3, effects: [], tags: ['aoe'] },
    { id: 'skill3', name: '技能3', description: '测试技能3', unlockLevel: 5, mpCost: 20, cooldown: 4, effects: [], tags: ['ultimate'] },
  ];
  
  return {
    id: 'test-technique-1',
    name: '测试功法',
    type: 'attack',
    rarity: '稀有',
    description: '这是一个测试功法',
    level: 3,
    exp: 50,
    expToNext: 100,
    maxLevel: 10,
    power: 50,
    bonus: 15,
    baseMpCost: 10,
    element: 'fire',
    compatibleWeapon: 'sword',
    compatibleBonus: 0.1,
    skillSlots: 2,
    maxSkillSlots: 3,
    allSkills,
    equippedSkills: [null, null, null],
    worldType: '修仙',
    source: 'drop',
    isFragment: false,
    ...overrides,
  } as Technique;
}

// 创建测试用武器
function createTestEquipment(overrides: Partial<Equipment> = {}): Equipment {
  const allTechniques: WeaponTechnique[] = [
    { id: 'tech1', name: '技巧1', description: '测试技巧1', unlockLevel: 1, trigger: { type: 'on_attack' }, effects: [] },
    { id: 'tech2', name: '技巧2', description: '测试技巧2', unlockLevel: 2, trigger: { type: 'on_hit' }, effects: [] },
    { id: 'tech3', name: '技巧3', description: '测试技巧3', unlockLevel: 4, trigger: { type: 'passive' }, effects: [] },
  ];
  
  return {
    id: 'test-equipment-1',
    name: '测试武器',
    slot: 'melee',
    rarity: '稀有',
    description: '这是一个测试武器',
    level: 2,
    exp: 30,
    expToNext: 100,
    maxLevel: 10,
    weaponCategory: 'sword',
    element: 'fire',
    compatibleElement: 'fire',
    compatibleBonus: 0.1,
    attackBonus: 20,
    defenseBonus: 0,
    power: 30,
    techniqueSlots: 2,
    maxTechniqueSlots: 3,
    allTechniques,
    equippedTechniques: [null, null, null],
    worldType: '修仙',
    isFragment: false,
    ...overrides,
  } as Equipment;
}

describe('技能装备系统', () => {
  describe('功法技能管理', () => {
    describe('getUnlockedSkills', () => {
      it('应该返回等级解锁的技能', () => {
        const technique = createTestTechnique({ level: 3 });
        const unlocked = getUnlockedSkills(technique);
        
        expect(unlocked.length).toBe(2);
        expect(unlocked.map(s => s.id)).toEqual(['skill1', 'skill2']);
      });

      it('等级1时只返回解锁等级为1的技能', () => {
        const technique = createTestTechnique({ level: 1 });
        const unlocked = getUnlockedSkills(technique);
        
        expect(unlocked.length).toBe(1);
        expect(unlocked[0].id).toBe('skill1');
      });

      it('满级时返回所有技能', () => {
        const technique = createTestTechnique({ level: 10 });
        const unlocked = getUnlockedSkills(technique);
        
        expect(unlocked.length).toBe(3);
      });

      it('allSkills为undefined时返回空数组', () => {
        const technique = createTestTechnique({ allSkills: undefined } as any);
        const unlocked = getUnlockedSkills(technique);
        
        expect(unlocked).toEqual([]);
      });
    });

    describe('getEquippedSkills', () => {
      it('应该返回已装备的技能', () => {
        const technique = createTestTechnique({
          equippedSkills: ['skill1', 'skill2', null],
        });
        const equipped = getEquippedSkills(technique);
        
        expect(equipped.length).toBe(2);
        expect(equipped.map(s => s.id)).toEqual(['skill1', 'skill2']);
      });

      it('没有装备时返回空数组', () => {
        const technique = createTestTechnique();
        const equipped = getEquippedSkills(technique);
        
        expect(equipped).toEqual([]);
      });

      it('allSkills为undefined时返回空数组', () => {
        const technique = createTestTechnique({ allSkills: undefined } as any);
        const equipped = getEquippedSkills(technique);
        
        expect(equipped).toEqual([]);
      });
    });

    describe('equipSkill', () => {
      it('应该成功装备技能到槽位', () => {
        const technique = createTestTechnique();
        const result = equipSkill(technique, 'skill1', 0);
        
        expect(result.success).toBe(true);
        expect(technique.equippedSkills[0]).toBe('skill1');
      });

      it('残本无法装备技能', () => {
        const technique = createTestTechnique({ isFragment: true });
        const result = equipSkill(technique, 'skill1', 0);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('残本无法装备技能');
      });

      it('技能未解锁无法装备', () => {
        const technique = createTestTechnique({ level: 2 }); // skill2需要等级3
        const result = equipSkill(technique, 'skill2', 0);
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('需要功法等级');
      });

      it('allSkills为undefined时返回错误', () => {
        const technique = createTestTechnique({ allSkills: undefined } as any);
        const result = equipSkill(technique, 'skill1', 0);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('技能不存在');
      });
    });

    describe('unequipSkill', () => {
      it('应该成功卸下技能', () => {
        const technique = createTestTechnique({
          equippedSkills: ['skill1', null, null],
        });
        const result = unequipSkill(technique, 0);
        
        expect(result.success).toBe(true);
        expect(technique.equippedSkills[0]).toBeNull();
      });

      it('空槽位无法卸下', () => {
        const technique = createTestTechnique();
        const result = unequipSkill(technique, 0);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('该槽位为空');
      });

      it('allSkills为undefined时仍可卸下', () => {
        const technique = createTestTechnique({
          allSkills: undefined,
          equippedSkills: ['skill1', null, null],
        } as any);
        const result = unequipSkill(technique, 0);
        
        expect(result.success).toBe(true);
        expect(technique.equippedSkills[0]).toBeNull();
      });
    });

    describe('quickEquipSkill', () => {
      it('应该自动装备到空槽位', () => {
        const technique = createTestTechnique();
        const result = quickEquipSkill(technique, 'skill1');
        
        expect(result.success).toBe(true);
        expect(technique.equippedSkills[0]).toBe('skill1');
      });

      it('所有槽位满时返回错误', () => {
        // 所有槽位已满，尝试装备新技能
        const technique = createTestTechnique({
          equippedSkills: ['skill1', 'skill2'], // 所有槽位已满
          skillSlots: 2, // 固定2个槽位
          level: 10, // 满级，所有技能已解锁
        });
        const result = quickEquipSkill(technique, 'skill3');
        
        expect(result.success).toBe(false);
        expect(result.error).toContain('槽位已满');
      });

      it('allSkills为undefined时返回错误', () => {
        const technique = createTestTechnique({ allSkills: undefined } as any);
        const result = quickEquipSkill(technique, 'skill1');
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('功法没有可装备的技能');
      });
    });
  });

  describe('武器斗技管理', () => {
    describe('getUnlockedTechniques', () => {
      it('应该返回等级解锁的技巧', () => {
        const equipment = createTestEquipment({ level: 2 });
        const unlocked = getUnlockedTechniques(equipment);
        
        expect(unlocked.length).toBe(2);
        expect(unlocked.map(t => t.id)).toEqual(['tech1', 'tech2']);
      });

      it('allTechniques为undefined时返回空数组', () => {
        const equipment = createTestEquipment({ allTechniques: undefined } as any);
        const unlocked = getUnlockedTechniques(equipment);
        
        expect(unlocked).toEqual([]);
      });
    });

    describe('getEquippedTechniques', () => {
      it('应该返回已装备的技巧', () => {
        const equipment = createTestEquipment({
          equippedTechniques: ['tech1', 'tech2', null],
        });
        const equipped = getEquippedTechniques(equipment);
        
        expect(equipped.length).toBe(2);
        expect(equipped.map(t => t.id)).toEqual(['tech1', 'tech2']);
      });

      it('allTechniques为undefined时返回空数组', () => {
        const equipment = createTestEquipment({ allTechniques: undefined } as any);
        const equipped = getEquippedTechniques(equipment);
        
        expect(equipped).toEqual([]);
      });
    });

    describe('equipTechnique', () => {
      it('应该成功装备技巧到槽位', () => {
        const equipment = createTestEquipment();
        const result = equipTechnique(equipment, 'tech1', 0);
        
        expect(result.success).toBe(true);
        expect(equipment.equippedTechniques[0]).toBe('tech1');
      });

      it('非武器无法装备技巧', () => {
        const equipment = createTestEquipment({ slot: 'body' });
        const result = equipTechnique(equipment, 'tech1', 0);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('只有武器才能装备技巧');
      });

      it('残片无法装备技巧', () => {
        const equipment = createTestEquipment({ isFragment: true });
        const result = equipTechnique(equipment, 'tech1', 0);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('残片无法装备技巧');
      });

      it('allTechniques为undefined时返回错误', () => {
        const equipment = createTestEquipment({ allTechniques: undefined } as any);
        const result = equipTechnique(equipment, 'tech1', 0);
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('武器没有可装备的技巧');
      });
    });

    describe('unequipTechnique', () => {
      it('应该成功卸下技巧', () => {
        const equipment = createTestEquipment({
          equippedTechniques: ['tech1', null, null],
        });
        const result = unequipTechnique(equipment, 0);
        
        expect(result.success).toBe(true);
        expect(equipment.equippedTechniques[0]).toBeNull();
      });

      it('allTechniques为undefined时仍可卸下', () => {
        const equipment = createTestEquipment({
          allTechniques: undefined,
          equippedTechniques: ['tech1', null, null],
        } as any);
        const result = unequipTechnique(equipment, 0);
        
        expect(result.success).toBe(true);
        expect(equipment.equippedTechniques[0]).toBeNull();
      });
    });

    describe('quickEquipTechnique', () => {
      it('应该自动装备到空槽位', () => {
        const equipment = createTestEquipment();
        const result = quickEquipTechnique(equipment, 'tech1');
        
        expect(result.success).toBe(true);
        expect(equipment.equippedTechniques[0]).toBe('tech1');
      });

      it('allTechniques为undefined时返回错误', () => {
        const equipment = createTestEquipment({ allTechniques: undefined } as any);
        const result = quickEquipTechnique(equipment, 'tech1');
        
        expect(result.success).toBe(false);
        expect(result.error).toBe('武器没有可装备的技巧');
      });
    });
  });
});

import { CombatSession, executeCombat } from '../src/core/combat/combatEngine';
import type { CombatUnit } from '../src/core/combat/types';

const u: CombatUnit = {id:'a',name:'A',level:1,isPlayer:true,
  coreStats:{maxHp:10,physicalATK:5,specialATK:5,physicalDEF:3,specialDEF:3,speed:10,intelligence:5,willpower:5,lifespan:50,perception:5,specialResourceCap:10},
  currentHp:10, skills:[]};

console.log('executeCombat:', typeof executeCombat);

const s = new CombatSession(u, u, 'encounter');
console.log('session created:', !!s);
console.log('state:', s.state);
console.log('tick method:', typeof s.tick);
console.log('ownProps:', Object.keys(s));
console.log('proto:', Object.getOwnPropertyNames(Object.getPrototypeOf(s)).slice(0,10));
s.tick();
console.log('tick worked');

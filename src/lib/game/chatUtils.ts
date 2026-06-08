/**
 * 聊天工具函数
 * 用于发送系统公告等
 *
 * 注意：静态导出模式下无服务端 API，公告仅记录到控制台
 */

// 发送系统公告（静态模式下为 no-op）
export async function sendSystemAnnouncement(
  type: 'breakthrough' | 'legendary_item' | 'boss_kill' | 'tribulation_success' | 'faction_join',
  playerName: string,
  detail: string
): Promise<void> {
  console.log(`[Announce][${type}] ${playerName}: ${detail}`);
}

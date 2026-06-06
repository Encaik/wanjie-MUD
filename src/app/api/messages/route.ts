import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/storage/database/supabase-client';
import { MessageRecord } from '@/lib/game/types';

// GET - 分页获取消息列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || 'default';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // 参数验证
    if (page < 1 || pageSize < 1 || pageSize > 100) {
      return NextResponse.json(
        { error: 'Invalid pagination parameters' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    // 获取消息总数
    const { count, error: countError } = await client
      .from('game_messages')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId);
    
    if (countError) {
      console.error('Error counting messages:', countError);
      return NextResponse.json(
        { error: 'Failed to count messages' },
        { status: 500 }
      );
    }
    
    const total = count || 0;
    
    // 分页获取消息（按创建时间降序）
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    
    const { data, error } = await client
      .from('game_messages')
      .select('*')
      .eq('game_id', gameId)
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      );
    }
    
    // 转换数据库记录为 MessageRecord 格式
    const messages: MessageRecord[] = (data || []).map(row => ({
      id: row.id,
      timestamp: new Date(row.created_at).getTime(),
      type: row.type as MessageRecord['type'],
      title: row.title,
      content: row.content,
      details: row.details || undefined,
      rewards: row.rewards || undefined,
    }));
    
    return NextResponse.json({
      messages,
      total,
      page,
      pageSize,
      hasMore: from + pageSize < total,
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

// POST - 添加新消息
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { gameId = 'default', message } = body as {
      gameId?: string;
      message: MessageRecord;
    };

    if (!message || !message.id || !message.timestamp) {
      return NextResponse.json(
        { error: 'Invalid message format' },
        { status: 400 }
      );
    }

    const client = getSupabaseClient();
    
    // 插入消息到数据库
    const { error } = await client
      .from('game_messages')
      .insert({
        id: message.id,
        game_id: gameId,
        type: message.type,
        title: message.title,
        content: message.content,
        details: message.details || null,
        rewards: message.rewards || null,
        created_at: new Date(message.timestamp).toISOString(),
      });
    
    if (error) {
      console.error('Error inserting message:', error);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }
    
    // 获取新的总数
    const { count } = await client
      .from('game_messages')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId);
    
    return NextResponse.json({
      success: true,
      total: count || 0,
    });
  } catch (error) {
    console.error('Error adding message:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}

// DELETE - 清空消息
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId') || 'default';

    const client = getSupabaseClient();
    
    const { error } = await client
      .from('game_messages')
      .delete()
      .eq('game_id', gameId);
    
    if (error) {
      console.error('Error clearing messages:', error);
      return NextResponse.json(
        { error: 'Failed to clear messages' },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing messages:', error);
    return NextResponse.json(
      { error: 'Failed to clear messages' },
      { status: 500 }
    );
  }
}

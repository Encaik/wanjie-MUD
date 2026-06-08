'use client';

import { Sparkles, Scroll } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/utils';

interface BackstoryProps {
  backstory: string;
  onConfirm: () => void;
}

// 格式化段落文本，突出关键内容
function formatText(text: string, isFirstParagraph: boolean) {
  // 使用数组存储处理后的内容
  const parts: React.ReactNode[] = [];
  const key = 0;
  
  // 处理书名号《》内的内容
  const processBookTitles = (str: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    const regex = /《(.+?)》/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(str)) !== null) {
      // 添加书名号前的普通文本
      if (match.index > lastIndex) {
        parts.push(processQuotes(str.slice(lastIndex, match.index)));
      }
      // 添加书名号内容（带书名号）
      parts.push(
        <span key={key++} className="text-primary font-medium">
          《{match[1]}》
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余文本
    if (lastIndex < str.length) {
      parts.push(processQuotes(str.slice(lastIndex)));
    }
    
    return parts.length > 0 ? parts : str;
  };
  
  // 处理引号「」和""内的内容（对话/强调）
  const processQuotes = (str: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    // 匹配 「」 或 "" 或 ""
    const regex = /(?:「(.+?)」|"(.+?)"|"(.+?)")/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(str)) !== null) {
      // 添加引号前的普通文本
      if (match.index > lastIndex) {
        parts.push(processNumbers(str.slice(lastIndex, match.index)));
      }
      // 获取引号内容
      const quoteContent = match[1] || match[2] || match[3];
      parts.push(
        <span key={key++} className="text-amber-600 dark:text-amber-400 italic">
          「{quoteContent}」
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余文本
    if (lastIndex < str.length) {
      parts.push(processNumbers(str.slice(lastIndex)));
    }
    
    return parts.length > 0 ? parts : str;
  };
  
  // 处理数字（年龄、年份、数量等）
  const processNumbers = (str: string): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    let key = 0;
    // 匹配数字（包括中文数字单位）
    const regex = /(\d+(?:\.\d+)?(?:年|岁|天|月|日|个|次|倍|成|分|层|阶|级|品)?)/g;
    let lastIndex = 0;
    let match;
    
    while ((match = regex.exec(str)) !== null) {
      // 添加数字前的普通文本
      if (match.index > lastIndex) {
        parts.push(str.slice(lastIndex, match.index));
      }
      // 添加数字（高亮）
      parts.push(
        <span key={key++} className="text-blue-600 dark:text-blue-400 font-medium tabular-nums">
          {match[1]}
        </span>
      );
      lastIndex = match.index + match[0].length;
    }
    
    // 添加剩余文本
    if (lastIndex < str.length) {
      parts.push(str.slice(lastIndex));
    }
    
    return parts.length > 0 ? parts : str;
  };
  
  return processBookTitles(text);
}

export function BackstoryView({ backstory, onConfirm }: BackstoryProps) {
  // 将故事按段落分割并渲染
  const paragraphs = backstory.split('\n\n').filter(p => p.trim());

  return (
    <div className="min-h-dvh md:min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-5xl h-dvh md:h-auto flex flex-col px-4 sm:px-6 py-4">
        {/* 标题 - 固定 */}
        <div className="text-center mb-3 shrink-0">
          <div className="flex items-center justify-center gap-2 mb-1">
            <Scroll className="w-5 h-5 text-primary" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground">你的故事</h1>
            <Scroll className="w-5 h-5 text-primary" />
          </div>
          <p className="text-muted-foreground text-sm">命运的篇章由此展开</p>
        </div>

        {/* 故事卡片 - 移动端可滚动，PC端居中显示 */}
        <Card className="flex-1 min-h-0 border-border/50 shadow-lg overflow-hidden">
          <CardContent className="p-4 sm:p-6 md:p-8 h-full">
            {/* 移动端：内容超出时滚动；PC端：居中显示 */}
            <ScrollArea className="h-full md:h-auto">
              <div className="space-y-4 md:flex md:flex-col md:justify-center md:min-h-full md:py-4">
                {paragraphs.map((paragraph, index) => (
                  <p 
                    key={index} 
                    className={cn(
                      "leading-relaxed text-foreground/85",
                      // 第一段加大字号
                      index === 0 
                        ? "text-base sm:text-lg md:text-xl font-medium text-foreground" 
                        : "text-sm sm:text-base md:text-lg"
                    )}
                  >
                    {formatText(paragraph, index === 0)}
                  </p>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 开始按钮 - 固定 */}
        <div className="text-center mt-4 shrink-0">
          <Button 
            size="lg" 
            onClick={onConfirm}
            className="transition-all duration-300 shadow-md hover:shadow-lg"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            开启修行之旅
          </Button>
        </div>
      </div>
    </div>
  );
}

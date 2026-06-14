/**
 * 卡片四角隅饰 — 东方玄幻装饰元素
 *
 * 在相对定位的 Card 容器内渲染四个角的 CSS 边框装饰。
 * 与 WorldCard、CharacterCard、BackstoryView 的装饰语言一致。
 *
 * @example
 * <Card className="relative overflow-hidden">
 *   <CardCornerDecorations />
 *   <CardContent>...</CardContent>
 * </Card>
 *
 * @example 自定义颜色
 * <Card className="relative overflow-hidden">
 *   <CardCornerDecorations borderColor="border-amber-400/30" />
 *   ...
 * </Card>
 */
export function CardCornerDecorations({
  borderColor = 'border-primary/20',
  small = false,
}: {
  borderColor?: string;
  small?: boolean;
}) {
  const dims = small ? 'w-2 h-2' : 'w-2.5 h-2.5';

  return (
    <>
      <span className={`absolute top-0 left-0 ${dims} border-t-2 border-l-2 rounded-tl-sm opacity-50 z-10 ${borderColor}`} aria-hidden="true" />
      <span className={`absolute top-0 right-0 ${dims} border-t-2 border-r-2 rounded-tr-sm opacity-50 z-10 ${borderColor}`} aria-hidden="true" />
      <span className={`absolute bottom-0 left-0 ${dims} border-b-2 border-l-2 rounded-bl-sm opacity-50 z-10 ${borderColor}`} aria-hidden="true" />
      <span className={`absolute bottom-0 right-0 ${dims} border-b-2 border-r-2 rounded-br-sm opacity-50 z-10 ${borderColor}`} aria-hidden="true" />
    </>
  );
}

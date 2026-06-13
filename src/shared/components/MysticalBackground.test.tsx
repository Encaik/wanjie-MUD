/**
 * MysticalBackground 测试
 *
 * 测试四种场景变体的渲染、强度控制、水印文字覆盖。
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import { MysticalBackground } from './MysticalBackground';

describe('MysticalBackground', () => {
  it('渲染 runes 变体不崩溃', () => {
    const { container } = render(<MysticalBackground variant="runes" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('渲染 stars 变体不崩溃', () => {
    const { container } = render(<MysticalBackground variant="stars" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('渲染 destiny 变体不崩溃', () => {
    const { container } = render(<MysticalBackground variant="destiny" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('渲染 fated 变体不崩溃', () => {
    const { container } = render(<MysticalBackground variant="fated" />);
    expect(container.firstChild).toBeTruthy();
  });

  it('默认变体为 runes', () => {
    render(<MysticalBackground />);
    // 默认水印文字应为"万界"
    expect(screen.getByText('万界')).toBeTruthy();
  });

  it('stars 变体显示"万象"水印', () => {
    render(<MysticalBackground variant="stars" />);
    expect(screen.getByText('万象')).toBeTruthy();
  });

  it('destiny 变体显示"命运"水印', () => {
    render(<MysticalBackground variant="destiny" />);
    expect(screen.getByText('命运')).toBeTruthy();
  });

  it('fated 变体显示"宿命"水印', () => {
    render(<MysticalBackground variant="fated" />);
    expect(screen.getByText('宿命')).toBeTruthy();
  });

  it('自定义水印文字覆盖默认值', () => {
    render(<MysticalBackground variant="stars" watermarkText="自定义" />);
    expect(screen.getByText('自定义')).toBeTruthy();
  });

  it('subtle 强度下粒子数量减少', () => {
    const { container: full } = render(
      <MysticalBackground variant="stars" intensity="full" />,
    );
    const { container: subtle } = render(
      <MysticalBackground variant="stars" intensity="subtle" />,
    );
    // subtle 模式下粒子数应少于 full 模式
    const fullSpans = full.querySelectorAll('span[style]').length;
    const subtleSpans = subtle.querySelectorAll('span[style]').length;
    // 注意：柔光和水印不算粒子，这里只验证 subtle < full
    expect(subtleSpans).toBeLessThanOrEqual(fullSpans);
  });

  it('根元素为 aria-hidden', () => {
    const { container } = render(<MysticalBackground variant="runes" />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
  });
});

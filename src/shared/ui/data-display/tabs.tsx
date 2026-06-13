"use client"

import * as React from "react"

import * as TabsPrimitive from "@radix-ui/react-tabs"

import { cn } from "@/shared/utils"

// 原始 Tabs 组件 - 用于外部管理状态
function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      {...props}
    />
  )
}

// 受控 Tabs 组件 - 内部管理状态，避免重新渲染时状态重置
interface ControlledTabsProps extends Omit<React.ComponentProps<typeof TabsPrimitive.Root>, 'value' | 'onValueChange'> {
  defaultTab?: string;
  children: React.ReactNode;
  className?: string;
}

function ControlledTabs({ 
  defaultTab = '', 
  children, 
  className,
  ...props 
}: ControlledTabsProps) {
  const [tab, setTab] = React.useState(defaultTab);
  
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-2", className)}
      value={tab}
      onValueChange={setTab}
      {...props}
    >
      {children}
    </TabsPrimitive.Root>
  );
}

function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "bg-muted text-muted-foreground inline-flex h-9 w-fit items-center justify-center rounded-md p-[3px]",
        className
      )}
      {...props}
    />
  )
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "cursor-pointer data-[state=active]:bg-background data-[state=active]:shadow-[inset_0_-2px_0_var(--primary),0_1px_3px_0_oklch(0.3_0.04_55/0.1)] dark:data-[state=active]:text-foreground focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:outline-ring dark:data-[state=active]:border-input dark:data-[state=active]:bg-input/30 text-foreground dark:text-muted-foreground inline-flex h-[calc(100%-1px)] flex-1 items-center justify-center gap-1.5 rounded-md border border-transparent px-2 py-1 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:ring-[3px] focus-visible:outline-1 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, ControlledTabs }

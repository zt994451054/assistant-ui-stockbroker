"use client";

import {
  AssistantRuntimeProvider,
  Suggestions,
  useAui,
} from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";
import { useEffect } from "react";
import { createThread, getThreadState, sendMessage } from "@/lib/chatApi";

export function MyRuntimeProvider({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const runtime = useLangGraphRuntime({
    stream: async function* (messages, { initialize }) {
      let { externalId } = await initialize();

      if (!externalId) {
        const { thread_id } = await createThread();
        externalId = thread_id;
      }

      const generator = sendMessage({
        threadId: externalId,
        messages,
      });

      yield* generator;
    },
    create: async () => {
      const { thread_id } = await createThread();
      return { externalId: thread_id };
    },
    load: async (externalId) => {
      const state = await getThreadState(externalId);
      return {
        messages: state.values["messages"] as any,
        interrupts: state.tasks[0]?.interrupts,
      };
    },
  });

  // 页面加载时自动创建一个初始 thread，确保 aui.thread() 不是空占位符
  useEffect(() => {
    runtime.switchToNewThread();
  }, [runtime]);

  const aui = useAui({
    suggestions: Suggestions([
      {
        title: "特斯拉股价",
        label: "→ 股价卡片",
        prompt: "特斯拉现在的股价是多少？",
      },
      {
        title: "买入苹果股票",
        label: "→ 交易确认卡片",
        prompt: "我想买入5股苹果股票",
      },
      {
        title: "苹果利润表",
        label: "→ 利润表 + 柱状图",
        prompt: "帮我查看苹果公司近3年的利润表",
      },
      {
        title: "特斯拉资产负债表",
        label: "→ 资产结构可视化",
        prompt: "帮我查看特斯拉的资产负债表",
      },
      {
        title: "微软现金流量表",
        label: "→ 现金流 + 折线图",
        prompt: "帮我查看微软近3年的现金流量表",
      },
      {
        title: "英伟达公司信息",
        label: "→ 公司信息卡片",
        prompt: "帮我查询英伟达公司的基本信息",
      },
      {
        title: "特斯拉最新消息",
        label: "→ 搜索结果卡片",
        prompt: "特斯拉最近有什么新闻？",
      },
    ]),
  });

  return (
    <AssistantRuntimeProvider aui={aui} runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

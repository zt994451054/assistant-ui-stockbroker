"use client";

import {
  AssistantRuntimeProvider,
  Suggestions,
  useAui,
} from "@assistant-ui/react";
import { useLangGraphRuntime } from "@assistant-ui/react-langgraph";
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

  const aui = useAui({
    suggestions: Suggestions([
      {
        title: "特斯拉股价",
        label: "→ 股价卡片",
        prompt: "What's the current stock price of Tesla?",
      },
      {
        title: "买入苹果股票",
        label: "→ 交易确认卡片",
        prompt: "I want to buy 5 shares of Apple stock",
      },
      {
        title: "苹果利润表",
        label: "→ 利润表 + 柱状图",
        prompt: "Show me Apple's income statement for the last 3 years",
      },
      {
        title: "特斯拉资产负债表",
        label: "→ 资产结构可视化",
        prompt: "Show me Tesla's balance sheet",
      },
      {
        title: "微软现金流量表",
        label: "→ 现金流 + 折线图",
        prompt: "Show me Microsoft's cash flow statements for the last 3 years",
      },
      {
        title: "英伟达公司信息",
        label: "→ 公司信息卡片",
        prompt: "Tell me about NVIDIA as a company",
      },
      {
        title: "特斯拉最新消息",
        label: "→ 搜索结果卡片",
        prompt: "What's the latest news about Tesla?",
      },
    ]),
  });

  return (
    <AssistantRuntimeProvider aui={aui} runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

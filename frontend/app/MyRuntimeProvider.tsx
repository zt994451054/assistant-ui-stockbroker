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
        title: "苹果实时价格",
        label: "→ 股价卡片",
        prompt: "What is AAPL trading at right now?",
      },
      {
        title: "买入苹果股票",
        label: "→ 交易确认卡片",
        prompt: "I want to buy 5 shares of Apple stock",
      },
      {
        title: "买入英伟达股票",
        label: "→ 交易确认卡片",
        prompt: "Buy 10 shares of NVDA at market price",
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

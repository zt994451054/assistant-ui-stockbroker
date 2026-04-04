import {
  ThreadListItemMorePrimitive,
  ThreadListItemPrimitive,
  ThreadListPrimitive,
} from "@assistant-ui/react";
import { ArchiveIcon, MoreHorizontalIcon, PlusIcon, TrashIcon } from "lucide-react";
import type { FC } from "react";

export const ThreadList: FC = () => {
  return (
    <ThreadListPrimitive.Root className="flex h-full flex-col gap-1 overflow-y-auto bg-muted/30 border-r p-2">
      <ThreadListPrimitive.New className="flex h-9 w-full items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted">
        <PlusIcon className="size-4" />
        新建对话
      </ThreadListPrimitive.New>

      <div className="mt-2 flex flex-col gap-0.5">
        <ThreadListPrimitive.Items
          components={{ ThreadListItem }}
        />
      </div>
    </ThreadListPrimitive.Root>
  );
};

const ThreadListItem: FC = () => {
  return (
    <ThreadListItemPrimitive.Root className="group relative flex h-9 items-center rounded-lg transition-colors hover:bg-muted data-[active]:bg-muted data-[active]:font-medium">
      <ThreadListItemPrimitive.Trigger className="flex-1 truncate px-3 text-left text-sm">
        <ThreadListItemPrimitive.Title fallback="New Chat" />
      </ThreadListItemPrimitive.Trigger>

      <ThreadListItemMorePrimitive.Root>
        <ThreadListItemMorePrimitive.Trigger asChild>
          <button className="mr-1.5 flex size-6 items-center justify-center rounded-md opacity-0 transition-opacity hover:bg-accent group-hover:opacity-100 data-[state=open]:opacity-100">
            <MoreHorizontalIcon className="size-3.5" />
          </button>
        </ThreadListItemMorePrimitive.Trigger>
        <ThreadListItemMorePrimitive.Content
          side="right"
          align="start"
          className="z-50 min-w-32 overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md"
        >
          <ThreadListItemPrimitive.Archive asChild>
            <ThreadListItemMorePrimitive.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent">
              <ArchiveIcon className="size-4" />
              归档
            </ThreadListItemMorePrimitive.Item>
          </ThreadListItemPrimitive.Archive>
          <ThreadListItemPrimitive.Delete asChild>
            <ThreadListItemMorePrimitive.Item className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-destructive outline-none hover:bg-destructive/10">
              <TrashIcon className="size-4" />
              删除
            </ThreadListItemMorePrimitive.Item>
          </ThreadListItemPrimitive.Delete>
        </ThreadListItemMorePrimitive.Content>
      </ThreadListItemMorePrimitive.Root>
    </ThreadListItemPrimitive.Root>
  );
};

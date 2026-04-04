"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { ExternalLinkIcon, SearchIcon } from "lucide-react";

type SearchResult = {
  url: string;
  title: string;
  content: string;
};

export const TavilySearchTool = makeAssistantToolUI<{ query: string }, string>({
  toolName: "tavily_search",
  render: function TavilySearchUI({ args, result, status }) {
    let results: SearchResult[] = [];
    try {
      if (result) {
        const parsed = JSON.parse(result);
        results = Array.isArray(parsed) ? parsed : [];
      }
    } catch (_e) {}

    return (
      <div className="mb-4 w-full max-w-sm space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <SearchIcon className="size-4 shrink-0 text-muted-foreground" />
          <span className="font-medium truncate">"{args.query}"</span>
          {status.type === "running" && (
            <span className="shrink-0 text-xs text-muted-foreground animate-pulse">
              搜索中…
            </span>
          )}
        </div>

        {results.map((item, i) => (
          <div key={i} className="rounded-lg border bg-card p-3 text-sm">
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-1 font-medium text-blue-500 hover:underline leading-snug"
            >
              <span className="flex-1">{item.title}</span>
              <ExternalLinkIcon className="mt-0.5 size-3 shrink-0" />
            </a>
            <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground leading-relaxed">
              {item.content}
            </p>
          </div>
        ))}
      </div>
    );
  },
});

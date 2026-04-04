"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Building2Icon,
  CalendarIcon,
  ExternalLinkIcon,
  TrendingUpIcon,
  UsersIcon,
} from "lucide-react";

type CompanyFacts = {
  ticker: string;
  name: string;
  market_cap: number;
  number_of_employees: number;
  sic_description: string;
  website_url: string;
  listing_date: string;
  is_active: boolean;
};

function formatMarketCap(value: number | null | undefined): string {
  if (value == null) return "N/A";
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

function formatEmployees(value: number | null | undefined): string {
  if (value == null) return "N/A";
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
  return value.toLocaleString();
}

export const CompanyFactsTool = makeAssistantToolUI<{ ticker: string }, string>({
  toolName: "company_facts",
  render: function CompanyFactsUI({ args, result }) {
    let facts: CompanyFacts | null = null;
    try {
      if (result) {
        const parsed = JSON.parse(result);
        facts = parsed.company_facts ?? null;
      }
    } catch (_e) {}

    if (!facts) {
      return (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground">
          <Building2Icon className="size-4 animate-pulse" />
          <span>正在查询 {args.ticker}…</span>
        </div>
      );
    }

    return (
      <Card className="mb-4 w-full max-w-sm overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-tight">{facts.name}</CardTitle>
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs font-semibold">
              {facts.ticker}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{facts.sic_description}</p>
        </CardHeader>

        <CardContent className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
          <div className="flex items-center gap-2">
            <TrendingUpIcon className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">市值</p>
              <p className="font-semibold">{formatMarketCap(facts.market_cap)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <UsersIcon className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">员工数</p>
              <p className="font-semibold">{formatEmployees(facts.number_of_employees)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <CalendarIcon className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">上市日期</p>
              <p className="font-semibold">{facts.listing_date}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Building2Icon className="size-4 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">状态</p>
              <p className={`font-semibold ${facts.is_active ? "text-green-500" : "text-red-500"}`}>
                {facts.is_active ? "活跃" : "停牌"}
              </p>
            </div>
          </div>

          {facts.website_url && (
            <div className="col-span-2 flex items-center gap-1.5 border-t pt-2">
              <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
              <a
                href={facts.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="truncate text-xs text-blue-500 hover:underline"
              >
                {facts.website_url.replace(/^https?:\/\//, "")}
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
});

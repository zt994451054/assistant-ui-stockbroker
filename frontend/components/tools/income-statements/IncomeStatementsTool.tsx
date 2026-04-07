"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { TrendingUpIcon } from "lucide-react";

type IncomeStatement = {
  ticker: string;
  calendar_date: string;
  report_period: string;
  period: "quarterly" | "ttm" | "annual";
  revenue: number;
  gross_profit: number;
  operating_income: number;
  net_income: number;
  earnings_per_share: number;
};

const PERIOD_LABEL: Record<string, string> = {
  annual: "年报",
  quarterly: "季报",
  ttm: "TTM",
};

function formatBillion(v: number | null | undefined): string {
  if (v == null) return "N/A";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

function pct(num: number | null | undefined, den: number | null | undefined): string {
  if (!num || !den || den === 0) return "N/A";
  return `${((num / den) * 100).toFixed(1)}%`;
}

function shortDate(d: string): string {
  return d?.slice(0, 7) ?? "";
}

const chartConfig = {
  revenue: { label: "营业收入", color: "hsl(217, 91%, 60%)" },
  net_income: { label: "净利润", color: "hsl(142, 71%, 45%)" },
};

export const IncomeStatementsTool = makeAssistantToolUI<
  { ticker: string; period?: string; limit?: number },
  string
>({
  toolName: "income_statements",
  render: function IncomeStatementsUI({ args, result }) {
    let statements: IncomeStatement[] = [];
    try {
      if (result) {
        const parsed = JSON.parse(result);
        statements = parsed.income_statements ?? [];
      }
    } catch (_e) {}

    if (!result || statements.length === 0) {
      return (
        <div className="mb-4 flex items-center gap-2 text-sm text-muted-foreground animate-pulse">
          <TrendingUpIcon className="size-4" />
          <span>正在获取 {args.ticker} 利润表…</span>
        </div>
      );
    }

    const latest = statements[0];
    const chartData = [...statements]
      .reverse()
      .slice(-5)
      .map((s) => ({
        date: shortDate(s.calendar_date),
        revenue: s.revenue,
        net_income: s.net_income,
      }));

    return (
      <Card className="mb-4 w-full max-w-lg overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {latest.ticker} · 利润表
            </CardTitle>
            <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium">
              {PERIOD_LABEL[latest.period] ?? latest.period}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            最新报告期：{latest.calendar_date}
          </p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 核心指标 */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { label: "营业收入", value: formatBillion(latest.revenue), sub: "" },
              {
                label: "毛利润",
                value: formatBillion(latest.gross_profit),
                sub: `毛利率 ${pct(latest.gross_profit, latest.revenue)}`,
              },
              {
                label: "营业利润",
                value: formatBillion(latest.operating_income),
                sub: `营业利润率 ${pct(latest.operating_income, latest.revenue)}`,
              },
              {
                label: "净利润",
                value: formatBillion(latest.net_income),
                sub: `净利率 ${pct(latest.net_income, latest.revenue)}`,
              },
            ].map(({ label, value, sub }) => (
              <div key={label} className="rounded-lg bg-muted/50 p-2.5">
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="font-semibold">{value}</p>
                {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
              </div>
            ))}
          </div>

          {/* EPS */}
          <div className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm">
            <span className="text-muted-foreground">每股收益（EPS）</span>
            <span className="font-semibold">
              ${latest.earnings_per_share?.toFixed(2) ?? "N/A"}
            </span>
          </div>

          {/* 柱状图（多期时展示） */}
          {chartData.length > 1 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                营收 & 净利润趋势
              </p>
              <ChartContainer config={chartConfig} className="h-36 w-full">
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis
                    tickFormatter={(v) => formatBillion(v).replace("$", "")}
                    tick={{ fontSize: 9 }}
                    width={36}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v, name) => [
                          formatBillion(v as number),
                          chartConfig[name as keyof typeof chartConfig]?.label ?? name,
                        ]}
                      />
                    }
                  />
                  <Bar dataKey="revenue" fill={chartConfig.revenue.color} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="net_income" fill={chartConfig.net_income.color} radius={[3, 3, 0, 0]} />
                </BarChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
});

"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  ArrowDownIcon,
  ArrowUpIcon,
  Droplets,
  MinusIcon,
} from "lucide-react";

type CashFlowStatement = {
  ticker: string;
  calendar_date: string;
  period: "quarterly" | "ttm" | "annual";
  net_cash_flow_from_operations: number;
  net_cash_flow_from_investing: number;
  net_cash_flow_from_financing: number;
  capital_expenditure: number;
  change_in_cash_and_equivalents: number;
};

function fmt(v: number | null | undefined): string {
  if (v == null) return "N/A";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "+";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

function fmtAbs(v: number | null | undefined): string {
  return fmt(v)?.replace(/^[+-]/, "") ?? "N/A";
}

function shortDate(d: string): string {
  return d?.slice(0, 7) ?? "";
}

const chartConfig = {
  operations: { label: "经营现金流", color: "hsl(142, 71%, 45%)" },
};

export const CashFlowStatementsTool = makeAssistantToolUI<
  { ticker: string; period?: string; limit?: number },
  string
>({
  toolName: "cash_flow_statements",
  render: function CashFlowStatementsUI({ args, result }) {
    let statements: CashFlowStatement[] = [];
    try {
      if (result) {
        const parsed = JSON.parse(result);
        statements = parsed.cash_flow_statements ?? [];
      }
    } catch (_e) {}

    if (!result || statements.length === 0) {
      return (
        <div className="mb-4 flex animate-pulse items-center gap-2 text-sm text-muted-foreground">
          <Droplets className="size-4" />
          <span>正在获取 {args.ticker} 现金流量表…</span>
        </div>
      );
    }

    const latest = statements[0];
    const fcf =
      (latest.net_cash_flow_from_operations ?? 0) +
      (latest.capital_expenditure ?? 0);

    const flows = [
      {
        label: "经营活动",
        value: latest.net_cash_flow_from_operations,
        desc: "主营业务产生的现金",
      },
      {
        label: "投资活动",
        value: latest.net_cash_flow_from_investing,
        desc: "资本支出、投资等",
      },
      {
        label: "融资活动",
        value: latest.net_cash_flow_from_financing,
        desc: "借款、分红、回购等",
      },
    ];

    const chartData = [...statements]
      .reverse()
      .slice(-6)
      .map((s) => ({
        date: shortDate(s.calendar_date),
        operations: s.net_cash_flow_from_operations,
      }));

    return (
      <Card className="mb-4 w-full max-w-lg overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">
              {latest.ticker} · 现金流量表
            </CardTitle>
            <span className="text-xs text-muted-foreground">
              {latest.calendar_date}
            </span>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* 三大现金流 */}
          {flows.map(({ label, value, desc }) => {
            const isPos = (value ?? 0) >= 0;
            const Icon = isPos ? ArrowUpIcon : ArrowDownIcon;
            const color = isPos ? "text-green-600" : "text-red-500";
            const bg = isPos ? "bg-green-50 dark:bg-green-950/30" : "bg-red-50 dark:bg-red-950/30";
            return (
              <div
                key={label}
                className={`flex items-center justify-between rounded-lg px-3 py-2 ${bg}`}
              >
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <div className={`flex items-center gap-1 font-semibold ${color}`}>
                  <Icon className="size-3.5" />
                  <span className="text-sm">{fmtAbs(value)}</span>
                </div>
              </div>
            );
          })}

          {/* 自由现金流 */}
          <div className="rounded-lg border-2 border-dashed px-3 py-2">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">自由现金流</p>
                <p className="text-xs text-muted-foreground">
                  经营现金流 + 资本支出
                </p>
              </div>
              <span
                className={`text-sm font-bold ${fcf >= 0 ? "text-green-600" : "text-red-500"}`}
              >
                {fmt(fcf)}
              </span>
            </div>
          </div>

          {/* 净现金变动 */}
          <div className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-1.5 text-sm">
            <span className="text-muted-foreground">净现金变动</span>
            <div className="flex items-center gap-1">
              {(latest.change_in_cash_and_equivalents ?? 0) === 0 ? (
                <MinusIcon className="size-3.5 text-muted-foreground" />
              ) : (latest.change_in_cash_and_equivalents ?? 0) > 0 ? (
                <ArrowUpIcon className="size-3.5 text-green-600" />
              ) : (
                <ArrowDownIcon className="size-3.5 text-red-500" />
              )}
              <span className="font-semibold">
                {fmtAbs(latest.change_in_cash_and_equivalents)}
              </span>
            </div>
          </div>

          {/* 经营现金流趋势 */}
          {chartData.length > 1 && (
            <div>
              <p className="mb-1 text-xs font-medium text-muted-foreground">
                经营现金流趋势
              </p>
              <ChartContainer config={chartConfig} className="h-28 w-full">
                <LineChart
                  data={chartData}
                  margin={{ top: 4, right: 4, bottom: 0, left: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis
                    tickFormatter={(v) => fmtAbs(v).replace("$", "")}
                    tick={{ fontSize: 9 }}
                    width={36}
                  />
                  <ChartTooltip
                    content={
                      <ChartTooltipContent
                        formatter={(v) => [
                          fmt(v as number),
                          "经营现金流",
                        ]}
                      />
                    }
                  />
                  <Line
                    type="monotone"
                    dataKey="operations"
                    stroke={chartConfig.operations.color}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>
    );
  },
});

"use client";

import { makeAssistantToolUI } from "@assistant-ui/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3Icon, CoinsIcon, ScaleIcon } from "lucide-react";

type BalanceSheet = {
  ticker: string;
  calendar_date: string;
  period: "quarterly" | "ttm" | "annual";
  total_assets: number;
  current_assets: number;
  non_current_assets: number;
  cash_and_equivalents: number;
  total_liabilities: number;
  current_liabilities: number;
  non_current_liabilities: number;
  shareholders_equity: number;
  total_debt: number;
};

function fmt(v: number | null | undefined): string {
  if (v == null) return "N/A";
  const abs = Math.abs(v);
  const sign = v < 0 ? "-" : "";
  if (abs >= 1e12) return `${sign}$${(abs / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(2)}M`;
  return `${sign}$${abs.toLocaleString()}`;
}

function pct(a: number, b: number): string {
  if (!b) return "N/A";
  return `${((a / b) * 100).toFixed(1)}%`;
}

export const BalanceSheetsTool = makeAssistantToolUI<
  { ticker: string; period?: string; limit?: number },
  string
>({
  toolName: "balance_sheets",
  render: function BalanceSheetsUI({ args, result }) {
    let sheets: BalanceSheet[] = [];
    try {
      if (result) {
        const parsed = JSON.parse(result);
        sheets = parsed.balance_sheets ?? [];
      }
    } catch (_e) {}

    if (!result || sheets.length === 0) {
      return (
        <div className="mb-4 flex animate-pulse items-center gap-2 text-sm text-muted-foreground">
          <ScaleIcon className="size-4" />
          <span>正在获取 {args.ticker} 资产负债表…</span>
        </div>
      );
    }

    const s = sheets[0];
    const totalA = s.total_assets || 1;
    const currentPct = Math.round((s.current_assets / totalA) * 100);
    const nonCurrentPct = 100 - currentPct;
    const debtRatio = pct(s.total_liabilities, s.total_assets);
    const currentRatio =
      s.current_liabilities > 0
        ? (s.current_assets / s.current_liabilities).toFixed(2)
        : "N/A";

    return (
      <Card className="mb-4 w-full max-w-lg overflow-hidden">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">{s.ticker} · 资产负债表</CardTitle>
            <span className="text-xs text-muted-foreground">{s.calendar_date}</span>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* 三大块 */}
          <div className="grid grid-cols-3 divide-x rounded-lg border text-center text-sm">
            {[
              { icon: <CoinsIcon className="mx-auto mb-1 size-4 text-blue-500" />, label: "总资产", value: fmt(s.total_assets), color: "text-blue-600" },
              { icon: <ScaleIcon className="mx-auto mb-1 size-4 text-red-500" />, label: "总负债", value: fmt(s.total_liabilities), color: "text-red-600" },
              { icon: <BarChart3Icon className="mx-auto mb-1 size-4 text-green-500" />, label: "股东权益", value: fmt(s.shareholders_equity), color: "text-green-600" },
            ].map(({ icon, label, value, color }) => (
              <div key={label} className="py-2.5 px-1">
                {icon}
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className={`text-xs font-semibold ${color}`}>{value}</p>
              </div>
            ))}
          </div>

          {/* 资产结构比例条 */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">资产结构</p>
            <div className="flex h-5 w-full overflow-hidden rounded-full text-xs">
              <div
                className="flex items-center justify-center bg-blue-500 text-white transition-all"
                style={{ width: `${currentPct}%` }}
              >
                {currentPct > 15 && `流动 ${currentPct}%`}
              </div>
              <div
                className="flex items-center justify-center bg-indigo-400 text-white transition-all"
                style={{ width: `${nonCurrentPct}%` }}
              >
                {nonCurrentPct > 15 && `非流动 ${nonCurrentPct}%`}
              </div>
            </div>
            <div className="mt-1 flex justify-between text-xs text-muted-foreground">
              <span>流动资产 {fmt(s.current_assets)}</span>
              <span>非流动资产 {fmt(s.non_current_assets)}</span>
            </div>
          </div>

          {/* 负债结构比例条 */}
          <div>
            <p className="mb-1.5 text-xs font-medium text-muted-foreground">负债结构</p>
            {(() => {
              const totalL = s.total_liabilities || 1;
              const cp = Math.round((s.current_liabilities / totalL) * 100);
              return (
                <>
                  <div className="flex h-5 w-full overflow-hidden rounded-full text-xs">
                    <div
                      className="flex items-center justify-center bg-red-400 text-white"
                      style={{ width: `${cp}%` }}
                    >
                      {cp > 15 && `流动 ${cp}%`}
                    </div>
                    <div
                      className="flex items-center justify-center bg-orange-300 text-white"
                      style={{ width: `${100 - cp}%` }}
                    >
                      {100 - cp > 15 && `长期 ${100 - cp}%`}
                    </div>
                  </div>
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>流动负债 {fmt(s.current_liabilities)}</span>
                    <span>长期负债 {fmt(s.non_current_liabilities)}</span>
                  </div>
                </>
              );
            })()}
          </div>

          {/* 关键指标 */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: "现金及等价物", value: fmt(s.cash_and_equivalents) },
              { label: "总债务", value: fmt(s.total_debt) },
              { label: "资产负债率", value: debtRatio },
              { label: "流动比率", value: currentRatio },
            ].map(({ label, value }) => (
              <div key={label} className="flex justify-between rounded-md bg-muted/50 px-2.5 py-1.5">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="text-xs font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  },
});

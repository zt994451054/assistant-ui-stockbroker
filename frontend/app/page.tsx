"use client";

import { Thread } from "@/components/assistant-ui/thread";
import { ThreadList } from "@/components/assistant-ui/thread-list";
import { BalanceSheetsTool } from "@/components/tools/balance-sheets/BalanceSheetsTool";
import { CashFlowStatementsTool } from "@/components/tools/cash-flow-statements/CashFlowStatementsTool";
import { CompanyFactsTool } from "@/components/tools/company-facts/CompanyFactsTool";
import { IncomeStatementsTool } from "@/components/tools/income-statements/IncomeStatementsTool";
import { PriceSnapshotTool } from "@/components/tools/price-snapshot/PriceSnapshotTool";
import { PurchaseStockTool } from "@/components/tools/purchase-stock/PurchaseStockTool";
import { TavilySearchTool } from "@/components/tools/tavily-search/TavilySearchTool";

export default function Home() {
  return (
    <div className="grid h-dvh grid-cols-[260px_1fr]">
      <ThreadList />
      <div className="relative overflow-hidden">
        <Thread />
        <PriceSnapshotTool />
        <PurchaseStockTool />
        <CompanyFactsTool />
        <TavilySearchTool />
        <IncomeStatementsTool />
        <BalanceSheetsTool />
        <CashFlowStatementsTool />
      </div>
    </div>
  );
}

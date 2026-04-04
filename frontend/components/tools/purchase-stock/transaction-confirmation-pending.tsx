"use client";

import { CheckIcon, XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

type TransactionConfirmation = {
  ticker: string;
  companyName: string;
  quantity: number;
  maxPurchasePrice: number;
  onConfirm: () => void;
  onReject: () => void;
};

export function TransactionConfirmationPending(props: TransactionConfirmation) {
  const {
    ticker,
    companyName,
    quantity,
    maxPurchasePrice,
    onConfirm,
    onReject,
  } = props;

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle className="font-bold text-2xl">
          确认交易
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <p className="font-medium text-muted-foreground text-sm">代码：</p>
          <p className="font-bold text-sm">{ticker}</p>
          <p className="font-medium text-muted-foreground text-sm">公司：</p>
          <p className="text-sm">{companyName}</p>
          <p className="font-medium text-muted-foreground text-sm">数量：</p>
          <p className="text-sm">{quantity} 股</p>
          <p className="font-medium text-muted-foreground text-sm">
            最高买入价：
          </p>
          <p className="text-sm">${maxPurchasePrice?.toFixed(2)}</p>
        </div>
        <div className="rounded-md bg-muted p-3">
          <p className="font-medium text-sm">最大总成本：</p>
          <p className="font-bold text-lg">
            ${(quantity * maxPurchasePrice)?.toFixed(2)}
          </p>
        </div>
      </CardContent>
      <CardFooter className="flex justify-end">
        <Button variant="outline" onClick={onReject}>
          <XIcon className="mr-2 h-4 w-4" />
          拒绝
        </Button>
        <Button onClick={onConfirm}>
          <CheckIcon className="mr-2 h-4 w-4" />
          确认
        </Button>
      </CardFooter>
    </Card>
  );
}

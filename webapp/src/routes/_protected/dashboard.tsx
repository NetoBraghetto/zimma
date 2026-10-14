import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { format, formatISO, startOfMonth } from "date-fns";
import Decimal from "decimal.js";
import type { ReactNode } from "react";
import type { IconType } from "react-icons";
import { TbArrowDown, TbArrowRight, TbArrowUp, TbTrendingDown, TbTrendingUp } from "react-icons/tb";
import { FloatingActionButton } from "@/components/layout/floating-action-button";
import { FinancialRecordStatusBadge } from "@/components/resources/financial-record/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FinancialRecordType } from "@/constants/financial-record";
import { TagIcons } from "@/constants/tag-icons";
import { dashboardService } from "@/services/dashboard-service";
import type { FinancialRecordModel } from "@/services/financial-record-service";

const LATEST_RECORDS_LIMIT = 6;

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const percentFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 1, signDisplay: "exceptZero" });

const dashboardQueryOptions = (month: Date) => {
  return queryOptions({
    queryKey: ["dashboard", format(month, "yyyy-MM")],
    queryFn: () => dashboardService.get(formatISO(month)),
  });
};

export const Route = createFileRoute("/_protected/dashboard")({
  component: RouteComponent,
});

function sumAmount(items: FinancialRecordModel[]): Decimal {
  return items.reduce((total, item) => total.plus(item.amount), new Decimal(0));
}

function formatCurrency(value?: Decimal): string {
  return value ? currencyFormatter.format(value.toNumber()) : "—";
}

function formatSignedAmount(item: FinancialRecordModel): string {
  const sign = item.type === FinancialRecordType.EXPENSE ? "-" : "+";
  return `${sign} ${currencyFormatter.format(Number(item.amount))}`;
}

function signedAmount(item: FinancialRecordModel): Decimal {
  return item.type === FinancialRecordType.EXPENSE ? new Decimal(item.amount).neg() : new Decimal(item.amount);
}

function byDueDate(a: FinancialRecordModel, b: FinancialRecordModel): number {
  return new Date(a.due_date).getTime() - new Date(b.due_date).getTime() || a.id - b.id;
}

function byLatestCreated(a: FinancialRecordModel, b: FinancialRecordModel): number {
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime() || b.id - a.id;
}

function RouteComponent() {
  const month = startOfMonth(new Date());
  const { data } = useQuery(dashboardQueryOptions(month));
  const dashboard = data?.data;

  const incomes = dashboard?.incomes ?? [];
  const expenses = dashboard?.expenses ?? [];
  const incomeTotal = dashboard ? sumAmount(incomes) : undefined;
  const expenseTotal = dashboard ? sumAmount(expenses) : undefined;
  const balance = incomeTotal && expenseTotal ? incomeTotal.minus(expenseTotal) : undefined;

  const previousIncome = dashboard ? new Decimal(dashboard.previous_month_total_income || 0) : undefined;
  const previousExpense = dashboard ? new Decimal(dashboard.previous_month_total_expense || 0) : undefined;
  const previousBalance = previousIncome && previousExpense ? previousIncome.minus(previousExpense) : undefined;

  const sortedExpenses = [...expenses].sort(byDueDate);
  const latestRecords = [...incomes, ...expenses].sort(byLatestCreated).slice(0, LATEST_RECORDS_LIMIT);
  const latestTotal = latestRecords.reduce((total, item) => total.plus(signedAmount(item)), new Decimal(0));

  return (
    <main className="grid lg:grid-cols-3 gap-6">
      <div>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Balanço geral</CardTitle>
          </CardHeader>
          <CardContent>
            <strong className="text-4xl leading-1 text-primary">{formatCurrency(balance)}</strong>
          </CardContent>
          <CardFooter>
            <ComparisonBadge current={balance} previous={previousBalance} upIcon={TbTrendingUp} downIcon={TbTrendingDown} />
          </CardFooter>
        </Card>
      </div>
      <div>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Receita do mês</CardTitle>
          </CardHeader>
          <CardContent>
            <strong className="text-2xl leading-1">{formatCurrency(incomeTotal)}</strong>
          </CardContent>
          <CardFooter>
            <ComparisonBadge current={incomeTotal} previous={previousIncome} upIcon={TbArrowUp} downIcon={TbArrowDown} />
          </CardFooter>
        </Card>
      </div>
      <div>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Despesa do mês</CardTitle>
          </CardHeader>
          <CardContent>
            <strong className="text-2xl leading-1">{formatCurrency(expenseTotal)}</strong>
          </CardContent>
          <CardFooter>
            <ComparisonBadge current={expenseTotal} previous={previousExpense} upIcon={TbArrowUp} downIcon={TbArrowDown} inverted />
          </CardFooter>
        </Card>
      </div>
      <div>
        <Card size="sm">
          <CardHeader>
            <CardTitle>Despesa do mês</CardTitle>
          </CardHeader>
          <CardContent></CardContent>
        </Card>
      </div>
      <div className="col-span-2">
        <Card size="sm">
          <CardContent>
            <Table>
              <TableCaption>Lista de despesas.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center w-0">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedExpenses.map((item) => (
                  <FinancialRecordRow key={item.id} item={item} />
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className="text-right text-red-700">{expenseTotal ? `- ${formatCurrency(expenseTotal)}` : "—"}</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="col-span-3">
        <Card size="sm">
          <CardHeader>
            <CardTitle>Últimos lançamentos</CardTitle>
            <CardAction>
              <Button variant="ghost" size="sm">
                Ver todos
                <TbArrowRight className="size-4" />
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>Lista de lançamentos.</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">Data</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead className="text-center w-0">Situação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestRecords.map((item) => (
                  <FinancialRecordRow key={item.id} item={item} />
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4}>Total</TableCell>
                  <TableCell className={`text-right ${latestTotal.isNegative() ? "text-red-700" : "text-emerald-700"}`}>
                    {dashboard ? currencyFormatter.format(latestTotal.toNumber()) : "—"}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </CardContent>
        </Card>
      </div>
      <FloatingActionButton />
    </main>
  );
}

type ComparisonBadgeProps = {
  current?: Decimal;
  previous?: Decimal;
  upIcon: IconType;
  downIcon: IconType;
  // For expenses, going up is bad news.
  inverted?: boolean;
};

function ComparisonBadge({ current, previous, upIcon: UpIcon, downIcon: DownIcon, inverted }: ComparisonBadgeProps): ReactNode {
  if (!current || !previous || previous.isZero()) {
    return (
      <Badge variant="gray" size="lg">
        Sem dados do mês passado
      </Badge>
    );
  }

  const change = current.minus(previous).div(previous.abs()).times(100);
  const isUp = !change.isNegative();
  const isGood = inverted ? !isUp || change.isZero() : isUp;
  const Icon = isUp ? UpIcon : DownIcon;

  return (
    <Badge variant={isGood ? "emerald" : "red"} size="lg">
      <Icon /> {percentFormatter.format(change.toNumber())}% em relação ao mês passado
    </Badge>
  );
}

function FinancialRecordRow({ item }: { item: FinancialRecordModel }): ReactNode {
  const Icon = item.tags?.map((tag) => TagIcons[tag.icon]?.icon).find(Boolean);
  const isExpense = item.type === FinancialRecordType.EXPENSE;

  return (
    <TableRow>
      <TableCell className="font-medium">{format(new Date(item.due_date), "dd/MM")}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          {Icon ? <Icon className="size-4" /> : null}
          {item.name}
        </div>
      </TableCell>
      <TableCell>
        <div className="flex gap-2 flex-wrap">
          {item.tags?.map((tag) => (
            <Badge key={tag.id} variant="gray" size="md" shape="round">
              {tag.name}
            </Badge>
          ))}
        </div>
      </TableCell>
      <TableCell className={`text-right ${isExpense ? "text-red-700" : "text-emerald-700"}`}>{formatSignedAmount(item)}</TableCell>
      <TableCell className="text-center">
        <FinancialRecordStatusBadge item={item} />
      </TableCell>
    </TableRow>
  );
}

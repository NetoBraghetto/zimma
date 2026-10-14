import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { addMonths, format, formatISO, isValid, parse, startOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import Decimal from "decimal.js";
import { useState } from "react";
import { TbChevronLeft, TbChevronRight, TbDotsVertical, TbEdit, TbPlus, TbTrash } from "react-icons/tb";
import { toast } from "sonner";
import noDataImage from "@/assets/images/undraw_no_data.svg";
import { ContainerLoading } from "@/components/container-loading";
import { DeletionModal } from "@/components/deletion-modal";
import { FinancialRecordStatusBadge } from "@/components/resources/financial-record/status-badge";
import { TagBadge } from "@/components/resources/tag/tag-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FinancialRecordType } from "@/constants/financial-record";
import { QS_PAGE_INDEX, QS_PER_PAGE_INDEX } from "@/constants/querystring";
import { cn } from "@/lib/utils";
import { type FinancialRecordModel, financialRecordService } from "@/services/financial-record-service";

const QS_MONTH_INDEX = "month";
const MONTH_FORMAT = "yyyy-MM";

const currencyFormatter = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function parseMonth(value?: string): Date {
  const month = value ? parse(value, MONTH_FORMAT, new Date()) : new Date();
  return startOfMonth(isValid(month) ? month : new Date());
}

const financialRecordQueryOptions = (month: Date, page: string, pageSize: string) => {
  return queryOptions({
    queryKey: ["financial-record", FinancialRecordType.EXPENSE, format(month, MONTH_FORMAT), page, pageSize],
    queryFn: () => {
      return financialRecordService.get<FinancialRecordModel>(
        new URLSearchParams({
          type: String(FinancialRecordType.EXPENSE),
          month: formatISO(month),
          page,
          pageSize,
        }),
      );
    },
  });
};

export const Route = createFileRoute("/_protected/despesas/")({
  head: () => ({
    meta: [{ title: "Despesas" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch() as Record<string, string>;
  const month = parseMonth(search[QS_MONTH_INDEX]);
  const { data, refetch, isFetching } = useQuery(
    financialRecordQueryOptions(month, search[QS_PAGE_INDEX] || "1", search[QS_PER_PAGE_INDEX] || "15"),
  );
  const [deletingItem, setDeletingItem] = useState<FinancialRecordModel>();

  function goToMonth(amount: number) {
    navigate({
      search: {
        ...search,
        [QS_PAGE_INDEX]: 1,
        [QS_MONTH_INDEX]: format(addMonths(month, amount), MONTH_FORMAT),
      },
    });
  }

  const monthLabel = format(month, "MMMM 'de' yyyy", { locale: ptBR });
  const amountTotal = (data?.data ?? []).reduce((total, item) => total.plus(item.amount), new Decimal(0));

  return (
    <div className="relative">
      <Card className="gap-0 pb-0">
        <CardHeader className="border-b">
          <CardTitle>Despesas</CardTitle>
          <CardDescription>
            Total do mês: <strong className="text-foreground">{data ? currencyFormatter.format(amountTotal.toNumber()) : "—"}</strong>
          </CardDescription>
          <CardAction className="flex items-center gap-2">
            <Button variant="outline" size="icon-sm" aria-label="Mês anterior" onClick={() => goToMonth(-1)}>
              <TbChevronLeft className="size-4" />
            </Button>
            <span className="min-w-36 text-center text-xs font-semibold tracking-widest uppercase">{monthLabel}</span>
            <Button variant="outline" size="icon-sm" aria-label="Próximo mês" onClick={() => goToMonth(1)}>
              <TbChevronRight className="size-4" />
            </Button>
          </CardAction>
        </CardHeader>

        <CardContent className="relative px-0">
          {isFetching ? <ContainerLoading size="xs" /> : null}

          {data && data.data.length === 0 ? (
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center text-muted-foreground">
              <img src={noDataImage} alt="" className="w-40" />
              <p>Nenhuma despesa em {monthLabel}.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-4 sm:pl-6">Despesa</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-0" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.data.map((item) => (
                  <FinancialRecordRow key={item.id} item={item} onDelete={setDeletingItem} />
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Link
        to="/despesas/nova"
        className={cn(buttonVariants({ size: "icon", variant: "expense" }), "fixed right-6 bottom-6 z-50 size-12 rounded-full shadow-lg")}
      >
        <TbPlus className="size-6" />
        <span className="sr-only">Adicionar despesa</span>
      </Link>

      <DeletionModal
        service={financialRecordService}
        item={deletingItem}
        nameKey="name"
        resource="despesa"
        onCancel={() => setDeletingItem(undefined)}
        onDelete={() => {
          toast.success("Despesa excluída!");
          setDeletingItem(undefined);
          refetch();
        }}
      />
    </div>
  );
}

type FinancialRecordRowProps = {
  item: FinancialRecordModel;
  onDelete: (item: FinancialRecordModel) => void;
};

function FinancialRecordRow({ item, onDelete }: FinancialRecordRowProps) {
  const dueDate = new Date(item.due_date);
  const installments = item.serie?.repeat_count ?? 0;

  return (
    <TableRow>
      <TableCell className="w-full max-w-0 pl-4 sm:pl-6">
        <p className="truncate text-lg">
          {item.name}
          {installments > 1 ? (
            <span className="ml-2 text-muted-foreground">
              {item.installment}/{installments}
            </span>
          ) : null}
        </p>
        {item.tags?.length ? (
          <div className="mt-1 flex flex-wrap gap-1">
            {item.tags.map((tag) => (
              <TagBadge key={tag.id} name={tag.name} color={tag.color} icon={tag.icon} />
            ))}
          </div>
        ) : null}
      </TableCell>

      <TableCell className="text-sm text-muted-foreground">{format(dueDate, "dd · EEE", { locale: ptBR })}</TableCell>

      <TableCell className="text-right text-lg tabular-nums">{currencyFormatter.format(Number(item.amount))}</TableCell>

      <TableCell>
        <FinancialRecordStatusBadge item={item} />
      </TableCell>

      <TableCell className="w-0 pr-2 pl-0">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button variant="ghost" size="icon" className="text-muted-foreground" aria-label="Ações">
                <TbDotsVertical className="size-5" />
              </Button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              render={
                <Link
                  to="/despesas/$financialRecordId/alterar"
                  params={{ financialRecordId: String(item.id) }}
                  className="cursor-pointer gap-2"
                >
                  <TbEdit className="size-4" />
                  <span>Alterar</span>
                </Link>
              }
            />
            <DropdownMenuItem className="cursor-pointer gap-2 text-destructive" onClick={() => onDelete(item)}>
              <TbTrash className="size-4" />
              <span>Excluir</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}

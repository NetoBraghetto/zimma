import { queryOptions, useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { TbEdit, TbPlus, TbTrash } from "react-icons/tb";
import { toast } from "sonner";
import { AppPagination } from "@/components/app-pagination";
import type { TableColumn } from "@/components/app-table";
import { AppTable } from "@/components/app-table";
import { DeletionModal } from "@/components/deletion-modal";
import { PaginationCount } from "@/components/pagination-count";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "@/components/ui/search";
import { QS_SEARCH_INDEX, QS_SORT_INDEX } from "@/constants/querystring";
import { useListParams } from "@/hooks/use-list-params";
import { DateTimeFormatter } from "@/lib/datetime-formatter";
import { type FinancialRecordModel, financialRecordService } from "@/services/financial-record-service";

const financialRecordQueryOptions = (search: Record<string, string> | string) => {
  return queryOptions({
    queryKey: ["financial-record", search],
    queryFn: () => {
      return financialRecordService.get(new URLSearchParams(search as Record<string, string>));
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
  const { data, refetch, isFetching } = useQuery(financialRecordQueryOptions(search));
  const { onSearch, onSort } = useListParams(search, navigate);
  const [deletingItem, setDeletingItem] = useState<FinancialRecordModel>();

  const columns: TableColumn<FinancialRecordModel>[] = [
    { field: "name", label: "Nome", sortable: true },
    {
      field: "created_at",
      label: "Criado em",
      sortable: true,
      render(item) {
        return DateTimeFormatter(item.created_at);
      },
    },
    {
      field: "updated_at",
      label: "Atualizado em",
      sortable: true,
      render(item) {
        return DateTimeFormatter(item.updated_at);
      },
    },
    {
      field: "edit",
      label: "",
      className: "w-0",
      render: (p) => {
        return (
          <Button variant="outline" size="icon" asChild>
            <Link to={`/despesas/${p.id}/alterar`}>
              <TbEdit className="size-4" />
            </Link>
          </Button>
        );
      },
    },
    {
      field: "delete",
      label: "",
      className: "w-0",
      render: (p) => {
        return (
          <Button variant="outline" size="icon" onClick={setDeletingItem.bind(null, p)}>
            <TbTrash className="size-4" />
          </Button>
        );
      },
    },
  ];

  return (
    <div className="relative">
      <div className="flex items-center mb-4">
        <div>
          <Search onSearch={onSearch} q={search[QS_SEARCH_INDEX]} />
        </div>
        <div className="ml-auto">
          <Button size="sm" className="h-8 gap-1" asChild>
            <Link to="/despesas/novo">
              <TbPlus className="size-5" />
              <span className="whitespace-nowrap">Adicionar despesa</span>
            </Link>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Despesas</CardTitle>
        </CardHeader>
        <CardContent>
          <AppTable columns={columns} collection={data?.data} onSort={onSort} sorts={search[QS_SORT_INDEX]} isFetching={isFetching} />
        </CardContent>
        <CardFooter>
          {data ? (
            <>
              <PaginationCount resource="despesas" pagination={data.meta} />
              <div className="ml-auto">
                <AppPagination total={data.meta.total} />
              </div>
            </>
          ) : null}
        </CardFooter>
      </Card>

      <DeletionModal
        service={financialRecordService}
        item={deletingItem}
        nameKey="name"
        resource="despesa"
        onCancel={() => setDeletingItem(undefined)}
        onDelete={() => {
          toast.success("Despesa excluído!");
          setDeletingItem(undefined);
          refetch();
        }}
      />
    </div>
  );
}

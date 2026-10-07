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
import { TagBadge } from "@/components/resources/tag/tag-badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search } from "@/components/ui/search";
import { QS_PAGE_INDEX, QS_PER_PAGE_INDEX, QS_SEARCH_INDEX, QS_SORT_INDEX } from "@/constants/querystring";
import { useListParams } from "@/hooks/use-list-params";
import { DateTimeFormatter } from "@/lib/datetime-formatter";
import { cn } from "@/lib/utils";
import { type TagModel, tagService } from "@/services/tag-service";

const tagQueryOptions = (search: Record<string, string>) => {
  return queryOptions({
    queryKey: ["tag", search],
    queryFn: () => {
      return tagService.get(
        new URLSearchParams({
          page: search[QS_PAGE_INDEX] || "1",
          pageSize: search[QS_PER_PAGE_INDEX] || "15",
          [QS_SEARCH_INDEX]: search[QS_SEARCH_INDEX] || "",
          [QS_SORT_INDEX]: search[QS_SORT_INDEX] || "",
        }),
      );
    },
  });
};

export const Route = createFileRoute("/_protected/tags/")({
  head: () => ({
    meta: [{ title: "Tags" }],
  }),
  component: RouteComponent,
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const search = Route.useSearch() as Record<string, string>;
  const { data, refetch, isFetching } = useQuery(tagQueryOptions(search));
  const { onSearch, onSort } = useListParams(search, navigate);
  const [deletingItem, setDeletingItem] = useState<TagModel>();

  const columns: TableColumn<TagModel>[] = [
    {
      field: "name",
      label: "Nome",
      sortable: true,
      render(item) {
        return <TagBadge name={item.name} color={item.color} icon={item.icon} />;
      },
    },
    {
      field: "created_at",
      label: "Criado em",
      sortable: true,
      render(item) {
        return DateTimeFormatter(item.created_at);
      },
    },
    {
      field: "edit",
      label: "",
      className: "w-0",
      render: (p) => {
        return (
          <Link to="/tags/$tagId/alterar" params={{ tagId: String(p.id) }} className={buttonVariants({ variant: "outline", size: "icon" })}>
            <TbEdit className="size-4" />
          </Link>
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
      <div className="mb-4 flex items-center">
        <div>
          <Search onSearch={onSearch} q={search[QS_SEARCH_INDEX]} />
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tags</CardTitle>
        </CardHeader>
        <CardContent>
          <AppTable columns={columns} collection={data?.data} onSort={onSort} sorts={search[QS_SORT_INDEX]} isFetching={isFetching} />
        </CardContent>
        <CardFooter>
          {data ? (
            <>
              <PaginationCount resource="tags" pagination={data.meta.pagination} />
              <div className="ml-auto">
                <AppPagination total={data.meta.pagination.total} />
              </div>
            </>
          ) : null}
        </CardFooter>
      </Card>

      <DeletionModal
        service={tagService}
        item={deletingItem}
        nameKey="name"
        resource="tag"
        onCancel={() => setDeletingItem(undefined)}
        onDelete={() => {
          toast.success("Tag excluída!");
          setDeletingItem(undefined);
          refetch();
        }}
      />

      <Link to="/tags/nova" className={cn(buttonVariants({ size: "icon" }), "fixed right-6 bottom-6 z-50 size-12 rounded-full shadow-lg")}>
        <TbPlus className="size-6" />
        <span className="sr-only">Adicionar tag</span>
      </Link>
    </div>
  );
}

import type { PaginationMetaReponse } from "@/services/restful-service";

export type PaginationCountProps = {
  pagination: PaginationMetaReponse;
  resource?: string;
};

export function PaginationCount({ pagination, resource = "registros" }: PaginationCountProps) {
  const from = (pagination.page - 1) * pagination.perPage + 1;
  let to = from + (pagination.perPage - 1);
  to = pagination.total < to ? pagination.total : to;
  return (
    <div className="text-xs text-muted-foreground">
      Mostrando{" "}
      <strong>
        {from}-{to}
      </strong>{" "}
      de <strong>{pagination.total}</strong> {resource}
    </div>
  );
}

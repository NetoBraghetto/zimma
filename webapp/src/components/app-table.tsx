import type { ReactNode } from "react";
import { TbArrowDown, TbArrowUp } from "react-icons/tb";
import NoDataSvg from "@/assets/images/undraw_no_data.svg?url";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ContainerLoading } from "./container-loading";

export type TableColumn<M> = {
  field: string;
  label: ReactNode;
  sortable?: boolean;
  className?: string;
  render?: (item: M) => ReactNode;
};

type AppTableProps<M> = {
  collection?: M[];
  columns: TableColumn<M>[];
  isFetching?: boolean;
  onSort?: (field: string) => void;
  getRowKey?: (item: M) => string | number;
  sorts?: string;
};

type THeadProps<M> = {
  columns: TableColumn<M>[];
  onSort?: (field: string) => void;
  sorts?: string;
};

function THead<M>({ columns, sorts, onSort }: THeadProps<M>) {
  const $sort: string[] = sorts?.split(",") || [];
  return (
    <TableHeader>
      <TableRow>
        {columns.map((column, i: number) => {
          let className = "flex gap-2";
          let icon = null;
          let onClick: React.MouseEventHandler<HTMLTableCellElement> | undefined;
          const key = `${column.field}-${i}`;
          if (column.sortable) {
            onClick = onSort?.bind(null, column.field);
            className += " cursor-pointer";
            switch (true) {
              case $sort.indexOf(column.field) > -1:
                icon = <TbArrowUp fontSize="inherit" />;
                break;
              case $sort.indexOf(`-${column.field}`) > -1:
                icon = <TbArrowDown fontSize="inherit" />;
                break;
            }
          }
          return (
            <TableHead className={column.className} onClick={onClick} key={key}>
              <span className={className}>
                {column.label} {icon}
              </span>
            </TableHead>
          );
        })}
      </TableRow>
    </TableHeader>
  );
}

function EmptyTable() {
  return (
    <div className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-1 text-center">
        <h3 className="text-2xl font-bold tracking-tight mb-5">Nenhum registro encontrado.</h3>
        <img className="opacity-20" width="70%" src={NoDataSvg} alt="" />
      </div>
    </div>
  );
}

export function AppTable<M extends Record<string, any> = { id: number }>({
  columns,
  collection,
  isFetching,
  sorts,
  onSort,
  getRowKey = (item: M) => item.id,
}: AppTableProps<M>): ReactNode {
  const cll = collection || [];
  if (cll.length === 0 && !isFetching) {
    return <EmptyTable />;
  }

  return (
    <div className="relative lg:min-h-[770px]">
      {isFetching ? <ContainerLoading /> : null}
      <Table>
        <THead sorts={sorts} onSort={onSort} columns={columns} />
        <TableBody>
          {cll.map((item: M) => {
            const key = getRowKey(item);
            return (
              <TableRow key={key}>
                {columns.map((column: TableColumn<M>) => {
                  const cellKey = `${item.id}-${column.field}`;
                  return <TableCell key={cellKey}>{column.render ? column.render(item) : item[column.field]}</TableCell>;
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

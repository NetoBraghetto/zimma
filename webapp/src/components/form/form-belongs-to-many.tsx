import { type ChangeEvent, type ReactNode, useCallback, useEffect, useState } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import { TbCheck, TbLoader2 } from "react-icons/tb";
import { ControlledPagination } from "@/components/controlled-pagination";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { QS_PAGE_INDEX, QS_SEARCH_INDEX } from "@/constants/querystring";
import type { CanList, PaginationMetaReponse } from "@/services/restful-service";

interface FormBelongsToManyProps<F extends FieldValues, O> {
  label: string;
  modalTitle: string;
  name: Path<F>;
  control: Control<F>;
  help?: string;
  error?: FieldError;
  getOptionLabel?: (option: O) => ReactNode;
  renderValues?: (collection: O[]) => ReactNode;
}
interface FormBelongsToManyServiceProps<F extends FieldValues, O> extends FormBelongsToManyProps<F, O> {
  service: CanList<O>;
}

let timeoutId: number | undefined;

function FormBelongsToMany<
  F extends FieldValues,
  O extends { id: number | string; name: string } = {
    id: number;
    name: string;
  },
>({
  label,
  modalTitle,
  name,
  control,
  help,
  error,
  service,
  renderValues,
  getOptionLabel = (option: O) => option.name as string,
}: FormBelongsToManyServiceProps<F, O>): ReactNode {
  const [options, setOptions] = useState<O[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [qValue, setQValue] = useState<string>("");
  const [inputValue, setInputValue] = useState<string>("");
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [selecteds, setSelecteds] = useState<O[]>([]);
  const [cancelCache, setCancelCache] = useState<O[]>([]);
  const [pagination, setPagination] = useState<PaginationMetaReponse>({
    page: 1,
    total: 0,
    perPage: 15,
  });
  const { field } = useController({
    name,
    control,
  });
  const err = error?.message;

  const onServiceRequest = useCallback(
    async (value: string, page: number) => {
      try {
        const { data, meta } = await service.get(
          new URLSearchParams({
            [QS_SEARCH_INDEX]: value,
            [QS_PAGE_INDEX]: page.toString(),
          }),
        );
        setOptions(data);
        setPagination(meta);
      } catch (searchError: unknown) {
        console.log(searchError);
      }
      setIsFetching(false);
    },
    [service],
  );

  useEffect(() => {
    if (!isModalOpen) {
      return;
    }

    onServiceRequest(qValue, 1);
  }, [isModalOpen, onServiceRequest, qValue]);

  function onCancel() {
    setIsModalOpen(false);
    field.onChange(cancelCache);
  }

  function onOpen() {
    setCancelCache(field.value);
    setSelecteds(field.value);
    setIsModalOpen(true);
  }

  function onSelect(option: O) {
    const index = selecteds.findIndex((o) => o.id === option.id);
    const newSelecteds = selecteds.slice();
    if (index === -1) {
      newSelecteds.push(option);
    } else {
      newSelecteds.splice(index, 1);
    }
    setSelecteds(newSelecteds);
  }

  function onSave() {
    setIsModalOpen(false);
    field.onChange(selecteds);
  }

  // function onRemove(index: number) {
  //   const newCollection = field.value.slice();
  //   newCollection.splice(index, 1);
  //   field.onChange(newCollection);
  // }

  function onPaginate(page: number) {
    onServiceRequest(qValue, page);
  }

  return (
    <div className="grid gap-2">
      <div>
        <Dialog open={isModalOpen} onOpenChange={(open) => (open ? onOpen() : onCancel())}>
          <Button onClick={onOpen} type="button" variant="outline" size="sm">
            {label}
          </Button>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{modalTitle}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div>
                <Input
                  name={QS_SEARCH_INDEX}
                  type="search"
                  placeholder="Buscar"
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    window.clearTimeout(timeoutId);
                    timeoutId = window.setTimeout(() => {
                      setQValue(e.target.value);
                    }, 350);
                    setIsFetching(true);
                    setInputValue(e.target.value);
                  }}
                  value={inputValue}
                />
              </div>
              <div>
                <div className="relative max-h-[300px] overflow-auto custom-scrollbar">
                  {isFetching ? (
                    <span className="absolute grid pt-10 justify-center inset-0 z-10 bg-white/50">
                      <TbLoader2 className="animate-spin left-2.5 top-2.5 size-6 text-muted-foreground" />
                    </span>
                  ) : null}
                  <Table className="border">
                    <TableBody>
                      {options.map((option, i: number) => {
                        const isRowSelected = selecteds.find((o) => o.id === option.id) !== undefined;
                        const icon = isRowSelected ? <TbCheck className="size-3 text-blue-600" /> : null;
                        return (
                          <TableRow
                            key={`${option.id}-${i}`}
                            data-selected={isRowSelected}
                            onClick={() => {
                              onSelect(option);
                            }}
                            className="odd:bg-white even:bg-slate-100 hover:bg-slate-300 cursor-pointer data-[selected=true]:bg-blue-100"
                          >
                            <TableCell>
                              <span className="flex items-center gap-2">
                                {getOptionLabel(option)} {icon}
                              </span>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </div>
            <DialogFooter>
              <div className="flex grow justify-between gap-2">
                <div>
                  <ControlledPagination
                    onPaginate={onPaginate}
                    currentPage={pagination.page}
                    perPage={pagination.perPage}
                    total={pagination.total}
                  />
                </div>
                <div className="flex gap-2">
                  <Button type="button" onClick={onCancel} variant="outline">
                    Cancelar
                  </Button>
                  <Button type="button" onClick={onSave}>
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      {help ? <p className="text-[0.8rem] text-muted-foreground">{help}</p> : null}
      {err ? <p className="text-[0.8rem] font-medium text-destructive">{err}.</p> : null}
      {typeof renderValues === "function" ? (
        renderValues(field.value)
      ) : (
        <div className="flex flex-wrap gap-2">
          {field.value.map((item: O) => {
            return (
              <Badge key={item.id} variant="indigo">
                {item.name}{" "}
                {/* <Button onClick={onRemove.bind(null, index)} asChild variant="ghost" size="icon-xs">
                  <TbX />
                </Button> */}
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}
export { FormBelongsToMany };

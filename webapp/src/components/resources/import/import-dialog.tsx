import { useQueryClient } from "@tanstack/react-query";
import { AxiosError } from "axios";
import { type ChangeEvent, type ReactNode, useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { TbFileImport } from "react-icons/tb";
import { toast } from "sonner";
import { Form } from "@/components/form/form";
import { FormCheckbox } from "@/components/form/form-checkbox";
import { FormDate } from "@/components/form/form-date";
import { FormMasked } from "@/components/form/form-masked";
import { FormSelect } from "@/components/form/form-select";
import { FormTags } from "@/components/form/form-tags";
import { FormText } from "@/components/form/form-text";
import { Submit } from "@/components/form/submit";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CleaveBRLOptions } from "@/constants/cleave-masks";
import { FinancialRecordTypeList, type FinancialRecordTypeValue } from "@/constants/financial-record";
import { BRLToDecimal, DecimalToBRL } from "@/lib/currency-formatter";
import { financialRecordService } from "@/services/financial-record-service";
import { type ImportPreview, ImportSource, importService } from "@/services/import-service";
import type { TagModel } from "@/services/tag-service";

function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof AxiosError && typeof error.response?.data?.error === "string") {
    return error.response.data.error;
  }
  return fallback;
}

// Opens the file picker, sends the file to be identified and shows its preview.
export function ImportButton(): ReactNode {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [preview, setPreview] = useState<ImportPreview | null>(null);

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Allows choosing the same file again.
    e.target.value = "";
    if (!file) {
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await importService.preview(file);
      if (!data.records.length) {
        toast.warning("Nenhum lançamento encontrado no arquivo.");
        return;
      }
      setPreview(data);
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível ler o arquivo."));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <input ref={inputRef} type="file" accept=".ofx,.xlsx" className="hidden" onChange={onFileChange} />
      <Button variant="outline" disabled={isLoading} onClick={() => inputRef.current?.click()} aria-label="Importar dados">
        {isLoading ? <Spinner /> : <TbFileImport />}
        <span className="hidden sm:inline">Importar</span>
      </Button>
      {preview ? <ImportPreviewDialog preview={preview} onClose={() => setPreview(null)} /> : null}
    </>
  );
}

type ImportRow = {
  selected: boolean;
  already_imported: boolean;
  vendor_name: string;
  name: string;
  amount: string;
  type: FinancialRecordTypeValue | string;
  due_date: Date | "";
  confirmed: boolean;
  tags: number[];
  vendor: string;
  vendor_source: string;
  vendor_id: string;
};

type FormValues = { records: ImportRow[] };

type ImportPreviewDialogProps = {
  preview: ImportPreview;
  onClose: () => void;
};

function ImportPreviewDialog({ preview, onClose }: ImportPreviewDialogProps): ReactNode {
  const queryClient = useQueryClient();
  const [tags, setTags] = useState<TagModel[]>([]);
  // Bank statement entries already happened; credit card ones are paid with the invoice.
  const confirmedByDefault = preview.source === ImportSource.ITAU_BANK_EXTRACT;
  const {
    control,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      records: preview.records.map((record) => ({
        selected: !record.already_imported,
        already_imported: record.already_imported,
        vendor_name: record.vendor_name,
        name: record.name,
        amount: DecimalToBRL(record.amount),
        type: record.type,
        due_date: new Date(record.due_date),
        confirmed: confirmedByDefault,
        tags: record.suggested_tags.map((tag) => tag.id),
        vendor: record.vendor,
        vendor_source: record.vendor_source,
        vendor_id: record.vendor_id,
      })),
    },
  });
  const { fields } = useFieldArray({ control, name: "records" });
  const records = useWatch({ control, name: "records" });
  const selectedCount = records.filter((record) => record.selected).length;
  const allSelected = selectedCount === records.length;

  useEffect(() => {
    async function request() {
      try {
        const { data } = await financialRecordService.formDependencies();
        setTags(data.tags);
      } catch (_error) {}
    }
    request();
  }, []);

  function toggleAll(checked: boolean) {
    records.forEach((_record, i) => {
      setValue(`records.${i}.selected`, checked);
    });
  }

  function validate(values: FormValues): boolean {
    let isValid = true;
    values.records.forEach((record, i) => {
      if (!record.selected) {
        return;
      }
      const name = record.name.trim();
      if (name.length < 3 || name.length > 255) {
        setError(`records.${i}.name`, { type: "manual", message: "Entre 3 e 255 caracteres" });
        isValid = false;
      }
      if (!record.amount) {
        setError(`records.${i}.amount`, { type: "manual", message: "Informe o valor" });
        isValid = false;
      }
      if (!record.due_date) {
        setError(`records.${i}.due_date`, { type: "manual", message: "Informe a data" });
        isValid = false;
      }
    });
    return isValid;
  }

  async function onSubmit(values: FormValues) {
    if (isSubmitting || !validate(values)) {
      return;
    }

    const payload = values.records
      .filter((record) => record.selected)
      .map((record) => ({
        name: record.name.trim(),
        amount: BRLToDecimal(record.amount),
        type: Number(record.type) as FinancialRecordTypeValue,
        due_date: new Date(record.due_date).toISOString(),
        confirmed: record.confirmed,
        tags: record.tags.map(Number),
        vendor: record.vendor,
        vendor_source: record.vendor_source,
        vendor_id: record.vendor_id,
        vendor_name: record.vendor_name,
      }));

    try {
      const { data } = await importService.store(payload);
      const skipped = data.skipped ? ` (${data.skipped} já importado${data.skipped > 1 ? "s" : ""})` : "";
      toast.success(`${data.imported} registro${data.imported === 1 ? "" : "s"} importado${data.imported === 1 ? "" : "s"}${skipped}.`);
      queryClient.invalidateQueries({ queryKey: ["financial-record"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      onClose();
    } catch (error) {
      toast.error(apiErrorMessage(error, "Não foi possível importar os registros."));
    }
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open && !isSubmitting) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-7xl">
        <Form onSubmit={handleSubmit(onSubmit)} className="grid gap-6">
          <DialogHeader>
            <DialogTitle>{preview.source_label}</DialogTitle>
            <DialogDescription>
              Revise os lançamentos encontrados, ajuste o que for preciso e escolha quais serão importados. {selectedCount} de{" "}
              {records.length} selecionado{records.length === 1 ? "" : "s"}.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-[65vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 z-10 bg-popover">
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={allSelected}
                      indeterminate={selectedCount > 0 && !allSelected}
                      onCheckedChange={(checked) => toggleAll(Boolean(checked))}
                      aria-label="Selecionar todos"
                    />
                  </TableHead>
                  <TableHead className="min-w-64">Descrição</TableHead>
                  <TableHead className="min-w-36">Valor</TableHead>
                  <TableHead className="min-w-32">Tipo</TableHead>
                  <TableHead>Vencimento</TableHead>
                  <TableHead>Confirmado</TableHead>
                  <TableHead className="min-w-56">Tags</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fields.map((field, i) => {
                  const rowErrors = errors.records?.[i];
                  const isSelected = records[i]?.selected;
                  return (
                    <TableRow key={field.id} className={isSelected ? undefined : "opacity-50"}>
                      <TableCell className="align-top pt-4">
                        <FormCheckbox label="" name={`records.${i}.selected`} control={control} aria-label="Importar este lançamento" />
                      </TableCell>
                      <TableCell className="align-top">
                        <FormText name={`records.${i}.name`} control={control} error={rowErrors?.name} aria-label="Descrição" />
                        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          {field.vendor_name !== records[i]?.name ? <span>{field.vendor_name}</span> : null}
                          {field.already_imported ? <Badge variant="secondary">Já importado</Badge> : null}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <FormMasked
                          name={`records.${i}.amount`}
                          control={control}
                          error={rowErrors?.amount}
                          options={CleaveBRLOptions}
                          placeholder="0,00"
                          aria-label="Valor"
                        />
                      </TableCell>
                      <TableCell className="align-top">
                        <FormSelect name={`records.${i}.type`} control={control} options={FinancialRecordTypeList} aria-label="Tipo" />
                      </TableCell>
                      <TableCell className="align-top">
                        <FormDate name={`records.${i}.due_date`} control={control} error={rowErrors?.due_date} />
                      </TableCell>
                      <TableCell className="align-top pt-4">
                        <FormCheckbox label="" name={`records.${i}.confirmed`} control={control} aria-label="Confirmado" />
                      </TableCell>
                      <TableCell className="align-top">
                        <FormTags name={`records.${i}.tags`} control={control} options={tags} aria-label="Tags" />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancelar
            </Button>
            <Submit onClick={() => clearErrors()} isLoading={isSubmitting} disabled={selectedCount === 0}>
              Importar {selectedCount} registro{selectedCount === 1 ? "" : "s"}
            </Submit>
          </DialogFooter>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

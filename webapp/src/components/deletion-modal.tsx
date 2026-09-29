import { type ReactNode, useState } from "react";
import { TbTrash } from "react-icons/tb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { CanDelete } from "@/services/restful-service";
import { ContainerLoading } from "./container-loading";

type DeletionModalProps<M> = {
  service: CanDelete<M>;
  item?: M;
  nameKey: any;
  resource: string;
  onCancel?: () => void;
  onDelete?: (item: M) => void;
};

export function DeletionModal<M>({ item, nameKey, resource, service, onCancel, onDelete }: DeletionModalProps<M>): ReactNode {
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  if (!item) {
    return null;
  }

  const performDelete = async () => {
    if (isDeleting) {
      return;
    }

    try {
      await service.delete(item.id);
      setIsDeleting(true);
      if (onDelete) {
        onDelete(item);
      }
    } catch (_error) {}
    setIsDeleting(false);
  };

  return (
    <AlertDialog open>
      <AlertDialogContent>
        {isDeleting ? <ContainerLoading size="xs" /> : null}
        <AlertDialogHeader>
          <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
            <TbTrash />
          </AlertDialogMedia>
          <AlertDialogTitle>Excluir {resource}</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita. deseja realmente excluir <strong>{item[nameKey]}</strong>?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel aria-disabled={isDeleting} onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction aria-disabled={isDeleting} onClick={performDelete} variant={"destructive"}>
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

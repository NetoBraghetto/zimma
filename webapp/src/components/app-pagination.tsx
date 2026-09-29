import { useId } from "react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { QS_PAGE_INDEX, QS_PER_PAGE_INDEX } from "@/constants/querystring";

export type PaginationProps = {
  total: number;
  showingPages?: number;
};

export function AppPagination({ total, showingPages = 5 }: PaginationProps) {
  const id = useId();
  const urlsp = new URLSearchParams(window.location.search);
  const currentPage = parseInt(urlsp.get(QS_PAGE_INDEX) || "1", 10);
  const offset = parseInt(urlsp.get(QS_PER_PAGE_INDEX) || "15", 10);

  if (total <= offset) {
    return null;
  }

  const lastPage = Math.ceil(total / offset);
  const hasPreviousReticents = currentPage > showingPages;
  const hasNextReticents = lastPage > currentPage + showingPages;
  const lastShowingPages = hasNextReticents ? currentPage + showingPages : lastPage;
  const firstPageDisabled = currentPage === 1;
  const lastPageDisabled = currentPage === lastPage;

  let i = hasPreviousReticents ? currentPage - showingPages : 0;
  const pages = [];

  for (i; i < lastShowingPages; i += 1) {
    pages.push(i + 1);
  }

  function getLink(page: number): string {
    if (page < 1) {
      urlsp.set(QS_PAGE_INDEX, "1");
    } else if (page > lastPage) {
      urlsp.set(QS_PAGE_INDEX, lastPage.toString());
    } else {
      urlsp.set(QS_PAGE_INDEX, page.toString());
    }
    return decodeURIComponent(`${window.location.pathname}?${urlsp.toString()}`);
  }

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious aria-disabled={firstPageDisabled} to={getLink(currentPage - 1)} />
        </PaginationItem>

        {hasPreviousReticents ? <PaginationEllipsis /> : null}

        {pages.map((page, index) => {
          const isActive = page === currentPage;
          return (
            <PaginationItem key={`${index}-${id}`}>
              <PaginationLink to={getLink(page)} aria-disabled={isActive} isActive={isActive}>
                {page}
              </PaginationLink>
            </PaginationItem>
          );
        })}

        {hasNextReticents ? <PaginationEllipsis /> : null}

        <PaginationItem>
          <PaginationNext aria-disabled={lastPageDisabled} to={getLink(currentPage + 1)} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

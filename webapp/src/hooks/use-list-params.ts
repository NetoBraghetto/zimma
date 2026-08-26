import { QS_PAGE_INDEX, QS_SEARCH_INDEX, QS_SORT_INDEX } from "@/constants/querystring";

export type ParamSort = "-";

type useListParamsReturn = {
  onSearch: (q: string) => void;
  onSort: (field: string) => void;
  // onFilter: (filters: Record<string, string>) => void;
};

export function useListParams(search: Record<string, string>, navigate: (p: any) => void): useListParamsReturn {
  // function onFilter(filters: Record<string, string>) {
  //   const nUrlsp = new URLSearchParams(urlsp.toString());
  //   Object.entries(filters).forEach(([key, value]) => {
  //     if (value) {
  //       nUrlsp.set(key, value);
  //     } else {
  //       nUrlsp.delete(key);
  //     }
  //   });
  //   go(nUrlsp);
  // }

  function onSearch(q: string) {
    navigate({
      search: {
        ...search,
        [QS_PAGE_INDEX]: 1,
        [QS_SEARCH_INDEX]: q,
      },
    });
  }

  function onSort(field: string) {
    let found: boolean = false;
    const nSort: string[] = [];
    const $sort: string[] = search[QS_SORT_INDEX]?.split(",") || [];

    for (let i = 0; i < $sort.length; i += 1) {
      const param = $sort[i].charAt(0) === "-" ? $sort[i].slice(1) : $sort[i];
      if (param === field) {
        found = true;
        switch (true) {
          case $sort.indexOf(field) > -1:
            nSort.push(`-${field}`);
            continue;
          case $sort.indexOf(`-${field}`) > -1:
            continue;
        }
      }
      nSort.push($sort[i]);
    }

    if (!found) {
      nSort.push(field);
    }

    navigate({
      search: {
        ...search,
        [QS_PAGE_INDEX]: 1,
        [QS_SORT_INDEX]: nSort.join(","),
      },
    });
  }

  return {
    onSearch,
    onSort,
    // onFilter,
  };
}

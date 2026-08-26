import type { AxiosResponse } from "axios";

export type SucessServerResponse<D = unknown, M = Record<string, never>> = {
  data: D;
  meta: M;
  response: AxiosResponse<D>;
};

export function FormatSuccessResponse<D, M>(response: AxiosResponse): SucessServerResponse<D, M> {
  if (response.status === 204) {
    return { data: null as D, meta: {} as M, response };
  }
  const { data, meta } = response.data;
  return { data, meta, response };
}

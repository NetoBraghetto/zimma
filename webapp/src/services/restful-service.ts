import { FormatSuccessResponse, type SucessServerResponse } from "@/lib/format-success-response";
import { api } from "@/services/http-client";

// biome-ignore lint/complexity/noBannedTypes: future-proofing for more complex ID types
export type NewResource = {};

interface Resource extends NewResource {
  id: number;
}

export type PaginationMetaReponse = {
  page: number;
  total: number;
  perPage: number;
};

export interface CanList<M> {
  get: <T = M>(search?: URLSearchParams) => Promise<SucessServerResponse<T[], PaginationMetaReponse>>;
}

export interface CanView<M> {
  show: (id: number, search?: URLSearchParams) => Promise<SucessServerResponse<M>>;
}

export interface CanStore<M> {
  store: (data: Record<string, unknown>) => Promise<SucessServerResponse<M>>;
}

export interface CanUpdate<M> {
  update: (id: number, data: Record<string, unknown>) => Promise<SucessServerResponse<M>>;
}

export interface CanDelete<M> {
  delete: (id: number) => Promise<SucessServerResponse<M>>;
}

export interface CanRestore<M> {
  restore: (id: number) => Promise<SucessServerResponse<M>>;
}

interface Restful<ListM, ViewM, StoreM, UpdateM, RestoreM, DeleteM>
  extends CanList<ListM>,
    CanView<ViewM>,
    CanStore<StoreM>,
    CanUpdate<UpdateM>,
    CanRestore<RestoreM>,
    CanDelete<DeleteM> {}

export abstract class RestfulService<
  ViewM = Resource,
  FD = Record<string, unknown[]>,
  ListM extends ViewM = ViewM,
  StoreM extends ViewM = ViewM,
  UpdateM extends ViewM = ViewM,
  RestoreM extends ViewM = ViewM,
  DeleteM extends ViewM = ViewM,
> implements Restful<ListM, ViewM, StoreM, UpdateM, RestoreM, DeleteM>
{
  protected path = "";

  get<T = ListM>(params?: URLSearchParams): Promise<SucessServerResponse<T[], PaginationMetaReponse>> {
    const querystring = params ? `?${decodeURIComponent(params.toString())}` : "";
    return new Promise((resolve, reject) => {
      api
        .get(`${this.path}${querystring}`)
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  show<T = ViewM>(id: number | string, search?: URLSearchParams): Promise<SucessServerResponse<T>> {
    const controller = new AbortController();
    return new Promise((resolve, reject) => {
      api
        .get(`${this.path}/${id}`, {
          params: search,
          signal: controller.signal,
        })
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  store<T = StoreM>(sendData: Record<string, unknown> | FormData): Promise<SucessServerResponse<T>> {
    const controller = new AbortController();
    const headers: Record<string, string> = {};
    let data: Record<string, unknown> | FormData | string = sendData;
    if (sendData instanceof FormData) {
      headers["Content-type"] = "multipart/form-data";
    } else {
      data = JSON.stringify(sendData);
      headers["Content-type"] = "application/json";
    }

    return new Promise((resolve, reject) => {
      api
        .post(this.path, data, {
          headers,
          signal: controller.signal,
        })
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  update<T = UpdateM>(id: number, sendData: Record<string, unknown> | FormData): Promise<SucessServerResponse<T>> {
    const controller = new AbortController();
    const headers: Record<string, string> = {};
    let data: Record<string, unknown> | FormData | string = sendData;
    if (sendData instanceof FormData) {
      sendData.append("_method", "PUT");
      headers["Content-type"] = "multipart/form-data";
    } else {
      data = JSON.stringify({ ...sendData, _method: "PUT" });
      headers["Content-type"] = "application/json";
    }
    return new Promise((resolve, reject) => {
      api
        .post(`${this.path}/${id}`, data, {
          headers,
          signal: controller.signal,
        })
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  delete<T = DeleteM>(id: number): Promise<SucessServerResponse<T>> {
    const controller = new AbortController();
    return new Promise((resolve, reject) => {
      api
        .delete(`${this.path}/${id}`, {
          signal: controller.signal,
        })
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  restore<T = RestoreM>(id: number): Promise<SucessServerResponse<T>> {
    const controller = new AbortController();
    return new Promise((resolve, reject) => {
      api
        .put(`${this.path}/${id}/restore`, {
          signal: controller.signal,
        })
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  formDependencies<T = FD>(params?: URLSearchParams): Promise<SucessServerResponse<T>> {
    const controller = new AbortController();
    return new Promise((resolve, reject) => {
      api
        .get(`${this.path}/form-dependencies`, {
          params,
          signal: controller.signal,
        })
        .then((response) => {
          resolve(FormatSuccessResponse(response));
        })
        .catch((error) => {
          reject(error);
        });
    });
  }

  save<I = number | string | undefined, T = I extends number | string ? UpdateM : StoreM>(
    data: Record<string, unknown> | FormData,
    id?: I,
  ): Promise<SucessServerResponse<T>> {
    return id ? this.update<T>(id as number, data) : this.store<T>(data);
  }
}

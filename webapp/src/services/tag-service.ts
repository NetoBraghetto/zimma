import type { SqlDateTimeFormat } from "@/lib/ts-helpers";
import { type NewResource, RestfulService } from "@/services/restful-service";

export interface NewTagModel extends NewResource {
  name: string;
  color: string;
  icon: string;
}

export interface TagModel extends NewTagModel {
  readonly id: number;
  readonly created_at: SqlDateTimeFormat;
  readonly updated_at: SqlDateTimeFormat;
}

class TagService extends RestfulService<TagModel> {
  protected path = "tag";
}

export const tagService = new TagService();

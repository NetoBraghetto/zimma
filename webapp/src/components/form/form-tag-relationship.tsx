import { useState } from "react";
import type { Control, FieldValues, Path } from "react-hook-form";
import { TagType } from "@/constants/tag-type";
import type { TagWithOptionsModel } from "@/services/tag-service";
import { FormSelect } from "./form-select";

type FormTagRelationshipProps<F extends FieldValues> = {
  tags: Array<TagWithOptionsModel & { project_tag_is_required: boolean }>;
  control: Control<F>;
  name?: string;
};

function FormTagRelationshipSingleChoice<F extends FieldValues>({
  tag,
  control,
  name,
}: {
  tag: TagWithOptionsModel & { project_tag_is_required: boolean };
  control: Control<F>;
  name: string;
}) {
  const isRequired = !!tag.project_tag_is_required;
  return (
    <FormSelect
      label={tag.name}
      required={isRequired}
      name={`${name}.${tag.id}` as Path<F>}
      control={control}
      // options={[]}
      options={tag.options}
      // error={errors.name}
    />
  );
}

export function FormTagRelationship<F extends FieldValues>({ tags, control, name = "tag_answers" }: FormTagRelationshipProps<F>) {
  const [InputMap] = useState({
    [TagType.SINGLE_CHOICE]: FormTagRelationshipSingleChoice,
    [TagType.MULTIPLE_CHOICE]: null,
    [TagType.TEXT]: null,
  });

  return (
    <div className="grid w-full items-start gap-4 lg:grid-cols-3">
      {tags.map((cf) => {
        const Comp = InputMap[cf.tag_type_id];

        if (!Comp) {
          return null;
        }
        return (
          <div key={cf.id}>
            <Comp tag={cf} control={control} name={name} />
          </div>
        );
      })}
    </div>
  );
}

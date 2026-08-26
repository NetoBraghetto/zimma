import QuillResize from "quill-resize-module";
import { type ReactNode, useEffect, useRef } from "react";
import { type Control, type FieldError, type FieldValues, type Path, useController } from "react-hook-form";
import ReactQuill, { Quill } from "react-quill-new";
import { Field, FieldDescription, FieldError as FieldErrorMessage, FieldLabel } from "@/components/ui/field";
import "@wiris/mathtype-generic";
import "react-quill-new/dist/quill.snow.css";
import "quill-resize-module/dist/resize.css";

class QuillResizeWithoutWiris extends QuillResize {
  judgeShow(blot: unknown, activeEle?: HTMLElement) {
    const element = activeEle ?? ((blot as { domNode?: HTMLElement } | undefined)?.domNode as HTMLElement | undefined);
    if (element && (element.classList.contains("Wirisformula") || element.hasAttribute("data-mathml"))) {
      return false;
    }

    return super.judgeShow(blot, activeEle);
  }
}

Quill.register("modules/resize", QuillResizeWithoutWiris);

declare global {
  interface Window {
    wrs_int_init?: (target: HTMLElement, toolbar: HTMLElement, mathTypeParameters?: Record<string, unknown>) => void;
  }
}

export interface FormRichTextProps<F extends FieldValues> extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  name: Path<F>;
  control: Control<F>;
  help?: string;
  error?: FieldError;
}

const modules = {
  resize: {},
  toolbar: [
    ["bold", "italic", "underline", "strike", { script: "sub" }, { script: "super" }, "link", "code"],
    [{ color: [] }, { background: [] }],
    ["blockquote", "code-block", { align: [] }, { direction: "rtl" }],
    ["formula", "image", "video", "clean"],
    [{ list: "ordered", title: "lista ordenada" }, { list: "bullet" }],
  ],
};

const tooltips = {
  bold: "Negrito",
  italic: "Itálico",
  underline: "Sublinhado",
  strike: "Riscado",
  "script: sub": "Subscrito",
  "script: super": "Sobrescrito",
  link: "Link",
  code: "Código",
  color: "Cor",
  background: "Fundo",
  blockquote: "Citação",
  "code-block": "Bloco de código",
  align: "Alinhamento",
  "direction: rtl": "Direção: da direita para a esquerda",
  formula: "Fórmula Latex",
  image: "Imagem",
  video: "Vídeo",
  clean: "Limpar formatação",
  "list: ordered": "Lista ordenada",
  "list: bullet": "Lista com marcadores",
};

function getOrCreateWirisGroup(toolbarContainer: HTMLElement): HTMLSpanElement {
  const existingGroup = toolbarContainer.querySelector<HTMLSpanElement>('span.ql-formats[data-wiris-group="true"]');
  if (existingGroup) {
    return existingGroup;
  }

  const group = document.createElement("span");
  group.className = "ql-formats";
  group.dataset.wirisGroup = "true";
  toolbarContainer.appendChild(group);
  return group;
}

function normalizeWirisToolbarButton(
  toolbarContainer: HTMLElement,
  imageId: "editorIcon" | "chemistryIcon",
  buttonClass: string,
  title: string,
  ariaLabel: string,
) {
  const imageIcon = toolbarContainer.querySelector<HTMLImageElement>(`img#${imageId}`);
  if (!imageIcon) {
    return;
  }

  const existingButton = imageIcon.closest("button");
  if (existingButton) {
    existingButton.type = "button";
    existingButton.classList.add(buttonClass, "css-tooltip");
    existingButton.setAttribute("aria-label", ariaLabel);
    existingButton.setAttribute("aria-pressed", "false");
    existingButton.setAttribute("title", title);
    return;
  }

  const wirisGroup = getOrCreateWirisGroup(toolbarContainer);
  const button = document.createElement("button");
  button.type = "button";
  button.className = `${buttonClass} css-tooltip`;
  button.setAttribute("aria-label", ariaLabel);
  button.setAttribute("aria-pressed", "false");
  button.setAttribute("title", title);

  imageIcon.setAttribute("aria-hidden", "true");
  imageIcon.setAttribute("draggable", "false");
  button.appendChild(imageIcon);

  button.addEventListener("click", (event) => {
    if (event.target !== imageIcon) {
      imageIcon.click();
    }
  });

  wirisGroup.appendChild(button);
}

export function FormRichText<F extends FieldValues>({ label, name, control, help, error, ...props }: FormRichTextProps<F>): ReactNode {
  const reactQuillRef = useRef<ReactQuill | null>(null);
  const { field } = useController({
    name,
    control,
  });

  useEffect(() => {
    if (!reactQuillRef.current) {
      return;
    }
    const editor = reactQuillRef.current.getEditor();
    const toolbarModule = editor.getModule("toolbar") as {
      controls: Array<[string, HTMLElement]>;
      container: HTMLElement;
    };

    const editorIconImg = toolbarModule.container.querySelector("#editorIcon");
    if (!editorIconImg && typeof window.wrs_int_init === "function") {
      window.wrs_int_init(editor.root, toolbarModule.container);
    }

    if (!toolbarModule.controls || toolbarModule.controls.length === 0) {
      return;
    }
    toolbarModule.controls.forEach((item) => {
      const [name, element] = item;
      const key = element.getAttribute("aria-label") || name;
      if (key in tooltips) {
        element.setAttribute("title", tooltips[key as keyof typeof tooltips]);
        element.classList.add("css-tooltip");
      }
    });

    normalizeWirisToolbarButton(toolbarModule.container, "editorIcon", "ql-mathtype", "MathType", "mathtype");
    normalizeWirisToolbarButton(toolbarModule.container, "chemistryIcon", "ql-chemtype", "ChemType", "chemtype");

    return () => {
      reactQuillRef.current = null;
    };
  }, []);

  const err = error?.message;
  const id = props.id || `input-text-${field.name}`;
  const isInvalid = !!err;
  return (
    <Field data-invalid={isInvalid}>
      {label ? <FieldLabel htmlFor={id}>{label}</FieldLabel> : null}
      <ReactQuill theme="snow" onChange={field.onChange} value={field.value} modules={modules} ref={reactQuillRef} />
      {help ? <FieldDescription>{help}</FieldDescription> : null}
      {isInvalid ? <FieldErrorMessage>{err}</FieldErrorMessage> : null}
    </Field>
  );
}

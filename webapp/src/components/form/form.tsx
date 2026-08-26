import type { ReactNode } from "react";

export interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {}

export function Form(props: FormProps): ReactNode {
  return <form {...props} />;
}

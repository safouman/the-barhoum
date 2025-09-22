import clsx from "classnames";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  multiline?: false;
  name: string;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  multiline: true;
  name: string;
}

type Props = InputProps | TextareaProps;

const baseFieldClass = "grid gap-2";
const baseControlClass =
  "w-full rounded-[8px] border border-border bg-surface px-4 py-3 text-base text-inherit transition focus:border-accent focus:outline-none focus:ring-0";

export function Input(props: Props) {
  const { label, name, className, multiline } = props;
  const id = props.id ?? name;

  if (multiline) {
    const { label: _label, name: _name, className: _className, multiline: _multiline, ...textareaProps } = props as TextareaProps;
    return (
      <div className={baseFieldClass}>
        <label className="text-sm text-subtle" htmlFor={id}>
          {label}
        </label>
        <textarea id={id} name={_name} className={clsx(baseControlClass, "min-h-[140px] resize-y", _className)} {...textareaProps} />
      </div>
    );
  }

  const { label: _label, name: _name, className: _className, multiline: _multiline, ...inputProps } = props as InputProps;

  return (
    <div className={baseFieldClass}>
      <label className="text-sm text-subtle" htmlFor={id}>
        {label}
      </label>
      <input id={id} name={_name} className={clsx(baseControlClass, _className)} {...inputProps} />
    </div>
  );
}

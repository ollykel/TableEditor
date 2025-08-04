import Label from "@/components/Label";
import Input from "@/components/Input";

export interface FormFieldWrapperProps {
  field: any;
  label: string;
  type?: string;
}

export const FormFieldWrapper = ({ field, label, type = "text" }: FormFieldWrapperProps) => {
  return (
    <div className="flex flex-row mb-2">
      <Label htmlFor={field.name} className="w-1/4 text-right">
        {label}
      </Label>
      <div className="w-3/4 justify-left">
        <Input
          id={field.name}
          name={field.name}
          type={type}
          value={field.state.value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          className="w-full"
        />
        {!field.state.meta.isValid && (
          <em role="alert">{field.state.meta.errors.join(", ")}</em>
        )}
      </div>
    </div>
  );
};

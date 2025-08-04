
const Label = (props: React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>) => {
  const { className: inheritedClassName, children } = props;

  let className = 'mr-2 font-semibold';

  if (inheritedClassName) {
    className += ' ' + inheritedClassName;
  }

  return (
    <label
      {...props}
      className={className}
    >
      {children}
    </label>
  );
};

export default Label;

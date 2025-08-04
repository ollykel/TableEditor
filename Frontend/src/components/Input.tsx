

const Input = (props: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>) => {
  const { className: inheritedClassName } = props;

  let className = 'border border-gray-600 border-b-2 border-r-2 border-l-1 border-t-1';

  if (inheritedClassName) {
    className += ' ' + inheritedClassName;
  }

  return (
    <input
      {...props}
      className={className}
    />
  );
};

export default Input;

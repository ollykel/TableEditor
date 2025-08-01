
const Button = (props: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>) => {
  const {
    className,
    children
  } = props;

  const buttonProps = ({
    ...props,
    className: `flex hover:cursor-pointer place-content-center font-semibold rounded-md px-4 py-1 ${className}`,
    children: undefined
  });

  return (
    <button {...buttonProps}>
      {children}
    </button>
  );
};

export default Button;

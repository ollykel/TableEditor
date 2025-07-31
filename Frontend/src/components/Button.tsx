import type { PropsWithChildren } from 'react';

export interface ButtonProps {
  onClick?: () => any;
  disabled?: boolean;
  className?: string;
}

const Button = (props: PropsWithChildren<ButtonProps>) => {
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

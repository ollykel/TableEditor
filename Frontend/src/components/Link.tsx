import { Link as ReactLink } from 'react-router';

import type { PropsWithChildren } from 'react';

export interface LinkProps {
  to: string;
  className?: string;
}

const Link = (props: PropsWithChildren<LinkProps>) => {
  const { to, className: inheritedClassName, children } = props;

  let className = 'underline text-blue-600 hover:text-cyan-400';

  if (inheritedClassName) {
    className += ' ' + inheritedClassName;
  }

  return (
    <span className={className}>
      <ReactLink to={to}>
        {children}
      </ReactLink>
    </span>
  );
};

export default Link;

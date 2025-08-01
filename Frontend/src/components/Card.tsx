// === Card ====================================================================
//
// Default card component for displaying text. By default, comes with rounded
// edges and a white background.
//
// =============================================================================

import type { PropsWithChildren } from 'react';

export interface Card {
  className?: string;
}

const Card = (props: PropsWithChildren<Card>): React.JSX.Element => {
  const { children, className } = props;

  let cardClassName = "border border-gray-600 border-b-2 border-r-2 border-l-1 border-t-1 rounded-md bg-white p-1 my-2";

  if (className) {
    cardClassName += ' ' + className;
  }

  return (
    <div className={cardClassName}>
      {children}
    </div>
  );
};

export default Card;

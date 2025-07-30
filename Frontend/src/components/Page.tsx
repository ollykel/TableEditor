import { useEffect } from 'react';

import type { PropsWithChildren } from 'react';

export interface PageProps {
  title: string;
}

const Page = (props: PropsWithChildren<PageProps>): React.JSX.Element => {
  const { title, children } = props;

  useEffect(() => {
    document.title = `${title} | TableEditor`;
  }, [title]);

  return (
    <main className="size-full">
      {children}
    </main>
  );
};

export default Page;

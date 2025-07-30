import type { PropsWithChildren } from 'react';

import Page from '@/components/Page';
import Navbar from '@/components/Navbar';

import type { PageProps } from '@/components/Page';

export interface AuthedPageProps extends PageProps {}

const AuthedPage = (props: PropsWithChildren<AuthedPageProps>): React.JSX.Element => {
  const { title, children } = props;

  return (
    <Page title={title}>
      <Navbar />
      <div className="size-full">
        {children}
      </div>
    </Page>
  );
};

export default AuthedPage;

import Page from '@/components/Page';

const NotFoundPage = (): React.JSX.Element => {
  return (
    <Page title="404 Not Found">
      <h1>404 - Not Found</h1>
      <p>Sorry, we could not find anything at {`${window.location}`}</p>
    </Page>
  );
};

export default NotFoundPage;

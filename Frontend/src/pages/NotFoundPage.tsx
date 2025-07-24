const NotFoundPage = (): React.JSX.Element => {
  return (
    <div>
      <h1>404 - Not Found</h1>
      <p>Sorry, we could not find anything at {`${window.location}`}</p>
    </div>
  );
};

export default NotFoundPage;

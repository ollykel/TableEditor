import { useParams } from 'react-router-dom';
import {
  useQuery
} from '@tanstack/react-query';

import { useAuthorizedFetch } from '@/context/AuthorizedFetchContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import AuthedPage from '@/components/AuthedPage';
import TableEditor from '@/components/TableEditor';
import NotFoundPage from '@/pages/NotFoundPage';

import type TableProps from '@/types/TableProps';

interface ErrorNotFound {
  type: "not_found";
}

const ErrorNotFound = (): ErrorNotFound => ({ type: "not_found" });

interface ErrorOther {
  type: "other";
  statusCode: number;
  statusText: string;
}

const ErrorOther = (statusCode: number, statusText: string): ErrorOther => ({
  type: "other", statusCode, statusText
});

type TableFetchError = ErrorNotFound | ErrorOther;

const TablePage = () => {
  const { tableId } = useParams();
  const { fetchAuthenticated } = useAuthorizedFetch();
  const { isPending, error, data: tableProps, isFetching } = useQuery<TableProps, TableFetchError>({
    retry: false,
    queryKey: ['tables', tableId],
    queryFn: async () => {
      const resp = await fetchAuthenticated(`/api/v1/tables/${tableId}`);

      if (resp.status === 404) {
        throw ErrorNotFound();
      } else if (! resp.ok) {
        throw ErrorOther(resp.status, resp.statusText);
      } else {
        return await resp.json();
      }
    }
  });

  if (error) {
    switch (error.type) {
      case "not_found":
        return (<NotFoundPage />);
      default:
        return (
          <div>
            <h1>Error: {error.statusText} ({error.statusCode})</h1>
          </div>
        );
    }// end switch (error.type)
  } else if (isPending || isFetching) {
      <div>
        <h1>Loading ...</h1>
      </div>
  } else {
    const { id: tableId, name } = tableProps;

    return (
      <AuthedPage title={name}>
        <h1 className="text-4xl font-serif font-bold text-center mb-4">
          Table: {name}
        </h1>
        <WebSocketProvider>
          <TableEditor tableId={tableId} />
        </WebSocketProvider>
      </AuthedPage>
    );
  }
};// end TablePage 

export default TablePage;

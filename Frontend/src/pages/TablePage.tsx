import { useParams } from 'react-router-dom';
import {
  useQuery
} from '@tanstack/react-query';

import { WebSocketProvider } from '@/context/WebSocketContext';
import TableEditor from '@/components/TableEditor';

import type TableProps from '@/types/TableProps';

const TablePage = () => {
  const { tableId } = useParams();
  const { isPending, error, data: tableProps, isFetching } = useQuery({
    queryKey: ['tables', tableId],
    queryFn: async () => {
      const resp = await fetch(`/api/v1/tables/${tableId}`);

      return await resp.json() as TableProps;
    }
  });

  if (error) {
    return (
      <div>
        <h1>Error: {`${error}`}</h1>
      </div>
    );
  } else if (isPending || isFetching) {
      <div>
        <h1>Loading ...</h1>
      </div>
  } else {
    const { id: tableId, name } = tableProps;

    return (
      <div>
        <h1>Table: {name}</h1>
        <WebSocketProvider>
          <TableEditor tableId={tableId} />
        </WebSocketProvider>
      </div>
    );
  }
};// end TablePage 

export default TablePage;

import type TableProps from '@/types/TableProps';

import { Link } from 'react-router';
import {
  useQuery,
  useQueryClient
} from '@tanstack/react-query';

import Modal from '@/components/Modal';

const Table = ({ id, name, width, height }: TableProps): React.JSX.Element => {
  return (
    <div id={`table-${id}`}>
      <Link to={`/tables/${id}`}>
        <h2>{name}</h2>
      </Link>
      <p>{height} X {width}</p>
    </div>
  );
};

const TableList = () => {
  const queryClient = useQueryClient();
  const { isPending, error, data: tables, isFetching } = useQuery({
    queryKey: ['tables'],
    queryFn: async () => {
      const response = await fetch('/api/v1/tables');

      return await response.json();
    }
  });

  if (error) {
    return (<p>Error: {`${error}`}</p>);
  } else if (isFetching) {
    return (<p>Fetching tables...</p>);
  } else if (isPending) {
    return (<p>Waiting...</p>);
  } else {
    if (tables.length < 1) {
      return <p>No tables to show</p>
    } else {
      return (
        <div>
          <ul id="table-list">
            {(tables as TableProps[]).map(table => (
              <li key={table.id}>
                <Table {...table} />
              </li>
            ))}
          </ul>
          <Modal title="New Table" buttonLabel="+ Add Table" buttonClassName="hover:cursor-pointer">
            <p>Create a new table.</p>
            <button className="hover:cursor-pointer" onClick={() => { queryClient.invalidateQueries({
              queryKey: ['tables']
            }); }}>
              Add Table
            </button>
          </Modal>
        </div>
      );
    }
  }
};

const HomePage = () => {
  return (
    <div>
      <h1>Tables</h1>
      <TableList />
    </div>
  );
};

export default HomePage;

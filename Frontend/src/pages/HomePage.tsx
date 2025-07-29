import { Link, useNavigate } from 'react-router';
import { useForm } from 'react-hook-form';
import {
  useQuery,
  useQueryClient
} from '@tanstack/react-query';

import { useAuthorizedFetch } from '@/context/AuthorizedFetchContext';
import AuthedPage from '@/components/AuthedPage';
import Modal from '@/components/Modal';
import ShareTableForm from '@/components/ShareTableForm';

import type TableProps from '@/types/TableProps';
import type { ShareTableFormData } from '@/components/ShareTableForm';

type AddTableFormData = {
  name: string;
  width: number;
  height: number;
};

interface AddTableFormProps {
  addTable: (formData: AddTableFormData) => void;
}

const AddTableForm = (props: AddTableFormProps) => {
  const { register, handleSubmit, formState: { errors } } = useForm<AddTableFormData>();
  const { addTable } = props;

  const onSubmit = (data: AddTableFormData) => {
    addTable(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register('name', { required: 'Name is required' })}
        placeholder="Name"
      />
      {errors.name && <span>{errors.name.message}</span>}
      <input
        {...register('width', { required: 'Width is required' })}
        placeholder="Width"
      />
      {errors.width && <span>{errors.width.message}</span>}
      <input
        {...register('height', { required: 'Height is required' })}
        placeholder="Height"
      />
      {errors.height && <span>{errors.height.message}</span>}
      <button type="submit">Add Table</button>
    </form>
  );
};

interface TableViewProps extends TableProps {
  isShareable: boolean;
}

const Table = ({ id, name, width, height, isShareable }: TableViewProps): React.JSX.Element => {
  const { fetchAuthenticated } = useAuthorizedFetch();

  const handleSubmit = (formData: ShareTableFormData) => {
    fetchAuthenticated(`/api/v1/tables/${id}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then((resp) => {
        if (! resp.ok) {
          alert('Failed to share table');
        } else {
          alert('Table shared successfully!');
        }
      });
  };
  return (
    <div id={`table-${id}`}>
      <Link to={`/app/tables/${id}`}>
        <h2>{name}</h2>
      </Link>
      <p>{height} X {width}</p>
      {
        isShareable && (
          <Modal title="Share Table" buttonLabel="Share" buttonClassName="hover:cursor-pointer">
            <h2>Share Table "{name}"</h2>
            <ShareTableForm tableId={id} onSubmit={handleSubmit} />
          </Modal>
        )
      }
    </div>
  );
};

interface TableListProps {
  queryStatus: any;
}

const TableList = (props: TableListProps): React.JSX.Element => {
  const { queryStatus } = props;
  const { isPending, error, data: tables, isFetching } = queryStatus;

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
            {(tables as TableViewProps[]).map(table => (
              <li key={table.id}>
                <Table {...table} />
              </li>
            ))}
          </ul>
        </div>
      );
    }
  }
};

const HomePage = () => {
  const queryClient = useQueryClient();
  const { fetchAuthenticated } = useAuthorizedFetch();

  const ownQueryStatus = useQuery({
    queryKey: ['own_tables'],
    queryFn: async () => {
      const response = await fetchAuthenticated('/api/v1/tables?owners=me');

      return ((await response.json()) as TableProps[])
        .map((table) => ({ ...table, isShareable: true }));
    }
  });
  const sharedWithQueryStatus = useQuery({
    queryKey: ['shared_tables'],
    queryFn: async () => {
      const response = await fetchAuthenticated('/api/v1/tables?shared_with=me');

      return ((await response.json()) as TableProps[])
        .map((table) => ({ ...table, isShareable: false }));
    }
  });

  const addTable = (tableData: AddTableFormData): void => {
    fetchAuthenticated('/api/v1/tables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tableData)
    }).then((_) => {
      queryClient.invalidateQueries({
        queryKey: ['own_tables']
      });
    });
  };

  return (
    <AuthedPage title="Dashboard">
      <h1>My Tables</h1>
      <TableList queryStatus={ownQueryStatus} />

      <h1>Shared With Me</h1>
      <TableList queryStatus={sharedWithQueryStatus} />

      <Modal title="New Table" buttonLabel="+ Add Table" buttonClassName="hover:cursor-pointer">
        <p>Create a new table.</p>
        <AddTableForm addTable={addTable} />
      </Modal>
    </AuthedPage>
  );
};

export default HomePage;

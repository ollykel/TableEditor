import type TableProps from '@/types/TableProps';

import { Link } from 'react-router';
import {
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { useForm } from 'react-hook-form';

import Modal from '@/components/Modal';

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

  const addTable = (tableData: AddTableForm): void => {
    fetch('/api/v1/tables', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(tableData)
    }).then((_) => {
      queryClient.invalidateQueries({
        queryKey: ['tables']
      });
    });
  };

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
            <AddTableForm addTable={addTable} />
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

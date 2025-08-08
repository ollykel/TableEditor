import { useForm } from 'react-hook-form';
import {
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import {
  X,
  Plus
} from 'lucide-react';

import { useAuthorizedFetch } from '@/context/AuthorizedFetchContext';
import AuthedPage from '@/components/AuthedPage';
import { useModal } from '@/components/Modal';
import ShareTableForm from '@/components/ShareTableForm';
import Card from '@/components/Card';
import Link from '@/components/Link';
import Button from '@/components/Button';
import UserTag from '@/components/UserTag';

import type TableProps from '@/types/TableProps';
import type { UserView } from '@/types/User';

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
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="flex flex-col place-content-center"
    >
      <label htmlFor="name">Name: </label>
      <input
        {...register('name', { required: 'Name is required' })}
        placeholder="Name"
      />
      {errors.name && <span>{errors.name.message}</span>}

      <label htmlFor="width">Width: </label>
      <input
        {...register('width', { required: 'Width is required' })}
        placeholder="Width"
      />
      {errors.width && <span>{errors.width.message}</span>}

      <label htmlFor="height">Height: </label>
      <input
        {...register('height', { required: 'Height is required' })}
        placeholder="Height"
      />
      {errors.height && <span>{errors.height.message}</span>}

      <Button
        type="submit"
        className="bg-blue-400 w-full mt-8"
      >
        Add Table
      </Button>
    </form>
  );
};

interface TableViewProps extends TableProps {
  isShareable: boolean;
}

const Table = (props: TableViewProps): React.JSX.Element => {
  const { id,
    name,
    width,
    height,
    isShareable,
    sharedUsers
  } = props;
  const queryClient = useQueryClient();
  const { fetchAuthenticated } = useAuthorizedFetch();
  const { Modal: ShareTableModal, openModal, closeModal } = useModal();

  const fetchUsersByUsernameOrEmail = async (query: string): Promise<UserView[]> => {
    const queryEncoded = encodeURIComponent(query);
    const resp = await fetchAuthenticated(`/api/v1/users?starts_with=${queryEncoded}`);

    if (! resp.ok) {
      // TODO: error handling logic here
      return [];
    } else {
      return await resp.json();
    }
  };

  const handleSubmit = (users: UserView[]) => {
    const payload = ({ userIds: users.map((u: UserView) => u.id) });

    fetchAuthenticated(`/api/v1/tables/${id}/share`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
      .then((resp) => {
        if (! resp.ok) {
          alert('Failed to share table');
        } else {
          alert('Table shared successfully!');
          queryClient.invalidateQueries({
            queryKey: ['shared_tables']
          });
          closeModal();
        }
      });
  };

  return (
    <Card className="flex flex-col items-center w-4/5">
      <Link to={`/app/tables/${id}`}>
        <h2 className="text-lg font-semibold">{name}</h2>
      </Link>
      <p>Dimensions: {height} X {width}</p>

      {/** Display shared users, or display that there are no shared users **/}
      {
        (!sharedUsers || (sharedUsers.length < 1)) ? (
            <div>
              <p>
                No shared users
              </p>
            </div>
          ) : (
            <div className="my-4 flex flex-row">
              <span>Shared users:</span>
              <ul className="flex flex-row flex-wrap">
                {
                  sharedUsers.map(user => UserTag({ user }))
                }
              </ul>
            </div>
          )
      }

      {/** Provide modal for adding/removing shared users **/}
      {
        isShareable && (
          <div>
            <button
              onClick={openModal}
              className="hover:cursor-pointer text-white bg-blue-600 px-4 py-1 rounded-md"
            >
              Share Table
            </button>
            <ShareTableModal width="50%" height="min-content">
              <div className="flex justify-end">
                <button
                  onClick={closeModal}
                  className="hover:cursor-pointer"
                >
                  <X />
                </button>
              </div>
              <h2 className="text-xl font-semibold text-center">Share Table "{name}"</h2>
              <ShareTableForm
                tableProps={props}
                fetchUsers={fetchUsersByUsernameOrEmail}
                submitUsers={handleSubmit}
                getUserId={(user: UserView) => user.id}
                getUserLabel={(user: UserView) => `${user.username} (${user.email})`}
              />
            </ShareTableModal>
          </div>
        )
      }
    </Card>
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

  const { Modal: NewTableModal, openModal, closeModal } = useModal();

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
      closeModal();
    });
  };

  return (
    <AuthedPage title="Dashboard">
      <div className="flex flex-row flex-grow justify-center w-full">
        <div id="own-tables" className="w-2/5">
          <div className="flex flex-row items-baseline">
            <h1 className="text-2xl font-semibold mr-2">My Tables</h1>

            <Button onClick={openModal} className="mt-2 bg-orange-400 text-sm">
              <Plus size={18} /> Create Table
            </Button>
          </div>

          <TableList queryStatus={ownQueryStatus} />

          <NewTableModal width="25%" height="50%">
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className="hover:cursor-pointer"
              >
                <X />
              </button>
            </div>
            <div className="p-4">
              <h2 className="text-center text-2xl font-semibold mb-4">Create a new table</h2>
              <AddTableForm addTable={addTable} />
            </div>
          </NewTableModal>
        </div>

        <div id="shared-tables" className="w-2/5">
          <h1 className="text-2xl font-semibold">Shared With Me</h1>
          <TableList queryStatus={sharedWithQueryStatus} />
        </div>
      </div>
    </AuthedPage>
  );
};

export default HomePage;

import { useParams } from 'react-router-dom';
import {
  useQuery,
  useQueryClient
} from '@tanstack/react-query';
import { X } from 'lucide-react';

import { useAuthorizedFetch } from '@/context/AuthorizedFetchContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import AuthedPage from '@/components/AuthedPage';
import TableEditor from '@/components/TableEditor';
import ShareTableForm from '@/components/ShareTableForm';
import { useModal } from '@/components/Modal';
import Button from '@/components/Button';
import NotFoundPage from '@/pages/NotFoundPage';

import type TableProps from '@/types/TableProps';
import type { UserView } from '@/types/User';

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
  const {
    fetchAuthenticated,
    fetchUsersByUsernameOrEmail,
    addSharedUsers
  } = useAuthorizedFetch();
  const queryClient = useQueryClient();
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
  const { Modal: ShareTableModal, openModal, closeModal } = useModal();

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
    const { name: tableName, sharedUsers } = tableProps;

    const handleAddSharedUsers = (users: UserView[]) => {
      addSharedUsers(tableProps, users)
        .then((resp) => {
          if (! resp.ok) {
            alert('Failed to add shared users');
          } else {
            alert('Shared users added successfully');
            queryClient.invalidateQueries({
              queryKey: ['tables', tableId]
            });
          }
        });
    };

    return (
      <AuthedPage title={tableName}>
        <div className="px-4">
          <h1 className="text-4xl font-serif font-bold text-center mb-4">
            Table: {tableName}
          </h1>

          {/** Modify shared users**/}
          <Button
            onClick={openModal}
            className="bg-blue-600 hover:bg-blue-400"
          >
            Share Table
          </Button>

          <ShareTableModal
            width='50%'
            height='50%'
          >
            <div className="flex justify-end">
              <button
                onClick={closeModal}
                className="hover:cursor-pointer"
              >
                <X />
              </button>
            </div>
            <h2 className="text-xl font-semibold text-center">Share Table "{tableName}"</h2>
            <ShareTableForm
              tableProps={tableProps}
              fetchUsers={fetchUsersByUsernameOrEmail}
              submitUsers={handleAddSharedUsers}
              getUserId={(u: UserView) => u.id}
              getUserLabel={(u: UserView) => `${u.username} (${u.email})`}
            />
          </ShareTableModal>

          {/** Display shared users**/}
          {
            sharedUsers && sharedUsers.length && (
              <div className="flex flex-row mb-4">
                <span>Shared with: </span>
                {
                  sharedUsers.map((user: UserView) => (
                    <div className="ml-2">
                      {user.username}
                    </div>
                  ))
                }
              </div>
            )
          }
          <WebSocketProvider>
            <TableEditor tableInfo={tableProps} />
          </WebSocketProvider>
        </div>
      </AuthedPage>
    );
  }
};// end TablePage 

export default TablePage;

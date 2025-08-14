import { useParams } from 'react-router-dom';
import {
  useQuery,
  useQueryClient
} from '@tanstack/react-query';

import { useAuthorizedFetch } from '@/context/AuthorizedFetchContext';
import { WebSocketProvider } from '@/context/WebSocketContext';
import AuthedPage from '@/components/AuthedPage';
import TableEditor from '@/components/TableEditor';
import ShareTableForm from '@/components/ShareTableForm';
import { useModal } from '@/components/Modal';
import Button from '@/components/Button';
import CloseModalButton from '@/components/CloseModalButton';
import UserTag from '@/components/UserTag';
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

type FetchError = ErrorNotFound | ErrorOther;

const TablePage = () => {
  const { tableId } = useParams();
  const {
    fetchAuthenticated,
    fetchUsersByUsernameOrEmail,
    addSharedUsers
  } = useAuthorizedFetch();
  const queryClient = useQueryClient();
  const {
    isPending: isTablePending,
    error: tableError,
    data: tableProps,
    isFetching: isTableFetching
  } = useQuery<TableProps, FetchError>({
    retry: false,
    queryKey: ['tables', tableId],
    queryFn: async () => {
      const resp = await fetchAuthenticated(`/api/v1/tables/${tableId}`);

      if (resp.status === 404) {
        throw ErrorNotFound();
      } else if (! resp.ok) {
        throw ErrorOther(resp.status, resp.statusText);
      } else {
        const table = await resp.json();

        return ({ ...table, timeCreated: new Date(table.timeCreated) });
      }
    }
  });
  const {
    isPending: isSharedUsersPending,
    error: sharedUsersError,
    data: sharedUsers,
    isFetching: isSharedUsersFetching
  } = useQuery<UserView[], FetchError>({
    retry: false,
    queryKey: ['tables', tableId, 'shared_users'],
    queryFn: async () => {
      const resp = await fetchAuthenticated(`/api/v1/tables/${tableId}/shared_users`);

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

  if (tableError) {
    switch (tableError.type) {
      case "not_found":
        return (<NotFoundPage />);
      default:
        return (
          <div>
            <h1>Error: {tableError.statusText} ({tableError.statusCode})</h1>
          </div>
        );
    }// end switch (tableError.type)
  } else if (isTablePending || isTableFetching) {
      <div>
        <h1>Loading ...</h1>
      </div>
  } else {
    const { name: tableName, timeCreated } = tableProps;

    const handleAddSharedUsers = (users: UserView[]) => {
      addSharedUsers(tableProps, users)
        .then((resp) => {
          if (! resp.ok) {
            alert('Failed to add shared users');
          } else {
            alert('Shared users added successfully');
            queryClient.invalidateQueries({
              queryKey: ['tables', tableId, 'shared_users']
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

          <p>Created {timeCreated.toLocaleString()}</p>

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
            <CloseModalButton closeModal={closeModal} />

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
            sharedUsersError && (
              <div className="text-lg font-bold bg-red-600">
                <p>
                  ERROR: {(() => {
                    switch (sharedUsersError.type) {
                      case 'not_found':
                        return 'user(s) not found';
                      default:
                        const { statusCode, statusText } = sharedUsersError;

                        return `Request failed with status ${statusCode}: ${statusText}`;
                    }
                  })()}
                </p>
              </div>
            )
          }
          {
            (isSharedUsersPending || isSharedUsersFetching) && (
              <span>Loading shared users...</span>
            )
          }
          {
            !sharedUsersError && sharedUsers && sharedUsers.length && (
              <div className="flex flex-row my-4 align-center">
                <span>Shared with: </span>
                {
                  sharedUsers.map((user: UserView) => (
                    <UserTag user={user} variant="full" />
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

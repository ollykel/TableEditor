import { useState, useRef, useEffect } from 'react';
import { useForm } from '@tanstack/react-form';

import { useAuth } from '@/context/AuthContext';

import type { UserView } from '@/types/User';

export interface ShareTableFormData {
  userIds: number[];
}

export interface ShareTableFormProps {
  tableId: number;
  onSubmit: (formData: ShareTableFormData) => void;
}

interface UserChoiceProps {
  id: number;
  username: string;
  email: string;
  onRemove: () => void;
}

const UserChoice = (props: UserChoiceProps) => {
  const { username, email, onRemove } = props;
  return (
    <div>
      <button onClick={onRemove} className="hover:curor-pointer">X</button>
      <span>{username} ({email})</span>
    </div>
  );
};

interface UserSearchProps {
  query: string;
  selectedUserId: number;
}

const ShareTableForm = (_props: ShareTableFormProps): React.JSX.Element => {
  const { getAuthToken } = useAuth();
  const [userChoices, setUserChoices] = useState<UserChoiceProps[]>([]);
  const [searchedUsers, setSearchedUsers] = useState<UserView[]>([]);

  const searchedUsersRef = useRef(searchedUsers);

  useEffect(() => {
    searchedUsersRef.current = searchedUsers;
  }, [searchedUsers]);

  const queryUsers = async (query: string): Promise<UserView[]> => {
    const resp = await fetch(`/api/v1/users?starts_with=${query}`, {
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`
      }
    });

    if (! resp.ok) {
      return [];
    } else {
      return (await resp.json() as UserView[]);
    }
  };

  const addUserChoice = (userView: UserView) => {
    const { id, username, email } = userView;
    const newUserChoice : UserChoiceProps = ({
      id, username, email,
      onRemove: () => {
        setUserChoices((choices) => choices.filter((choice) => choice.id !== id));
      }
    });

    setUserChoices((choices) => [...choices, newUserChoice]);
  };

  const searchForm = useForm({
    defaultValues: {
      query: "",
      selectedUserId: -1
    },
    onSubmit: async ({ value }: { value: UserSearchProps }) => {
      const { selectedUserId } = value;
      const selectedUser = searchedUsersRef.current.find((u) => u.id === selectedUserId);

      if (selectedUser) {
        addUserChoice(selectedUser);
      }
    }
  });

  return (
    <div>
      <form
        onSubmit={(ev) => {
          ev.preventDefault();
          ev.stopPropagation();
        }}
      >
        <searchForm.Field
          name="query"
          validators={{
            onChangeAsyncDebounceMs: 200,
            onChangeAsync: async ({ value: query }) => {
              const candidateUsers = await queryUsers(query);

              console.log('Candidate users:', candidateUsers);
              setSearchedUsers(() => candidateUsers);
              return undefined;
            }
          }}
          children={(field) => (
            <>
              <label htmlFor={field.name}>Search by username or email:</label>
              <input
                id={field.name}
                name={field.name}
                type="text"
                value={field.state.value}
                onBlur={field.handleBlur}
                onChange={(e) => field.handleChange(e.target.value)}
              />
            </>
          )}
        />
        <searchForm.Field
          name="selectedUserId"
          validators={{
            onChange: ({ value: selectedUserId }) => (
              selectedUserId < 0 ? 'Must select a user' : undefined
            )
          }}
          children={
            (field) => {
              const handleChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
                const userId = parseInt(ev.target.value);

                field.handleChange(userId);
                searchForm.handleSubmit();
              };
              return (
                <>
                  <label htmlFor={field.name}>Select User:</label>
                  <select
                    id={field.name}
                    name={field.name}
                    onChange={handleChange}
                    onBlur={field.handleBlur}
                    required
                  >
                    {searchedUsersRef.current.map((userView: UserView) => (
                      <option
                        value={userView.id}
                      >
                        {userView.username} ({userView.email})
                      </option>
                    ))}
                  </select>
                </>
              );
            }
          }
        />
      </form>

      <div>
        {userChoices.map((choiceProps) => <UserChoice key={choiceProps.email} {...choiceProps} />)}
      </div>
    </div>
  );
};

export default ShareTableForm;

import { useState, useRef, useEffect } from 'react';

import { X } from 'lucide-react';

import Button from '@/components/Button';

import type { UserView } from '@/types/User';

interface UserDropdownListProps {
  users: UserView[];
  getUserId: (user: UserView) => string | number;
  getUserLabel: (user: UserView) => string;
  onSelectUser: (user: UserView) => any;
}

const UserDropdownList = (props: UserDropdownListProps): React.JSX.Element | null => {
  const { users, getUserId, getUserLabel, onSelectUser } = props;
  const UserOption = ({ user }: { user: UserView }) => {
    return (
      <button
        onClick={() => onSelectUser(user)}
        className="border-b-1 border-gray-200 bg-white hover:bg-blue-200 hover:cursor-pointer"
      >
        {getUserLabel(user)}
      </button>
    );
  };

  if (! users) {
    return null;
  } else {
    return (
      <div className="relative w-full items-center">
        <div
          className="absolute z-100 flex flex-col"
        >
          {users.map((u) => <UserOption key={getUserId(u)} user={u} />)}
        </div>
      </div>
    );
  }
};// end UserDropdownList

interface SelectionPanelProps {
  options: UserView[];
  getUserId: (user: UserView) => string | number;
  getUserLabel: (user: UserView) => string;
  onRemoveOption: (option: UserView) => any;
}

const SelectionPanel = (props: SelectionPanelProps): React.JSX.Element => {
  const { options, getUserId, getUserLabel, onRemoveOption } = props;

  const SelectOption = ({ user }: { user: UserView }) => (
    <div className="flex flex-row h-min shrink m-1 p-1 bg-gray-400 text-black text-sm rounded-md">
      <button
        onClick={() => onRemoveOption(user)}
        className="hover:cursor-pointer"
      >
        <X size={18} />
      </button>
      <span>
        {getUserLabel(user)}
      </span>
    </div>
  );

  return (
    <div
      className="flex flex-row flex-wrap min-h-12 border-1 border-black w-full"
    >
      {options.map((u) => <SelectOption key={getUserId(u)} user={u} />)}
    </div>
  );
};

export interface ShareTableFormProps {
  fetchUsers: (query: string) => Promise<UserView[]>;
  submitUsers: (users: UserView[]) => void;
}

const ShareTableForm = (props: ShareTableFormProps) => {
  const { fetchUsers, submitUsers } = props;
  const [query, setQuery] = useState<string>('');
  const queryRef = useRef<string>(query);
  const [userOptions, setUserOptions] = useState<UserView[]>([]);
  const [persistentUsers, setPersistentUsers] = useState<UserView[]>([]);

  useEffect(() => {
    queryRef.current = query;
  }, [query]);

  const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    ev.preventDefault();
    setQuery(ev.target.value);
    fetchUsers(ev.target.value).then((users) => setUserOptions(users));
  };

  const handleSelectUser = (user: UserView) => {
    setQuery('');
    setPersistentUsers((existing) => [...existing, user]);
  };

  const handleSubmit = (): void => {
    submitUsers(persistentUsers);
    setPersistentUsers([]);
  };

  return (
    <div className="flex flex-col items-center m-4">
      <input
        name="query"
        type="text"
        placeholder="Search by username or email"
        value={query}
        onChange={handleChange}
        className="w-3/4 rounded-sm border-t-1 border-b-2 border-l-1 border-r-2 border-gray-600 mb-2 p-1"
      />
      {
        query &&
        <UserDropdownList
          users={userOptions}
          getUserId={(u: UserView) => u.id}
          getUserLabel={(u: UserView) => `${u.username} (${u.email})`}
          onSelectUser={handleSelectUser}
        />
      }

      <SelectionPanel
        options={persistentUsers}
        getUserId={(u: UserView) => u.id}
        getUserLabel={(u: UserView) => `${u.username} (${u.email})`}
        onRemoveOption={(target: UserView) => {
          setPersistentUsers((users) => users.filter((u) => u.id !== target.id));
        }}
      />

      <Button
        onClick={handleSubmit}
        className="bg-blue-400 w-full mt-4"
      >
        Share Table
      </Button>
    </div>
  );
};

export default ShareTableForm;

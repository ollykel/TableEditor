import { useState } from 'react';

export interface ShareTableFormData {
  userIds: number[];
}

export interface ShareTableFormProps {
  tableId: number;
  onSubmit: (formData: ShareTableFormData) => void;
}

interface UserChoiceProps {
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

const ShareTableForm = (_props: ShareTableFormProps): React.JSX.Element => {
  const [searchText, setSearchText] = useState<string>("");
  const [userChoices, setUserChoices] = useState<UserChoiceProps[]>([]);

  const handleChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    setSearchText(ev.target.value);
  };

  const handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
    ev.preventDefault();

    const username = searchText;
    const newUserChoice = ({
      username,
      email: `${username}@example.com`,
      onRemove: () => {
        setUserChoices((choices) => choices.filter((choice) => choice.username !== username));
      }
    });

    setUserChoices((choices) => [...choices, newUserChoice]);
    setSearchText(() => "");
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <label htmlFor="search">Search:</label>
        <input
          name="search"
          type="text"
          placeholder="Username or email"
          onChange={handleChange}
          value={searchText}
          required
        />
        <button type="submit" className="hover:cursor-pointer">Add</button>
      </form>
      <div>
        {userChoices.map((choiceProps) => <UserChoice key={choiceProps.email} {...choiceProps} />)}
      </div>
    </div>
  );
};

export default ShareTableForm;

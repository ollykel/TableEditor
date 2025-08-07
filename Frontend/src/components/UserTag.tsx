import type { UserView } from '@/types/User';

export interface UserTagProps {
  user: UserView;
}

const UserTag = (props: UserTagProps): React.JSX.Element => {
  const { user } = props;
  const { username, email } = user;

  return (
    <div className="px-2 py-1 rounded-2xl bg-yellow-600 text-white text-sans text-xs mx-1">
      {username} ({email})
    </div>
  );
};

export default UserTag;

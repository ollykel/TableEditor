import type { UserView } from '@/types/User';

export interface UserTagProps {
  variant: 'full' | 'brief';
  user: UserView;
}

const UserTag = (props: UserTagProps): React.JSX.Element => {
  const { user, variant } = props;
  const { username, email } = user;

  const content: string = (() => {
    switch (variant) {
      case 'brief':
        return username;
      case 'full':
      default:
        return `${username} (${email})`;
    }// end switch (variant)
  })();

  return (
    <div className="px-2 py-1 rounded-2xl bg-yellow-600 text-white text-sans text-xs mx-1">
      {content}
    </div>
  );
};

export default UserTag;

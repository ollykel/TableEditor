import Title from '@/components/Title';
import CreateAccountForm from '@/components/CreateAccountForm';

import type { CreateAccountFormProps } from '@/components/CreateAccountForm';

export interface CreateAccountPageProps extends CreateAccountFormProps {}

const CreateAccountPage = (props: CreateAccountPageProps): React.JSX.Element => {
  const { onSubmit } = props;

  return (
    <div>
      <Title />
      <h2>Create Account</h2>
      <CreateAccountForm
        onSubmit={onSubmit}
      />
    </div>
  );
};

export default CreateAccountPage;

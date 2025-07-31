import { useNavigate } from 'react-router';

import Page from '@/components/Page';
import Title from '@/components/Title';
import CreateAccountForm from '@/components/CreateAccountForm';

import type { CreateAccountFormData } from '@/components/CreateAccountForm';

const CreateAccountPage = (): React.JSX.Element => {
  const navigate = useNavigate();

  const handleSubmit = (accountData: CreateAccountFormData): void => {
    fetch('/api/v1/users', {
      method: 'POST',
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(accountData),
    })
      .then((res) => {
        if (! res.ok) {
          alert('Failed to create account');
        } else {
          alert('Account created successfully!');
          navigate('/app/login');
        }
      });
  };

  return (
    <Page title="Create Account">
      <Title />
      <h2>Create Account</h2>
      <CreateAccountForm
        onSubmit={handleSubmit}
      />
    </Page>
  );
};

export default CreateAccountPage;

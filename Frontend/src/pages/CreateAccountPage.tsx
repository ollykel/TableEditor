import { useNavigate } from 'react-router';

import config from '@/app.config';

import Page from '@/components/Page';
import Title from '@/components/Title';
import H2 from '@/components/H2';
import Link from '@/components/Link';
import Card from '@/components/Card';
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

      <div className="flex justify-center">
        <Card className="p-4 w-4/5">
          <H2>Create Account</H2>
          <CreateAccountForm
            onSubmit={handleSubmit}
          />
          <p className="text-center mt-2">
            Or <Link to={config.routes.login}>log in</Link>
          </p>
        </Card>
      </div>
    </Page>
  );
};

export default CreateAccountPage;

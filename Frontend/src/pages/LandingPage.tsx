import { useNavigate } from 'react-router-dom';

import config from '@/app.config';

import Page from '@/components/Page';
import Title from '@/components/Title';
import Card from '@/components/Card';
import Link from '@/components/Link';
import H2 from '@/components/H2';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/context/AuthContext';

import type { LoginFormData } from '@/components/LoginForm';

export interface LandingPageProps {}

const LandingPage = (): React.JSX.Element => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const handleSubmit = (loginData: LoginFormData) => {
    const { email, password } = loginData;
    login(email, password)
      .then((loginSuccess) => {
        if (! loginSuccess) {
          alert('Login failed; try again');
        } else {
          navigate(config.routes.home);
        }
      });
  };

  return (
    <Page title="Welcome!">
      <Title />

      <div className="flex flex-col text-center items-center">
        <p className="w-3/5">
          Want a spreadsheet editor with a focus on text editing and collaboration? Look no further! The Table Editor is here.
        </p>
        {/** Login card **/}
        <Card className="w-1/2">
          <H2>Login</H2>
          <LoginForm onSubmit={handleSubmit} />
          <p className="text-center mt-2">
            Or <Link to={config.routes.createAccount}>Create Account</Link>
          </p>
        </Card>
      </div>
    </Page>
  );
};

export default LandingPage;

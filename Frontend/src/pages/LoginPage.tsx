import { useLocation } from 'react-router';
import { useNavigate } from 'react-router-dom';

import config from '@/app.config';

import Page from '@/components/Page';
import Title from '@/components/Title';
import LoginForm from '@/components/LoginForm';
import Link from '@/components/Link';
import H2 from '@/components/H2';
import Card from '@/components/Card';
import { useAuth } from '@/context/AuthContext';

import type { LoginFormData } from '@/components/LoginForm';

export interface LoginPageProps {}

const LoginPage = (): React.JSX.Element => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const navigate = useNavigate();
  const { login } = useAuth();
  const redirectUrl = searchParams.has('redirect') ?
    decodeURIComponent(searchParams.get('redirect') || '')
    : config.routes.home;

  const handleSubmit = (loginData: LoginFormData) => {
    const { email, password } = loginData;
    login(email, password)
      .then((loginSuccess) => {
        if (! loginSuccess) {
          alert('Login failed; try again');
        } else {
          navigate(redirectUrl);
        }
      });
  };

  return (
    <Page title="Login">
      <Title />
      <div className="flex flex-col items-center">
        <Card className="w-1/2 p-4">
          <H2>Log in</H2>
          <LoginForm
            onSubmit={handleSubmit}
          />
          <p className="mt-4 text-center">
            Or <Link to={config.routes.createAccount}>create account</Link>
          </p>
        </Card>
      </div>
    </Page>
  );
};

export default LoginPage;

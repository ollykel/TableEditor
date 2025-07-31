import { useLocation } from 'react-router';
import { useNavigate } from 'react-router-dom';

import config from '@/app.config';

import Page from '@/components/Page';
import Title from '@/components/Title';
import LoginForm from '@/components/LoginForm';
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
      <h2>Login</h2>
      <LoginForm
        onSubmit={handleSubmit}
      />
    </Page>
  );
};

export default LoginPage;

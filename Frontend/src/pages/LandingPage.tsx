import { Link } from "react-router";
import { useNavigate } from 'react-router-dom';

import config from '@/app.config';

import Page from '@/components/Page';
import Title from '@/components/Title';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/context/AuthContext';

import type { LoginFormData } from '@/components/LoginForm';

export interface LandingPageProps {}

const LandingPage = (props: LandingPageProps): React.JSX.Element => {
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
      <LoginForm onSubmit={handleSubmit} />
      <Link to={config.routes.createAccount}>
        Create Account
      </Link>
    </Page>
  );
};

export default LandingPage;

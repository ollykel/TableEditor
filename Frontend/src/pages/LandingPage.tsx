import { Link } from "react-router";
import { useNavigate } from 'react-router-dom';

import Page from '@/components/Page';
import Title from '@/components/Title';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/context/AuthContext';

import type { LoginFormData } from '@/components/LoginForm';

export interface LandingPageProps {
  onLoginUrl: string;
  createAccountUrl: string;
}

const LandingPage = (props: LandingPageProps): React.JSX.Element => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { onLoginUrl, createAccountUrl } = props;
  const handleSubmit = (loginData: LoginFormData) => {
    const { email, password } = loginData;
    login(email, password)
      .then((loginSuccess) => {
        if (! loginSuccess) {
          alert('Login failed; try again');
        } else {
          navigate(onLoginUrl);
        }
      });
  };

  return (
    <Page title="Welcome!">
      <Title />
      <LoginForm onSubmit={handleSubmit} />
      <Link to={createAccountUrl}>
        Create Account
      </Link>
    </Page>
  );
};

export default LandingPage;

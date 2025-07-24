import { useNavigate } from 'react-router-dom';

import Title from '@/components/Title';
import LoginForm from '@/components/LoginForm';
import { useAuth } from '@/context/AuthContext';

import type { LoginFormData } from '@/components/LoginForm';

export interface LandingPageProps {
  onLoginUrl: string;
}

const LandingPage = (props: LandingPageProps): React.JSX.Element => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { onLoginUrl } = props;
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
    <div>
      <Title />
      <LoginForm onSubmit={handleSubmit} />
    </div>
  );
};

export default LandingPage;

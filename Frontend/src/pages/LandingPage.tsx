import Title from '@/components/Title';
import LoginForm from '@/components/LoginForm';

const LandingPage = (): React.JSX.Element => {
  return (
    <div>
      <Title />
      <LoginForm onSubmit={(values) => { console.log('Login:', values); }} />
    </div>
  );
};

export default LandingPage;

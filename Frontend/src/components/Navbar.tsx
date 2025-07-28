import { Link } from 'react-router';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '@/context/AuthContext';

const Navbar = (): React.JSX.Element => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <nav>
      <div>
        <Link to="/app/home">My Dashboard</Link>
      </div>
      <div>
        <button
          onClick={handleLogout}
          className="hover:cursor-pointer"
        >
          Log out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

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
    <nav className="flex flex-row justify-center w-full bg-gray-100">
      <div className="flex-10 text-center text-2xl font-semibold hover:underline">
        <Link to="/app/home">My Dashboard</Link>
      </div>
      <div className="flex-1">
        <button
          onClick={handleLogout}
          className="hover:cursor-pointer bg-red-200 p-2 rounded-md hover:bg-red-400"
        >
          Log out
        </button>
      </div>
    </nav>
  );
};

export default Navbar;

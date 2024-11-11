import { Link } from 'react-router-dom';
import { FiLogOut } from 'react-icons/fi';
import logo from '../assets/zapfy-logo-white.png';
import { useUser } from '@/contexts/UserContext';

const Sidebar = () => {
  const { signOut } = useUser();

  return (
    <aside className="bg-zinc-900 pt-8 pb-12 max-w-[100px] px-3 rounded-full m-2">
      <div className='flex h-full flex-col justify-between items-center'>
        <Link to="/">
          <img className='w-9' src={logo} alt="Zapfy Logo" />
        </Link>
        <button onClick={signOut}>
          <FiLogOut color='white' size={'20px'} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
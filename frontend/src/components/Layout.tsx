import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

const Layout = () => (
  <div className='flex h-screen'>
    <Sidebar />
    <main className="max-w-5xl mx-auto mt-14 bg-white">
      <Outlet />
    </main>
  </div>
);

export default Layout;
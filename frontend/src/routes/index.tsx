import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from '../components/Layout';
import Login from '../pages/Login';
import WorkspaceList from '../pages/WorkspaceList';
import WorkspaceEdit from '../pages/WorkspaceEdit';
import { useUser } from '@/contexts/UserContext';
import { WorkspaceDetails } from '@/pages/WorkspaceDestails';
// import NumberList from '../pages/NumberList';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { firebaseUser } = useUser();

  if (firebaseUser === null) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
      <Route index element={<WorkspaceList />} />
      <Route path="workspace/:id" element={<WorkspaceDetails />} />
      {/* <Route path="workspace/:id/numbers" element={<NumberList />} /> */}
    </Route>
  </Routes>
);

export default AppRoutes;
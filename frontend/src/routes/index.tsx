import App from '@/App';
import { Login } from '@/pages/Login';
import Register from '@/pages/Register';
import RegisterCheckOut from '@/pages/RegisterCheckOut';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PrivateRoute from './PrivateRoute';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <PrivateRoute path={'/'}>
            <App />
          </PrivateRoute>
        }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/registrar" element={<Register />} />
        <Route path="/registrar-checkout" element={<RegisterCheckOut />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
import App from '@/App';
import Register from '@/pages/Register';
import RegisterCheckOut from '@/pages/RegisterCheckOut';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/registrar" element={<Register />} />
        <Route path="/registrar-checkout" element={<RegisterCheckOut />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
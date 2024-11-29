import App from '@/App';
import Register from '@/pages/Register';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/registro" element={<Register />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
import { BrowserRouter as Router } from 'react-router-dom';
import AppRoutes from './routes';
import { UserProvider } from './contexts/UserContext';
import { WorkspaceProvider } from './contexts/WorkspaceContext';
import { NumberProvider } from './contexts/NumberContext';

const App = () => (
  <UserProvider>
    <WorkspaceProvider>
      <NumberProvider>
        <Router>
          <AppRoutes />
        </Router>
      </NumberProvider>
    </WorkspaceProvider>
  </UserProvider>
);

export default App;
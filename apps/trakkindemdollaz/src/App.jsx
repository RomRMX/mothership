import Dashboard from './components/Dashboard';
import PasswordGate from './components/PasswordGate';

function App() {
  return (
    <PasswordGate>
      <Dashboard />
    </PasswordGate>
  );
}

export default App;

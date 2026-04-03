import { Provider } from 'react-redux';
import DashboardPage from './DashboardPage';
import { store } from './redux/store';

function App() {
  return (
    <Provider store={store}>
      <DashboardPage />
    </Provider>
  );
}

export default App;

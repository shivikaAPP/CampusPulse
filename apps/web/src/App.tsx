import { BrowserRouter } from 'react-router-dom';
import { ProfileProvider } from './state/ProfileContext.js';
import { Header } from './components/Header.js';
import { Footer } from './components/Footer.js';
import { AppRoutes } from './routes.js';

export function App() {
  return (
    <BrowserRouter>
      <ProfileProvider>
        <Header />
        <main id="main-content" style={{ flex: 1 }}>
          <AppRoutes />
        </main>
        <Footer />
      </ProfileProvider>
    </BrowserRouter>
  );
}
export default App;

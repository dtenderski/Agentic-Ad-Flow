import { createRoot } from 'react-dom/client';
import { setAuthTokenGetter } from '@workspace/api-client-react';

import App from './App';
import './index.css';

// Attach bearer token to every API request so the server can
// verify the caller is an authorised AdClaw dashboard session.
const apiKey = import.meta.env.VITE_API_ACCESS_KEY as string | undefined;
if (apiKey) {
  setAuthTokenGetter(() => apiKey);
}

createRoot(document.getElementById('root')!).render(<App />);

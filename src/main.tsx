import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// index.html ships with the landing prerendered; hydrate it. Fall back to a
// fresh render when the root is empty (e.g. dev server).
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)

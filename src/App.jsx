import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import AppDetailPage from './pages/AppDetailPage'
import SuggestPage from './pages/SuggestPage'
import LogsPage from './pages/LogsPage'
import NotFoundPage from './pages/NotFoundPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="apps/*" element={<AppDetailPage />} />
        <Route path="suggest" element={<SuggestPage />} />
        <Route path="logs" element={<LogsPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default App

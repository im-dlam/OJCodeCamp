import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home'; 
import ProblemWorkspace from './features/workspace/components/ProblemWorkspace';
import AuthPage from './pages/AuthPage'; 
import './App.css';
import Leaderboard from './pages/Leaderboard';
import { QueryClient } from '@tanstack/react-query'
import { Toaster } from "react-hot-toast";
import CreateProblem from './pages/Admin/CreateProblem';
export const queryClient = new QueryClient();
function App() {
  return (
    <>
    <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/problems/:endpoint" element={<ProblemWorkspace />} />
        <Route path="/admin/create" element={<CreateProblem />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}




export default App;
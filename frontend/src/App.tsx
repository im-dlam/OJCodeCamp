import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home'; 
import ProblemWorkspace from './features/workspace/components/ProblemWorkspace';
import AuthPage from './pages/AuthPage'; 
import './App.css';
import Leaderboard from './pages/Leaderboard';
import { QueryClient } from '@tanstack/react-query'
import { Toaster } from "react-hot-toast";
import CreateProblem from './pages/Admin/CreateProblem';
import AdminProblems from './pages/Admin/ManageProblem';
import RequireAdmin from "./components/RequireAdmin";
import NotFound from './pages/NotFound';

export const queryClient = new QueryClient();
function App() {
  return (
    <>
    <Toaster position="top-right" containerStyle={{ zIndex: 99999 }} />
    <BrowserRouter>
      <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/" element={<Home />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/login" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/problems/:endpoint" element={<ProblemWorkspace />} />
        <Route element={<RequireAdmin/>}>
          <Route path="/admin/problems/create" element={<CreateProblem />} />
          <Route path="/admin" element={<AdminProblems />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </>
  );
}




export default App;
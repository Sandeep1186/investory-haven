import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import StocksList from "./pages/StocksList";
import MutualFundsList from "./pages/MutualFundsList";
import BondsList from "./pages/BondsList";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/stocks" element={<StocksList />} />
        <Route path="/mutual-funds" element={<MutualFundsList />} />
        <Route path="/bonds" element={<BondsList />} />
      </Routes>
      <Toaster />
    </Router>
  );
}

export default App;
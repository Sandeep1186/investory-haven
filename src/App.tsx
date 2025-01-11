import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import StocksList from "./pages/StocksList";
import MutualFundsList from "./pages/MutualFundsList";
import BondsList from "./pages/BondsList";
import AddFunds from "./pages/AddFunds";
import Watchlist from "./pages/Watchlist";
import { Toaster } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/stocks" element={<StocksList />} />
          <Route path="/mutual-funds" element={<MutualFundsList />} />
          <Route path="/bonds" element={<BondsList />} />
          <Route path="/add-funds" element={<AddFunds />} />
          <Route path="/watchlist" element={<Watchlist />} />
        </Routes>
        <Toaster />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
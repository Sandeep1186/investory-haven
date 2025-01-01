import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export default function Index() {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate("/dashboard");
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-white">
      <header className="relative">
        <div className="bg-white">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" aria-label="Top">
            <div className="w-full py-6 flex items-center justify-between">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-primary">InvestWise</span>
              </div>
              <div className="ml-10 space-x-4">
                <Link to="/signin">
                  <Button variant="outline">Sign in</Button>
                </Link>
              </div>
            </div>
          </nav>
        </div>
      </header>

      <main>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12 sm:py-20">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 px-4">
              Unlock the power of
              <span className="text-primary block mt-2">trading</span>
            </h1>
            <p className="mt-4 sm:mt-6 text-sm sm:text-base md:text-lg lg:text-xl text-gray-500 max-w-3xl mx-auto px-4">
              Unlock the power of trading with our user-friendly interface. Smart investments, personalized guidance, and powerful tools at your fingertips.
            </p>
            <div className="mt-6 sm:mt-8 flex flex-col sm:flex-row gap-4 justify-center px-4">
              <Link to="/signup" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto" size="lg">
                  Get started
                </Button>
              </Link>
              <Link to="/signin" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto" size="lg">
                  Sign in
                </Button>
              </Link>
            </div>
          </div>

          <div className="py-12 sm:py-20">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
              <div className="text-center p-6 rounded-lg bg-gray-50">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Stocks</h3>
                <p className="mt-2 text-sm sm:text-base text-gray-500">
                  Invest in a wide range of stocks from top companies
                </p>
              </div>
              <div className="text-center p-6 rounded-lg bg-gray-50">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Mutual Funds</h3>
                <p className="mt-2 text-sm sm:text-base text-gray-500">
                  Diversify your portfolio with expertly managed funds
                </p>
              </div>
              <div className="text-center p-6 rounded-lg bg-gray-50">
                <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Bonds</h3>
                <p className="mt-2 text-sm sm:text-base text-gray-500">
                  Secure your investments with government and corporate bonds
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
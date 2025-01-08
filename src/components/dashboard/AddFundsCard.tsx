import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

interface AddFundsCardProps {
  onAddFunds?: () => void;
}

export function AddFundsCard({ onAddFunds }: AddFundsCardProps) {
  const navigate = useNavigate();
  
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Button onClick={() => navigate("/add-funds")} className="w-full sm:w-auto">
          Add Funds
        </Button>
      </div>
    </Card>
  );
}
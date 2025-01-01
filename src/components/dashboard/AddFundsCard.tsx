import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

interface AddFundsCardProps {
  onAddFunds: () => void;
}

export function AddFundsCard({ onAddFunds }: AddFundsCardProps) {
  return (
    <Card className="p-6">
      <div className="flex flex-col sm:flex-row items-center gap-4">
        <Input
          type="number"
          placeholder="Enter amount"
          className="flex-1 w-full"
        />
        <Button onClick={onAddFunds} className="w-full sm:w-auto">
          Add Funds
        </Button>
      </div>
    </Card>
  );
}
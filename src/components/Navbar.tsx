
import { Button } from "@/components/ui/button";
import { FileText, Upload, Settings } from "lucide-react";

const Navbar = () => {
  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white border-b">
      <div className="flex items-center space-x-2">
        <FileText className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">BookKeeper Companion</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <Button variant="outline" size="sm" className="gap-2">
          <Upload className="h-4 w-4" />
          <span>Export</span>
        </Button>
        <Button variant="ghost" size="icon">
          <Settings className="h-5 w-5" />
        </Button>
      </div>
    </nav>
  );
};

export default Navbar;

import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth } from "@/integrations/firebase/client";
import { onAuthStateChanged } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Shield, Camera, Database, FileCheck } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  // Do not auto-redirect from the home page; let Auth redirect to home after login.
  // The buttons below will route logged-in users to the scanner automatically.

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-16">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-primary rounded-full mb-6">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-5xl font-bold mb-4">Customs Verification</h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Fast, accurate product verification for customs officers. Scan, verify, and log products instantly with AI-powered OCR technology.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate(auth.currentUser ? "/scanner" : "/auth")} className="min-h-[48px] px-8">
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate(auth.currentUser ? "/scanner" : "/auth")} className="min-h-[48px] px-8">
              Sign In
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Camera className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Camera Scanning</h3>
            <p className="text-muted-foreground text-sm">
              Capture product labels instantly using your smartphone camera with optimized viewfinder overlay.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <Database className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Real-time Verification</h3>
            <p className="text-muted-foreground text-sm">
              Instantly verify products against customs declarations database with HSN code matching.
            </p>
          </div>

          <div className="bg-card p-6 rounded-lg border shadow-sm">
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
              <FileCheck className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Automated Logging</h3>
            <p className="text-muted-foreground text-sm">
              All verifications are automatically logged with timestamps, location, and images for audit trails.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="mt-16 text-center">
          <div className="grid grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">10+</div>
              <div className="text-sm text-muted-foreground">Sample Products</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">3s</div>
              <div className="text-sm text-muted-foreground">Average Scan Time</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">99%</div>
              <div className="text-sm text-muted-foreground">Accuracy Rate</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
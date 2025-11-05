import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, storage } from "@/integrations/firebase/client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Image as ImageIcon, Keyboard, LogOut, History } from "lucide-react";
import { VerificationResult } from "@/components/VerificationResult";

interface VerificationData {
  status: 'PASS' | 'NO_PASS' | 'MANUAL_REVIEW';
  productDescription?: string;
  brand?: string;
  declaredValue?: number;
  countryOfOrigin?: string;
  extractedSerial?: string;
  extractedHsn?: string;
  hsnMatch?: boolean;
  modelMatch?: boolean;
  mismatchReason?: string;
  capturedImageUrl?: string;
}

const Scanner = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<VerificationData | null>(null);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        navigate("/auth");
      }
    });
    return () => unsub();
  }, [navigate]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast({
        title: "Camera Access Denied",
        description: "Please enable camera permissions to scan products.",
        variant: "destructive",
      });
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const captureImage = async () => {
    if (!videoRef.current) return;
    
    setIsProcessing(true);
    
    try {
      // Capture from video to canvas
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error("Failed to get canvas context");
      
      ctx.drawImage(videoRef.current, 0, 0);
      
      // Convert to blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, 'image/jpeg', 0.95);
      });
      
      // Upload to Firebase Storage
      const fileName = `scan_${Date.now()}.jpg`;
      const objectRef = ref(storage, `verification-images/${fileName}`);
      await uploadBytes(objectRef, blob);
      const publicUrl = await getDownloadURL(objectRef);
      
      // For MVP, simulate OCR with manual entry
      // In production, this would call Google Cloud Vision API
      toast({
        title: "Image Captured",
        description: "Please enter product details manually for verification.",
      });
      
      stopCamera();
      navigate("/manual-entry", { state: { imageUrl: publicUrl } });
      
    } catch (error: any) {
      toast({
        title: "Processing Failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/auth");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-primary text-primary-foreground p-4 flex justify-between items-center">
        <h2 className="font-semibold text-lg">Customs Scanner</h2>
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/history")}
            className="text-primary-foreground hover:bg-primary/90"
          >
            <History className="h-5 w-5" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogout}
            className="text-primary-foreground hover:bg-primary/90"
          >
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Camera Viewfinder */}
      <div className="flex-1 relative bg-black">
        {isCameraActive ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="w-full h-full object-cover"
            />
            
            {/* Viewfinder Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-8 top-1/4 bottom-1/4 border-2 border-white rounded-lg opacity-50" />
              <p className="absolute bottom-32 left-0 right-0 text-center text-white bg-black/50 py-2 text-sm">
                Align product label within frame
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <Button onClick={startCamera} size="lg">
              <Camera className="mr-2" /> Activate Camera
            </Button>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6 space-y-3">
        <Button 
          onClick={captureImage} 
          size="lg" 
          className="w-full min-h-[48px]"
          disabled={isProcessing || !isCameraActive}
        >
          {isProcessing ? (
            <><Loader2 className="animate-spin mr-2" /> Processing...</>
          ) : (
            <><Camera className="mr-2" /> Capture & Verify</>
          )}
        </Button>
        
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            onClick={() => navigate("/manual-entry")}
            className="min-h-[48px]"
          >
            <Keyboard className="mr-2" /> Manual Entry
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/history")}
            className="min-h-[48px]"
          >
            <History className="mr-2" /> History
          </Button>
        </div>
      </div>

      {showResults && result && (
        <VerificationResult 
          result={result}
          onClose={() => {
            setShowResults(false);
            setResult(null);
          }}
          onScanNext={() => {
            setShowResults(false);
            setResult(null);
            startCamera();
          }}
        />
      )}
    </div>
  );
};

export default Scanner;
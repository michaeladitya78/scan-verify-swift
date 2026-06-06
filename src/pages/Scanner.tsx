import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, storage } from "@/integrations/firebase/client";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Camera, Loader2, Image as ImageIcon, Keyboard, LogOut, History } from "lucide-react";
import { VerificationResult } from "@/components/VerificationResult";
import { performOcr, extractProductInfo } from "@/services/ocr";

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

  const [isFrontCamera, setIsFrontCamera] = useState(false);
  const [isFlashOn, setIsFlashOn] = useState(false);

  const startCamera = async () => {
    try {
      // Check if device has camera capabilities
      const devices = await navigator.mediaDevices.enumerateDevices();
      const hasCamera = devices.some(device => device.kind === 'videoinput');
      
      if (!hasCamera) {
        throw new Error('No camera detected on this device');
      }

      const constraints = {
        video: {
          facingMode: isFrontCamera ? "user" : "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          advanced: [{ torch: isFlashOn }]
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        // Stop any existing stream
        if (videoRef.current.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }
        
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsCameraActive(true);

        // Enable flash if requested and available
        const track = stream.getVideoTracks()[0];
        const capabilities = track.getCapabilities();
        if (capabilities.torch) {
          await track.applyConstraints({
            advanced: [{ torch: isFlashOn }]
          });
        }
      }
    } catch (error: any) {
      console.error('Camera error:', error);
      toast({
        title: "Camera Access Error",
        description: error.message || "Please enable camera permissions to scan products.",
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
      // Convert to base64 for OCR
      const base64Image = canvas.toDataURL('image/jpeg', 0.95).split(',')[1];
      // Perform OCR
      const { text, confidence } = await performOcr(base64Image);
      if (!text || confidence < 0.7) {
        throw new Error('Failed to detect clear text in image');
      }
      // Extract product information
      const { serialNumber, hsnCode } = extractProductInfo(text);
      if (!serialNumber || !hsnCode) {
        throw new Error('Could not find serial number or HSN code in image');
      }
      // Upload original image to Firebase Storage
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create blob"));
        }, 'image/jpeg', 0.95);
      });
      const fileName = `scan_${Date.now()}.jpg`;
      const objectRef = ref(storage, `verification-images/${fileName}`);
      await uploadBytes(objectRef, blob);
      const publicUrl = await getDownloadURL(objectRef);

      // Online verification using Gemini API (Google Search)
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY || "AIzaSyCeXmJIw-oMOVccq33_1Nj3tjdkSOuN7jk";
      const geminiSearchUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`;
      const prompt = `Verify if product with serial number ${serialNumber} and HSN code ${hsnCode} is authentic. Respond with PASS if genuine, FAIL if not.`;
      const geminiRes = await fetch(geminiSearchUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      let geminiResult = "FAIL";
      if (geminiRes.ok) {
        const geminiData = await geminiRes.json();
        const outputText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (/PASS/i.test(outputText)) geminiResult = "PASS";
      }

      setResult({
        status: geminiResult === "PASS" ? "PASS" : "NO_PASS",
        extractedSerial: serialNumber,
        extractedHsn: hsnCode,
        capturedImageUrl: publicUrl,
        mismatchReason: geminiResult === "PASS" ? undefined : "Product not verified online"
      });
      setShowResults(true);
      stopCamera();
      toast({
        title: geminiResult === "PASS" ? "Verification Passed" : "Verification Failed",
        description: geminiResult === "PASS" ? "Product verified online." : "Product not verified online.",
        variant: geminiResult === "PASS" ? "default" : "destructive"
      });
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
            <History className="h-6 w-6" />
          </Button>
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleLogout}
            className="text-primary-foreground hover:bg-primary/90"
          >
            <LogOut className="h-6 w-6" />
          </Button>
        </div>
      </header>

      {/* Camera Viewfinder */}
      <div className="flex-1 relative bg-black overflow-hidden">
        {isCameraActive ? (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              muted
              className="w-full h-full object-contain sm:object-cover rounded-lg"
              style={{ maxHeight: 'calc(100vh - 180px)', aspectRatio: '16/9', background: '#222' }}
            />

            {/* Viewfinder Overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-x-2 sm:inset-x-8 top-1/4 bottom-1/4 border-2 border-white rounded-xl opacity-70">
                <div className="absolute inset-0 border-4 border-transparent">
                  {/* Corner markers */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary" />
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-20 space-y-2">
                <p className="text-center text-white bg-black/70 py-2 text-base mx-4 rounded-lg backdrop-blur-sm">
                  Align product label within frame
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-black/70 backdrop-blur-sm text-white border-white/30 px-6 py-3 text-base"
                    onClick={() => {
                      setIsFrontCamera(!isFrontCamera);
                      if (isCameraActive) startCamera();
                    }}
                  >
                    <Camera className="w-5 h-5 mr-2" />
                    {isFrontCamera ? 'Back Camera' : 'Front Camera'}
                  </Button>
                  <Button 
                    size="lg" 
                    variant="outline" 
                    className="bg-black/70 backdrop-blur-sm text-white border-white/30 px-6 py-3 text-base"
                    onClick={() => {
                      setIsFlashOn(!isFlashOn);
                      if (isCameraActive) startCamera();
                    }}
                  >
                    <ImageIcon className="w-5 h-5 mr-2" />
                    {isFlashOn ? 'Flash Off' : 'Flash On'}
                  </Button>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-6 p-6">
            <div className="text-center space-y-2 mb-4">
              <h3 className="text-xl font-semibold">Camera Access Required</h3>
              <p className="text-base text-muted-foreground">Please allow camera access to scan product labels</p>
            </div>
            <Button onClick={startCamera} size="xl" className="min-w-[220px] py-4 text-lg">
              <Camera className="mr-3 w-6 h-6" /> Enable Camera
            </Button>
            <p className="text-sm text-red-500 mt-2">If you see a blank screen, check browser permissions and reload.</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-6 space-y-4">
        <Button 
          onClick={captureImage} 
          size="xl" 
          className="w-full min-h-[56px] text-lg"
          disabled={isProcessing || !isCameraActive}
        >
          {isProcessing ? (
            <><Loader2 className="animate-spin mr-3 w-6 h-6" /> Processing...</>
          ) : (
            <><Camera className="mr-3 w-6 h-6" /> Capture & Verify</>
          )}
        </Button>

        <div className="grid grid-cols-2 gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate("/manual-entry")}
            className="min-h-[56px] text-lg"
          >
            <Keyboard className="mr-3 w-6 h-6" /> Manual Entry
          </Button>
          <Button 
            variant="outline" 
            onClick={() => navigate("/history")}
            className="min-h-[56px] text-lg"
          >
            <History className="mr-3 w-6 h-6" /> History
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
import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, limit, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Search, ArrowLeft } from "lucide-react";
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

const ManualEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const imageUrl = location.state?.imageUrl;
  const ocrData = location.state?.ocrData;

  const [serialNumber, setSerialNumber] = useState(ocrData?.serialNumber || "");
  const [hsnCode, setHsnCode] = useState(ocrData?.hsnCode || "");
  const [ocrConfidence, setOcrConfidence] = useState(ocrData?.confidence || 0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<VerificationData | null>(null);
  const [showResults, setShowResults] = useState(false);

  const getCurrentLocation = (): Promise<{ latitude: number; longitude: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation not supported"));
        return;
      }
      
      navigator.geolocation.getCurrentPosition(
        (position) => resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude
        }),
        () => resolve({ latitude: 0, longitude: 0 })
      );
    });
  };

  const verifyProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsVerifying(true);

    try {
      // Query Firestore for matching serial number
      const q = query(collection(db, 'products'), where('serial_number', '==', serialNumber), limit(1));
      const snap = await getDocs(q);
      const product: any = snap.empty ? null : { id: snap.docs[0].id, ...snap.docs[0].data() };

      if (!product) {
        const verificationData: VerificationData = {
          status: 'NO_PASS',
          mismatchReason: 'Serial number not found in database',
          extractedSerial: serialNumber,
          extractedHsn: hsnCode,
          capturedImageUrl: imageUrl
        };
        
        // Log the failed verification
        const location = await getCurrentLocation();
        const user = auth.currentUser;
        await addDoc(collection(db, 'verification_logs'), {
          user_id: user?.uid || null,
          product_id: null,
          product_description: null,
          brand: null,
          captured_image_url: imageUrl || null,
          extracted_serial: serialNumber,
          extracted_hsn: hsnCode,
          verification_status: 'NO_PASS',
          mismatch_reason: 'Serial number not found in database',
          latitude: location.latitude,
          longitude: location.longitude,
          created_at: serverTimestamp(),
        });

        setResult(verificationData);
        setShowResults(true);
        return;
      }

      // Check HSN code match
      const hsnMatch = product.hsn_code === hsnCode;
      const verificationStatus = hsnMatch ? 'PASS' : 'NO_PASS';

      const verificationData: VerificationData = {
        status: verificationStatus,
        productDescription: product.product_description,
        brand: product.brand,
        declaredValue: product.declared_value,
        countryOfOrigin: product.country_of_origin,
        extractedSerial: serialNumber,
        extractedHsn: hsnCode,
        hsnMatch,
        mismatchReason: !hsnMatch ? 
          `HSN Code mismatch: Expected ${product.hsn_code}, found ${hsnCode}` : undefined,
        capturedImageUrl: imageUrl
      };

      // Log verification attempt
      const location = await getCurrentLocation();
      const user = auth.currentUser;
      await addDoc(collection(db, 'verification_logs'), {
        user_id: user?.uid || null,
        product_id: product.id,
        product_description: product.product_description,
        brand: product.brand,
        captured_image_url: imageUrl || null,
        extracted_serial: serialNumber,
        extracted_hsn: hsnCode,
        verification_status: verificationStatus,
        mismatch_reason: verificationData.mismatchReason || null,
        latitude: location.latitude,
        longitude: location.longitude,
        created_at: serverTimestamp(),
      });

      setResult(verificationData);
      setShowResults(true);

      toast({
        title: verificationStatus === 'PASS' ? "Verification Passed" : "Verification Failed",
        description: verificationStatus === 'PASS' ? 
          "Product matches database records." : 
          "Product does not match database records.",
        variant: verificationStatus === 'PASS' ? "default" : "destructive"
      });

    } catch (error: any) {
      toast({
        title: "Verification Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        <Button 
          variant="ghost" 
          onClick={() => navigate("/scanner")}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Scanner
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Manual Product Entry</CardTitle>
            <CardDescription>
              {ocrData ? 
                `OCR extracted data with ${Math.round(ocrConfidence * 100)}% confidence. Please verify.` :
                "Enter product details manually for verification"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {imageUrl && (
              <div className="mb-4">
                <img 
                  src={imageUrl} 
                  alt="Captured product" 
                  className="w-full h-48 object-cover rounded-lg border"
                />
              </div>
            )}
            
            <form onSubmit={verifyProduct} className="space-y-6">
              {ocrData && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>OCR Results</AlertTitle>
                  <AlertDescription>
                    Text extracted with {Math.round(ocrConfidence * 100)}% confidence. Please verify the details below.
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="serial">Serial Number *</Label>
                <Input 
                  id="serial"
                  placeholder="e.g., F9GZC123XYZ" 
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                  required
                  className="font-mono text-lg tracking-wide"
                  pattern="[A-Z0-9-]{6,12}"
                  title="Serial number should be 6-12 characters long and can contain letters, numbers, and hyphens"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the product serial number exactly as shown on the label
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hsn">HSN Code *</Label>
                <Input 
                  id="hsn"
                  placeholder="e.g., 85171310" 
                  value={hsnCode}
                  onChange={(e) => setHsnCode(e.target.value)}
                  pattern="[0-9]{6,10}"
                  required
                  className="font-mono text-lg tracking-wide"
                  title="HSN code should be 6-10 digits"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the 6-10 digit HSN (Harmonized System Nomenclature) code
                </p>
              </div>

              <Button 
                type="submit" 
                className="w-full min-h-[48px]" 
                disabled={isVerifying || !serialNumber || !hsnCode}
              >
                {isVerifying ? (
                  <><Loader2 className="mr-2 animate-spin" /> Verifying...</>
                ) : (
                  <><Search className="mr-2" /> Verify Product</>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {showResults && result && (
        <VerificationResult 
          result={result}
          onClose={() => {
            setShowResults(false);
            setResult(null);
            navigate("/scanner");
          }}
          onScanNext={() => {
            setShowResults(false);
            setResult(null);
            setSerialNumber("");
            setHsnCode("");
          }}
        />
      )}
    </div>
  );
};

export default ManualEntry;
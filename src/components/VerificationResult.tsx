import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface VerificationData {
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

interface VerificationResultProps {
  result: VerificationData;
  onClose: () => void;
  onScanNext: () => void;
}

export const VerificationResult = ({ result, onClose, onScanNext }: VerificationResultProps) => {
  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className={cn(
        "max-w-md",
        result.status === 'PASS' ? 'border-l-4 border-success' : 'border-l-4 border-destructive'
      )}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {result.status === 'PASS' ? (
              <><CheckCircle className="text-success" /> VERIFICATION PASSED</>
            ) : (
              <><XCircle className="text-destructive" /> VERIFICATION FAILED</>
            )}
          </DialogTitle>
          <DialogDescription>
            {result.status === 'PASS' 
              ? 'Product matches database records' 
              : 'Product does not match database records'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {result.capturedImageUrl && result.productDescription && (
            <div className="flex gap-4">
              <img 
                src={result.capturedImageUrl} 
                alt="Product"
                className="w-24 h-24 object-cover rounded border"
              />
              <div className="flex-1 text-sm">
                <p className="font-semibold">{result.productDescription}</p>
                {result.brand && <p className="text-muted-foreground">{result.brand}</p>}
              </div>
            </div>
          )}

          <Separator />
          
          <div className="grid grid-cols-2 gap-2 text-sm">
            {result.extractedSerial && (
              <div>
                <p className="text-muted-foreground">Serial Number</p>
                <p className="font-mono font-semibold">{result.extractedSerial}</p>
              </div>
            )}
            {result.extractedHsn && (
              <div>
                <p className="text-muted-foreground">HSN Code</p>
                <p className={cn(
                  "font-mono font-semibold",
                  result.hsnMatch ? "text-success" : "text-destructive"
                )}>
                  {result.extractedHsn} {result.hsnMatch !== undefined && (result.hsnMatch ? '✓' : '✗')}
                </p>
              </div>
            )}
            {result.declaredValue && (
              <div>
                <p className="text-muted-foreground">Declared Value</p>
                <p className="font-semibold">${result.declaredValue.toFixed(2)}</p>
              </div>
            )}
            {result.countryOfOrigin && (
              <div>
                <p className="text-muted-foreground">Origin</p>
                <p className="font-semibold">{result.countryOfOrigin}</p>
              </div>
            )}
          </div>

          {result.mismatchReason && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Mismatch Detected</AlertTitle>
              <AlertDescription>{result.mismatchReason}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
          <Button onClick={onScanNext} className="w-full sm:w-auto">
            Scan Next Item
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
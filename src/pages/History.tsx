import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { auth, db } from "@/integrations/firebase/client";
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VerificationLog {
  id: string;
  captured_image_url: string | null;
  extracted_serial: string | null;
  extracted_hsn: string | null;
  verification_status: string;
  mismatch_reason: string | null;
  created_at: string;
  product_description: string | null;
  brand: string | null;
}

const History = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [logs, setLogs] = useState<VerificationLog[]>([]);
  const [filter, setFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
  }, [filter]);

  const fetchLogs = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        navigate("/auth");
        return;
      }
      const constraints = [
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
      ];
      const q = query(collection(db, 'verification_logs'), ...constraints);
      const snap = await getDocs(q);
      let items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
      if (filter !== 'all') {
        items = items.filter(i => i.verification_status === filter.toUpperCase());
      }
      const normalized: VerificationLog[] = items.map(i => ({
        id: i.id,
        captured_image_url: i.captured_image_url ?? null,
        extracted_serial: i.extracted_serial ?? null,
        extracted_hsn: i.extracted_hsn ?? null,
        verification_status: i.verification_status,
        mismatch_reason: i.mismatch_reason ?? null,
        created_at: i.created_at?.toDate ? i.created_at.toDate().toISOString() : String(i.created_at),
        product_description: i.product_description ?? null,
        brand: i.brand ?? null,
      }));
      setLogs(normalized);
    } catch (error: any) {
      toast({
        title: "Error Loading History",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    const csv = [
      ['Date', 'Serial Number', 'HSN Code', 'Status', 'Product', 'Brand', 'Reason'].join(','),
      ...logs.map(log => [
        new Date(log.created_at).toLocaleString(),
        log.extracted_serial || '',
        log.extracted_hsn || '',
        log.verification_status,
        log.products?.product_description || 'Unknown',
        log.products?.brand || 'Unknown',
        log.mismatch_reason || ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `verification-history-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export Complete",
      description: "History exported to CSV file.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="flex items-center gap-4 mb-6">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate("/scanner")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold flex-1">Verification History</h1>
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pass">Pass</SelectItem>
                <SelectItem value="no_pass">No Pass</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={exportCSV} disabled={logs.length === 0}>
              <Download className="mr-2 h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        {isLoading ? (
          <p className="text-center text-muted-foreground py-8">Loading history...</p>
        ) : logs.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No verification history found.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {logs.map(log => (
              <Card key={log.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {log.captured_image_url && (
                      <img 
                        src={log.captured_image_url} 
                        alt="Product"
                        className="w-16 h-16 rounded object-cover flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <p className="font-semibold truncate">
                          {log.products?.product_description || 'Unknown Product'}
                        </p>
                        <Badge 
                          variant={log.verification_status === 'PASS' ? 'default' : 'destructive'}
                          className="flex-shrink-0"
                        >
                          {log.verification_status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        Serial: <span className="font-mono">{log.extracted_serial || 'N/A'}</span> • 
                        HSN: <span className="font-mono">{log.extracted_hsn || 'N/A'}</span>
                      </p>
                      {log.mismatch_reason && (
                        <p className="text-sm text-destructive mb-1">
                          {log.mismatch_reason}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default History;
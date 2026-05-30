import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Camera, CameraOff, Sparkles, Volume2, Check } from "lucide-react";
import type { InventoryItem } from '@/types/inventory';
import { toast } from 'sonner';

interface BarcodeScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryItems: InventoryItem[];
  onScanSuccess: (item: InventoryItem, action: 'view' | 'increment') => void;
}

export const BarcodeScanner = ({ open, onOpenChange, inventoryItems, onScanSuccess }: BarcodeScannerProps) => {
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string>('');
  const [streamActive, setStreamActive] = useState(false);
  const [simulatedSku, setSimulatedSku] = useState('');
  const [scanAction, setScanAction] = useState<'view' | 'increment'>('view');

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Play a synthesized beep sound on successful scan
  const playBeep = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // High pitch beep
      
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15); // Short decay
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch (err) {
      console.warn("Failed to play audio beep:", err);
    }
  };

  // Enumerate cameras
  const getCameras = async () => {
    try {
      const devicesList = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devicesList.filter(device => device.kind === 'videoinput');
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        setSelectedDevice(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.warn('Failed to enumerate media devices:', err);
    }
  };

  // Start Camera Stream
  const startCamera = async (deviceId?: string) => {
    stopCamera();
    try {
      setHasCameraPermission(null);
      const constraints: MediaStreamConstraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'environment' }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setHasCameraPermission(true);
      setStreamActive(true);
      getCameras(); // Update list
    } catch (err) {
      console.error('Camera stream access failed:', err);
      setHasCameraPermission(false);
      setStreamActive(false);
      toast.error('Failed to access camera. Please grant permissions or use simulation mode.');
    }
  };

  // Stop Camera Stream
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  // Monitor Dialog open/close state to trigger camera
  useEffect(() => {
    if (open) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [open]);

  // Handle SKU Simulation Trigger
  const triggerSimulatedScan = () => {
    if (!simulatedSku) {
      toast.error("Please select a simulated product to scan");
      return;
    }

    const matchedItem = inventoryItems.find(item => item.sku === simulatedSku);
    if (!matchedItem) {
      toast.error("Product SKU not found in inventory");
      return;
    }

    playBeep();
    toast.success(`Scanned: ${matchedItem.name} (${matchedItem.sku})`, {
      icon: <Volume2 className="h-4 w-4 text-green-500" />
    });
    
    // Execute callback
    onScanSuccess(matchedItem, scanAction);
    
    // If incrementing, close isn't strictly necessary, but view should close dialog
    if (scanAction === 'view') {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md overflow-hidden bg-card/95 backdrop-blur-md border border-primary/20">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-primary" />
            <span>Camera Barcode Scanner</span>
          </DialogTitle>
          <DialogDescription>
            Point your camera at a barcode SKU or use the simulation console below.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-2">
          {/* Video Viewport Overlay */}
          <div className="relative w-full aspect-video rounded-xl overflow-hidden bg-black border-2 border-primary/30 shadow-2xl flex items-center justify-center">
            {streamActive ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center p-6 space-y-2">
                <CameraOff className="h-10 w-10 mx-auto text-muted-foreground opacity-50" />
                <p className="text-sm text-muted-foreground font-semibold">Camera stream is offline</p>
              </div>
            )}

            {/* Glowing Viewfinder Box Overlay */}
            {streamActive && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                {/* Laser Line */}
                <div className="absolute w-[80%] h-0.5 bg-green-500 shadow-[0_0_8px_#22c55e] animate-bounce" />
                
                {/* Scanner Target Box Corners */}
                <div className="w-[60%] h-[60%] border-2 border-dashed border-green-500/60 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 border-t-4 border-l-4 border-green-500 absolute -top-0 -left-0" style={{ transform: 'translate(45%, 45%)' }}></div>
                  <div className="w-4 h-4 border-t-4 border-r-4 border-green-500 absolute -top-0 -right-0" style={{ transform: 'translate(-45%, 45%)' }}></div>
                  <div className="w-4 h-4 border-b-4 border-l-4 border-green-500 absolute -bottom-0 -left-0" style={{ transform: 'translate(45%, -45%)' }}></div>
                  <div className="w-4 h-4 border-b-4 border-r-4 border-green-500 absolute -bottom-0 -right-0" style={{ transform: 'translate(-45%, -45%)' }}></div>
                </div>
              </div>
            )}
          </div>

          {/* Camera Source Selector Controls */}
          {devices.length > 1 && (
            <div className="w-full space-y-1">
              <Label className="text-xs text-muted-foreground font-bold">Select Active Camera</Label>
              <Select value={selectedDevice} onValueChange={(val) => { setSelectedDevice(val); startCamera(val); }}>
                <SelectTrigger className="h-8 text-xs dropdown-content">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="dropdown-content">
                  {devices.map((device, idx) => (
                    <SelectItem key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Simulated Scanner console */}
          <div className="w-full bg-muted/40 p-3 rounded-lg border border-primary/10 space-y-3">
            <div className="flex items-center space-x-1.5 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Interactive Scanning Simulator</span>
            </div>
            
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground block font-bold">1. Scan Action</Label>
                <div className="flex rounded border bg-card overflow-hidden h-8">
                  <button
                    type="button"
                    onClick={() => setScanAction('view')}
                    className={`flex-1 text-[10px] font-semibold transition-all ${scanAction === 'view' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  >
                    View Details
                  </button>
                  <button
                    type="button"
                    onClick={() => setScanAction('increment')}
                    className={`flex-1 text-[10px] font-semibold transition-all ${scanAction === 'increment' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'}`}
                  >
                    Add Qty (+1)
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] text-muted-foreground block font-bold">2. Test Target SKU</Label>
                <Select value={simulatedSku} onValueChange={setSimulatedSku}>
                  <SelectTrigger className="h-8 text-[11px] dropdown-content">
                    <SelectValue placeholder="Choose SKU" />
                  </SelectTrigger>
                  <SelectContent className="dropdown-content">
                    {inventoryItems.map(item => (
                      <SelectItem key={item.id} value={item.sku} className="text-xs">
                        {item.sku} ({item.name})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button 
              type="button" 
              className="w-full h-8 bg-green-600 hover:bg-green-700 text-white text-xs font-bold" 
              onClick={triggerSimulatedScan}
              disabled={!simulatedSku}
            >
              <Volume2 className="h-3.5 w-3.5 mr-1" />
              Simulate Scan Beep
            </Button>
          </div>
        </div>

        <DialogFooter className="sm:justify-between border-t pt-3 mt-1">
          {streamActive ? (
            <Button variant="outline" size="sm" onClick={stopCamera}>
              <CameraOff className="h-4 w-4 mr-1.5" />
              Turn Off Camera
            </Button>
          ) : (
            <Button variant="outline" size="sm" onClick={() => startCamera(selectedDevice)}>
              <Camera className="h-4 w-4 mr-1.5" />
              Turn On Camera
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

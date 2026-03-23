'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode';
import { Modal, Button } from 'rizzui';
import { Loader2, CheckCircle2, Scan, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface QRScannerModalProps {
  eventId: string;
  eventName: string;
  onSuccess?: (attendee: any) => void;
}

export function QRScannerModal({ eventId, eventName, onSuccess }: QRScannerModalProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = () => {
    setScanning(true);
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    html5QrCode.start(
      { facingMode: "environment" },
      config,
      async (decodedText) => {
        // Successfully scanned
        handleVerify(decodedText);
        stopScanner();
      },
      (errorMessage) => {
        // silent - searching for QR
      }
    ).catch((err) => {
      console.error('Scanner start error:', err);
      toast.error('Could not start camera. Check permissions.');
      setScanning(false);
    });
  };

  const stopScanner = () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().then(() => {
            setScanning(false);
        }).catch(err => console.error(err));
    } else {
        setScanning(false);
    }
  };

  const handleVerify = async (token: string) => {
    setVerifying(true);
    try {
      const res = await fetch(`/api/events/${eventId}/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      const data = await res.json();
      if (data.success || data.message === 'Already checked in') {
        toast.success(data.message, { duration: 4000 });
        if (onSuccess) onSuccess(data.attendee);
        setModalOpen(false);
      } else {
        toast.error(data.error || 'Invalid ticket');
      }
    } catch (err) {
      toast.error('Verification failed');
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (modalOpen && !scanning && !verifying) {
        // Small delay to ensure the "reader" div is in DOM
        setTimeout(startScanner, 300);
    }
    return () => stopScanner();
  }, [modalOpen]);

  return (
    <>
      <Button
        onClick={() => setModalOpen(true)}
        className="gap-2 rounded-2xl bg-secondary-900 dark:bg-primary-600 text-white hover:opacity-90 transition-opacity"
      >
        <Scan className="w-4 h-4" />
        Scan Ticket
      </Button>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="p-6 bg-white dark:bg-secondary-950 rounded-3xl max-w-md mx-auto overflow-hidden relative border border-secondary-100 dark:border-secondary-800">
          <button 
            onClick={() => setModalOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-6">
            <div className="space-y-1">
                <h3 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight flex items-center gap-2 justify-center">
                   <Camera className="w-5 h-5 text-primary-500" /> Attendance Scanner
                </h3>
                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{eventName}</p>
            </div>

            <div className="relative w-full aspect-square bg-secondary-50 dark:bg-secondary-900 rounded-[2.5rem] overflow-hidden border-2 border-dashed border-secondary-200 dark:border-secondary-800 flex items-center justify-center">
                {verifying ? (
                    <div className="flex flex-col items-center gap-4">
                         <Loader2 className="w-12 h-12 animate-spin text-primary-500" />
                         <span className="text-[10px] font-black text-primary-600 uppercase tracking-widest animate-pulse">Verifying Identity...</span>
                    </div>
                ) : (
                    <div id="reader" className="w-full h-full scale-105" />
                )}
                
                {!scanning && !verifying && (
                    <Button variant="text" onClick={startScanner} className="text-primary-500">
                        Retry Camera
                    </Button>
                )}
            </div>

            <div className="bg-secondary-50 dark:bg-secondary-900/50 p-4 rounded-2xl w-full border border-secondary-100 dark:border-secondary-800">
                <div className="flex items-center gap-3 text-secondary-600 dark:text-secondary-400">
                    <div className="p-2 rounded-xl bg-white dark:bg-secondary-800 shadow-sm shrink-0">
                        <Scan className="w-4 h-4 text-primary-500" />
                    </div>
                    <div className="text-left">
                        <p className="text-[11px] font-black uppercase tracking-wider text-secondary-900 dark:text-white">Point camera at QR code</p>
                        <p className="text-[10px] text-secondary-500 leading-snug">The attendee's ticket will be verified automatically upon detection.</p>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}

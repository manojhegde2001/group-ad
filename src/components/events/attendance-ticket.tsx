'use client';

import { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal, Button } from 'rizzui';
import { Loader2, CheckCircle2, Ticket, X } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import toast from 'react-hot-toast';

interface AttendanceTicketProps {
  eventId: string;
  eventName: string;
}

export function AttendanceTicket({ eventId, eventName }: AttendanceTicketProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchToken = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/events/${eventId}/check-in/token`);
      const data = await res.json();
      if (data.token) {
        setToken(data.token);
      } else {
        toast.error(data.error || 'Failed to generate ticket');
      }
    } catch (err) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = () => {
    setModalOpen(true);
    if (!token) fetchToken();
  };

  return (
    <>
      <Button
        onClick={handleOpen}
        variant="outline"
        className="gap-2 rounded-2xl border-primary-100 hover:bg-primary-50 dark:border-secondary-800 dark:hover:bg-primary-900/10"
      >
        <Ticket className="w-4 h-4" />
        Show Ticket
      </Button>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)}>
        <div className="p-6 bg-white dark:bg-secondary-900 rounded-3xl max-w-sm mx-auto overflow-hidden relative">
          <button 
            onClick={() => setModalOpen(false)}
            className="absolute top-4 right-4 p-1 rounded-full hover:bg-secondary-100 dark:hover:bg-secondary-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col items-center text-center space-y-6 pt-4">
            <div className="space-y-1">
                <h3 className="text-xl font-black text-secondary-900 dark:text-white uppercase tracking-tight">Event Ticket</h3>
                <p className="text-[10px] font-black text-secondary-400 uppercase tracking-widest">{eventName}</p>
            </div>

            <div className="p-6 bg-white rounded-[2.5rem] shadow-2xl border border-secondary-50 relative group">
              {loading ? (
                <div className="w-48 h-48 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
                </div>
              ) : token ? (
                <div className="relative">
                    <QRCodeSVG 
                        value={token} 
                        size={192} 
                        level="H"
                        includeMargin={false}
                        className="rounded-xl"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-10">
                         <Ticket className="w-20 h-20 text-primary-500 rotate-12" />
                    </div>
                </div>
              ) : (
                <div className="w-48 h-48 flex flex-col items-center justify-center text-secondary-400 gap-2">
                    <X className="w-10 h-10" />
                    <span className="text-[10px] font-black uppercase">Failed to load</span>
                    <Button variant="text" size="sm" onClick={fetchToken} className="text-primary-500">Retry</Button>
                </div>
              )}
            </div>

            <div className="bg-primary-50 dark:bg-primary-900/10 p-4 rounded-2xl space-y-2">
                <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 justify-center">
                    <CheckCircle2 className="w-4 h-4" />
                    <span className="text-[11px] font-black uppercase tracking-wider">Valid for Check-in</span>
                </div>
                <p className="text-[10px] text-secondary-500 dark:text-secondary-400 leading-relaxed font-medium">
                    Present this QR code to the event organizer at the entrance for instant verification.
                </p>
            </div>

            <p className="text-[9px] text-secondary-300 dark:text-secondary-600 uppercase font-bold tracking-[0.2em] pt-2">
                Ticket ID: {token ? token.substring(token.length - 8).toUpperCase() : '........'}
            </p>
          </div>
        </div>
      </Modal>
    </>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Modal } from 'rizzui';
import { X, Clock, MapPin, Video, Users, ArrowUpRight, CheckCircle2, AlertCircle, Lock } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';
import { AppImage } from '@/components/ui/app-image';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useEnrollEvent, useUnenrollEvent } from '@/hooks/use-api/use-events';

export default function EventSheet({ event, onClose }: { event: any | null; onClose: () => void }) {
  return (
    <Modal
      isOpen={!!event}
      onClose={onClose}
      overlayClassName="backdrop-blur-sm bg-black/60 dark:bg-black/70"
      containerClassName="flex items-end sm:items-center justify-center sm:p-4 !bg-transparent"
    >
      {event ? <Inner key={event.id} event={event} onClose={onClose} /> : <span />}
    </Modal>
  );
}

function Row({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-secondary-600 dark:text-secondary-300">
      <Icon className="w-4 h-4 mt-0.5 shrink-0 text-primary-500" />
      <span className="font-medium">{children}</span>
    </div>
  );
}

function Badge({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cn('px-2 py-0.5 rounded-full bg-primary-500 text-white text-[9px] font-black uppercase tracking-wider shadow-sm', className)}>
      {children}
    </span>
  );
}

function Inner({ event, onClose }: { event: any; onClose: () => void }) {
  const { isAuthenticated, user } = useAuth();
  const enroll = useEnrollEvent();
  const unenroll = useUnenrollEvent();
  const [confirmWithdraw, setConfirmWithdraw] = useState(false);

  const start = new Date(event.startDate);
  const end = new Date(event.endDate);
  const isPast = end < new Date();
  const isCancelled = event.status === 'CANCELLED';
  const seatsLeft: number | null = event.seatsLeft ?? null;
  const isFull = seatsLeft != null && seatsLeft <= 0;
  const status: string | null = event.enrollmentStatus ?? null;
  const busy = enroll.isPending || unenroll.isPending;
  // Full eligibility (incl. profession quotas) is resolved on the detail page;
  // here we only surface the account-type gate, which the session can answer.
  const userTypeBlocked =
    Array.isArray(event.targetUserTypes) &&
    event.targetUserTypes.length > 0 &&
    (!(user as any)?.userType || !event.targetUserTypes.includes((user as any).userType));

  const doEnroll = () => {
    if (!isAuthenticated) {
      toast.error('Please log in to reserve a spot');
      return;
    }
    enroll.mutate(event.id);
  };

  const doWithdraw = () => {
    unenroll.mutate(event.id, { onSuccess: () => setConfirmWithdraw(false) });
  };

  return (
    <div className="w-full sm:max-w-lg bg-white dark:bg-secondary-900 rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl border border-secondary-100 dark:border-secondary-800 max-h-[92vh] sm:max-h-[85vh] flex flex-col">
      {/* Cover */}
      <div className="relative h-36 sm:h-44 shrink-0 bg-gradient-to-br from-primary-500 to-indigo-600">
        {event.coverImage && (
          <AppImage src={event.coverImage} alt={event.title} fill className="object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/85 dark:bg-secondary-900/80 backdrop-blur flex items-center justify-center text-secondary-900 dark:text-white shadow-lg transition-transform active:scale-95"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="absolute left-4 right-4 bottom-3 flex flex-wrap gap-1.5">
          <Badge>{event.eventType || 'Event'}</Badge>
          {event.isOnline && <Badge className="bg-sky-500">Online</Badge>}
          {isPast && <Badge className="bg-secondary-700">Ended</Badge>}
        </div>
      </div>

      {/* Body */}
      <div className="overflow-y-auto p-5 sm:p-6 space-y-4">
        <h2 className="text-lg sm:text-xl font-black text-secondary-900 dark:text-white leading-snug">{event.title}</h2>

        <div className="space-y-2 text-sm">
          <Row icon={Clock}>
            {format(start, 'EEE, MMM d · h:mm a')} – {format(end, 'h:mm a')}
          </Row>
          <Row icon={event.isOnline ? Video : MapPin}>
            {event.isOnline ? 'Online event' : (event.venue || event.city || 'Location to be announced')}
          </Row>
          {seatsLeft != null && (
            <Row icon={Users}>
              {seatsLeft > 0 ? `${seatsLeft} seat${seatsLeft === 1 ? '' : 's'} left` : 'Fully booked'}
            </Row>
          )}
        </div>

        {event.description && (
          <p className="text-sm text-secondary-600 dark:text-secondary-400 leading-relaxed line-clamp-4 whitespace-pre-wrap">
            {event.description}
          </p>
        )}

        <Link
          href={`/events/${event.slug}`}
          className="inline-flex items-center gap-1 text-xs font-bold text-primary-600 dark:text-primary-400 hover:underline"
        >
          View full details <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Action footer */}
      <div className="shrink-0 border-t border-secondary-100 dark:border-secondary-800 p-4 bg-white dark:bg-secondary-900">
        {isCancelled ? (
          <Button variant="flat" color="secondary" className="w-full py-4 rounded-xl font-bold" disabled>
            Event cancelled
          </Button>
        ) : isPast ? (
          <Button variant="flat" color="secondary" className="w-full py-4 rounded-xl font-bold" disabled>
            Event ended
          </Button>
        ) : status === 'APPROVED' || status === 'PENDING' ? (
          <div className="space-y-3">
            <div
              className={cn(
                'flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold',
                status === 'APPROVED'
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400'
                  : 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
              )}
            >
              {status === 'APPROVED' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {status === 'APPROVED' ? "You're going" : "You're on the waitlist"}
            </div>

            {confirmWithdraw ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  color="secondary"
                  className="flex-1 py-3 rounded-xl font-bold"
                  onClick={() => setConfirmWithdraw(false)}
                  disabled={busy}
                >
                  Keep spot
                </Button>
                <Button
                  variant="solid"
                  color="danger"
                  className="flex-1 py-3 rounded-xl font-bold"
                  onClick={doWithdraw}
                  isLoading={unenroll.isPending}
                >
                  Withdraw
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full py-3 rounded-xl text-sm font-bold text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10 border-red-200 hover:border-red-300"
                onClick={() => setConfirmWithdraw(true)}
                disabled={busy}
              >
                Withdraw
              </Button>
            )}
          </div>
        ) : userTypeBlocked ? (
          <div className="rounded-xl bg-secondary-50 dark:bg-secondary-800/50 border border-secondary-100 dark:border-secondary-800 p-3 flex items-start gap-2.5">
            <Lock className="w-4 h-4 text-secondary-400 shrink-0 mt-0.5" />
            <p className="text-xs font-semibold text-secondary-600 dark:text-secondary-300">
              This event is open to selected account types only.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <Button
              variant="solid"
              color="primary"
              className="w-full py-5 rounded-xl text-base font-black shadow-lg shadow-primary-200 dark:shadow-none"
              onClick={doEnroll}
              isLoading={enroll.isPending}
            >
              {isFull ? 'Join the waitlist' : 'Reserve my spot'}
            </Button>
            {isFull ? (
              <p className="text-[11px] text-center text-secondary-500">
                Fully booked — we&apos;ll notify you if a seat opens.
              </p>
            ) : seatsLeft != null && seatsLeft <= 5 ? (
              <p className="text-[11px] text-center font-semibold text-secondary-500">
                Only {seatsLeft} seat{seatsLeft === 1 ? '' : 's'} left
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

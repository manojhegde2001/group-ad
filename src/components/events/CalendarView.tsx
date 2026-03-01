'use client';

import { useState, Fragment } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay } from 'date-fns';
import { enUS } from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { Dialog, Transition } from '@headlessui/react';
import { X, Calendar as CalendarIcon, MapPin, Clock, Info, CheckCircle2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import toast from 'react-hot-toast';
import { useAuth } from '@/hooks/use-auth';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  resource: any;
}

interface CalendarViewProps {
  events: CalendarEvent[];
}

export default function CalendarView({ events }: CalendarViewProps) {
  const { isAuthenticated, user } = useAuth();
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setTimeout(() => setSelectedEvent(null), 200);
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      toast.error('Please log in to enroll');
      return;
    }
    if (!selectedEvent) return;

    setEnrolling(true);
    try {
      const res = await fetch(`/api/events/${selectedEvent.resource.id}/enroll`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to enroll');

      toast.success('Successfully enrolled! We\'ve sent you an email confirmation.');
      closeModal();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <div className="h-[750px] bg-white dark:bg-secondary-900 rounded-[2.5rem] p-4 sm:p-8 shadow-2xl border border-secondary-100 dark:border-secondary-800 transition-all">
      <style jsx global>{`
        .rbc-calendar {
          font-family: inherit;
        }
        .rbc-header {
          padding: 16px 0;
          font-weight: 700;
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #94a3b8;
          border-bottom: 1px solid #f1f5f9;
        }
        .rbc-month-view {
          border-radius: 1.5rem;
          overflow: hidden;
          border: 1px solid #f1f5f9;
        }
        .rbc-day-bg + .rbc-day-bg, .rbc-month-row + .rbc-month-row {
          border-left: 1px solid #f1f5f9;
          border-top: 1px solid #f1f5f9;
        }
        .rbc-event {
          background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
          border-radius: 8px;
          border: none;
          font-size: 0.7rem;
          font-weight: 600;
          padding: 4px 8px;
          margin: 1px 2px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.05);
          transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .rbc-event:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(2, 132, 199, 0.2);
          filter: brightness(1.1);
        }
        .rbc-today {
          background-color: rgba(2, 132, 199, 0.03);
        }
        .rbc-off-range-bg {
          background-color: #f8fafc;
        }
        .rbc-toolbar {
          margin-bottom: 2rem;
        }
        .rbc-toolbar-label {
          font-weight: 800;
          font-size: 1.5rem;
          color: #0f172a;
          letter-spacing: -0.02em;
        }
        .rbc-btn-group button {
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          padding: 8px 20px;
          font-size: 0.85rem;
          font-weight: 600;
          color: #475569;
          transition: all 0.2s;
          background: white;
        }
        .rbc-btn-group button:hover {
          background-color: #f8fafc;
          border-color: #cbd5e1;
          color: #0f172a;
        }
        .rbc-active {
          background-color: #0f172a !important;
          color: white !important;
          border-color: #0f172a !important;
          box-shadow: 0 4px 12px rgba(15, 23, 42, 0.15);
        }
        /* Dark mode overrides */
        .dark .rbc-header { color: #64748b; border-color: #1e293b; }
        .dark .rbc-month-view { border-color: #1e293b; }
        .dark .rbc-day-bg + .rbc-day-bg, .dark .rbc-month-row + .rbc-month-row { border-color: #1e293b; }
        .dark .rbc-off-range-bg { background-color: #020617; }
        .dark .rbc-today { background-color: rgba(56, 189, 248, 0.05); }
        .dark .rbc-toolbar-label { color: #f8fafc; }
        .dark .rbc-btn-group button { border-color: #1e293b; color: #94a3b8; background: #0f172a; }
        .dark .rbc-btn-group button:hover { background-color: #1e293b; color: #f8fafc; }
        .dark .rbc-active { background-color: #f8fafc !important; color: #020617 !important; border-color: #f8fafc !important; }
      `}</style>

      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        defaultView={Views.MONTH}
        views={['month', 'week', 'day', 'agenda']}
        onSelectEvent={handleSelectEvent}
        popup
        className="dark:text-secondary-100"
      />

      {/* Event Details Modal */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-[100]" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-lg transform overflow-hidden rounded-[2.5rem] bg-white dark:bg-secondary-900 p-0 text-left align-middle shadow-2xl transition-all border border-secondary-100 dark:border-secondary-800">
                  {selectedEvent && (
                    <div className="flex flex-col">
                      {/* Cover Image or Gradient */}
                      <div className="relative h-48 w-full bg-gradient-to-br from-primary-500 to-primary-700">
                        {selectedEvent.resource.coverImage && (
                          <img
                            src={selectedEvent.resource.coverImage}
                            alt={selectedEvent.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-white dark:from-secondary-900 to-transparent" />
                        <button
                          onClick={closeModal}
                          className="absolute top-4 right-4 p-2 rounded-full bg-white/20 hover:bg-white/40 backdrop-blur-md text-white transition-all"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="px-8 pb-10 -mt-10 relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 text-[10px] font-black uppercase tracking-wider">
                            {selectedEvent.resource.eventType}
                          </span>
                          {selectedEvent.resource.isOnline && (
                            <span className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300 text-[10px] font-black uppercase tracking-wider">
                              Live Online
                            </span>
                          )}
                        </div>

                        <Dialog.Title as="h3" className="text-2xl font-black text-secondary-900 dark:text-white leading-tight mb-4">
                          {selectedEvent.title}
                        </Dialog.Title>

                        <div className="space-y-4 mb-8">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center shrink-0">
                              <Clock className="w-5 h-5 text-secondary-500" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-secondary-400 dark:text-secondary-500 tracking-wide uppercase">Date & Time</p>
                              <p className="text-sm font-semibold text-secondary-800 dark:text-secondary-200">
                                {format(selectedEvent.start, 'EEEE, d MMMM')} · {format(selectedEvent.start, 'h:mm a')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-secondary-50 dark:bg-secondary-800 flex items-center justify-center shrink-0">
                              <MapPin className="w-5 h-5 text-secondary-500" />
                            </div>
                            <div>
                              <p className="text-xs font-bold text-secondary-400 dark:text-secondary-500 tracking-wide uppercase">Location</p>
                              <p className="text-sm font-semibold text-secondary-800 dark:text-secondary-200">
                                {selectedEvent.resource.isOnline ? 'Digital Workshop Room' : (selectedEvent.resource.venue || 'To be announced')}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-start gap-3 pt-2">
                            <div className="w-10 h-10 rounded-xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center shrink-0">
                              <Info className="w-5 h-5 text-primary-500" />
                            </div>
                            <p className="text-sm text-secondary-600 dark:text-secondary-400 leading-relaxed font-medium">
                              {selectedEvent.resource.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <Button
                            onClick={handleEnroll}
                            disabled={enrolling}
                            variant="solid"
                            color="primary"
                            className="flex-1 py-6 rounded-2xl text-base font-bold shadow-lg shadow-primary-200 dark:shadow-none"
                          >
                            {enrolling ? 'Enrolling...' : 'Reserve Spot Now'}
                            {!enrolling && <ArrowRight className="w-5 h-5 ml-2" />}
                          </Button>

                          <a
                            href={`/events/${selectedEvent.resource.slug}`}
                            className="text-xs font-bold text-secondary-400 hover:text-secondary-600 dark:hover:text-secondary-200 transition-colors uppercase tracking-widest whitespace-nowrap"
                          >
                            Details Page
                          </a>
                        </div>
                      </div>
                    </div>
                  )}
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}

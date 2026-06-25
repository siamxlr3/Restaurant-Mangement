import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  RiRestaurantLine, 
  RiTimerLine, 
  RiCheckDoubleLine, 
  RiPushpinLine,
  RiFileList3Line,
  RiFilter3Line,
  RiRefreshLine
} from 'react-icons/ri';
import { toast } from 'react-hot-toast';
import { 
  useGetTicketsQuery, 
  useUpdateTicketStatusMutation 
} from '../../store/api/kitchenApi';
import { formatDistanceToNow } from 'date-fns';

const KitchenDisplay = () => {
  const [station, setStation] = useState('Main Kitchen');
  const { data, isLoading, refetch } = useGetTicketsQuery({ station });
  const [updateStatus] = useUpdateTicketStatusMutation();

  const handleBump = async (id) => {
    try {
      await updateStatus({ id, status: 'bumped' }).unwrap();
      toast.success('Ticket bumped!');
    } catch (error) {
      toast.error('Failed to bump ticket');
    }
  };

  const handleStatusChange = async (id, status) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(`Ticket marked as ${status}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-paper">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ticket-orange mx-auto mb-4"></div>
          <p className="text-slate-500 font-medium">Loading KDS Queue...</p>
        </div>
      </div>
    );
  }

  const tickets = data?.items || [];

  return (
    <div className="flex flex-col h-screen bg-paper text-ink overflow-hidden font-sans">
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-ticket-orangeDim rounded-lg">
            <RiRestaurantLine className="text-2xl text-ticket-orange" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-ink">Kitchen Display System</h1>
            <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">{station}</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
             <button 
                onClick={() => setStation('Main Kitchen')}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${station === 'Main Kitchen' ? 'bg-white text-ink shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Main
             </button>
             <button 
                onClick={() => setStation('Drinks')}
                className={`px-4 py-1.5 rounded-md text-sm font-semibold transition-all ${station === 'Drinks' ? 'bg-white text-ink shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-700'}`}
             >
               Drinks
             </button>
          </div>
          
          <button 
            onClick={() => refetch()}
            className="p-2.5 rounded-full bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shadow-sm"
          >
            <RiRefreshLine className="text-lg" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden p-6 custom-scrollbar">
        <div className="flex gap-6 h-full items-start min-w-max">
          <AnimatePresence mode="popLayout">
            {tickets.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center w-full h-[60vh] text-slate-400"
              >
                <div className="p-8 bg-slate-50 rounded-full mb-6 border border-slate-100">
                  <RiFileList3Line className="text-6xl text-slate-200" />
                </div>
                <h2 className="text-2xl font-semibold text-slate-400">No Orders in Queue</h2>
                <p className="mt-2 font-medium">All caught up! Taking a breather...</p>
              </motion.div>
            ) : (
              tickets.map((ticket, index) => (
                <TicketCard 
                  key={ticket.id} 
                  ticket={ticket} 
                  onBump={() => handleBump(ticket.id)}
                  onStatusChange={(status) => handleStatusChange(ticket.id, status)}
                  index={index}
                />
              ))
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer / Stats */}
      <footer className="px-6 py-3 bg-white border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 font-bold tracking-wide">
        <div className="flex gap-6">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
            <span>{tickets.filter(t => t.status === 'pending').length} Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-ticket-orange"></span>
            <span>{tickets.filter(t => t.status === 'preparing').length} Preparing</span>
          </div>
        </div>
        <div className="uppercase tracking-tighter">
          Active Tickets: <span className="text-ink ml-1">{tickets.length}</span>
        </div>
      </footer>
    </div>
  );
};

const TicketCard = ({ ticket, onBump, onStatusChange, index }) => {
  const [elapsed, setElapsed] = useState('');
  
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(formatDistanceToNow(new Date(ticket.sent_at), { addSuffix: false }));
    }, 1000);
    setElapsed(formatDistanceToNow(new Date(ticket.sent_at), { addSuffix: false }));
    return () => clearInterval(timer);
  }, [ticket.sent_at]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'preparing': return 'border-ticket-orange ring-1 ring-ticket-orange/20 shadow-lg shadow-ticket-orange/5';
      case 'ready':     return 'border-pass-green ring-1 ring-pass-green/20 shadow-lg shadow-pass-green/5';
      default:          return 'border-slate-200 shadow-card';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'preparing': return 'bg-ticket-orange text-white';
      case 'ready':     return 'bg-pass-green text-white';
      default:          return 'bg-slate-100 text-slate-600';
    }
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8, transition: { duration: 0.2 } }}
      transition={{ type: 'spring', damping: 20, stiffness: 100, delay: index * 0.05 }}
      className={`relative flex flex-col w-85 max-h-full rounded-2xl border-2 bg-white ${getStatusColor(ticket.status)} transition-all duration-300 overflow-hidden`}
    >
      {/* Ticket Header */}
      <div className={`p-4 border-b ${ticket.status === 'pending' ? 'border-slate-100 bg-slate-50/50' : 'border-slate-100 bg-white'}`}>
        <div className="flex justify-between items-start mb-2">
          <div className="flex items-center gap-2">
             <span className="text-2xl font-black text-ink">#{ticket.order?.id?.slice(-4) || '---'}</span>
             {ticket.order?.type === 'dine-in' && (
               <span className="px-2 py-0.5 rounded bg-slate-100 text-[10px] font-bold text-slate-600 uppercase tracking-tighter">
                 Table {ticket.order?.table?.name || '??'}
               </span>
             )}
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest ${getStatusBadge(ticket.status)}`}>
              {ticket.status}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1.5 text-slate-500 text-xs font-bold">
           <RiTimerLine className="text-slate-400" />
           <span className={parseFloat(elapsed) > 15 ? 'text-rose-signal' : ''}>{elapsed} ago</span>
           <span className="mx-1 text-slate-300">•</span>
           <span className="uppercase tracking-wider text-[10px]">{ticket.order?.type}</span>
        </div>
      </div>

      {/* Item List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white">
        {ticket.order?.items?.map((item, idx) => (
          <div key={idx} className="group">
            <div className="flex gap-3">
              <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100 text-ink font-bold text-sm border border-slate-200">
                {item.quantity}
              </span>
              <div className="flex-1">
                <p className="text-ink font-bold tracking-tight group-hover:text-ticket-orange transition-colors">{item.name}</p>
                {item.variant && (
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5 tracking-wider">{item.variant}</p>
                )}
                {item.modifiers?.length > 0 && (
                  <div className="mt-2 space-y-1">
                    {item.modifiers.map((mod, midx) => (
                      <div key={midx} className="flex items-center gap-1.5 text-[11px] text-slate-500 font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                        {mod.name}
                      </div>
                    ))}
                  </div>
                )}
                {item.notes && (
                  <div className="mt-2 p-2 rounded-lg bg-rose-signal/5 border border-rose-signal/10">
                    <p className="text-[11px] text-rose-signal font-bold italic leading-tight">
                      Note: {item.notes}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="p-3 bg-slate-50/80 border-t border-slate-100 grid grid-cols-2 gap-3">
        {ticket.status === 'pending' && (
          <button 
            onClick={() => onStatusChange('preparing')}
            className="btn-accent col-span-2 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm shadow-ticket-orange/20"
          >
            <RiTimerLine className="text-lg" />
            Start Preparing
          </button>
        )}
        
        {ticket.status === 'preparing' && (
          <>
            <button 
              onClick={() => onStatusChange('ready')}
              className="col-span-2 py-3 px-4 rounded-xl bg-pass-green hover:bg-emerald-600 text-white font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm shadow-pass-green/20"
            >
              <RiCheckDoubleLine className="text-lg" />
              Mark Ready
            </button>
          </>
        )}

        {ticket.status === 'ready' && (
          <button 
            onClick={onBump}
            className="btn-secondary col-span-2 py-3 px-4 rounded-xl font-bold text-sm transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm border-slate-200"
          >
            <RiCheckDoubleLine className="text-lg" />
            Bump Ticket
          </button>
        )}
      </div>
      
      {/* Alert if long wait */}
      {parseFloat(elapsed) > 20 && ticket.status !== 'ready' && (
        <div className="absolute top-0 left-0 w-full h-1.5 overflow-hidden bg-rose-signal/10">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
            className="w-1/2 h-full bg-rose-signal shadow-[0_0_8px_rgba(244,63,94,0.5)]"
          />
        </div>
      )}
    </motion.div>
  );
};

export default KitchenDisplay;

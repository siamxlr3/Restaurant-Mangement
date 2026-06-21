import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiUsers, FiCalendar, FiClock, FiShield, FiPlus } from 'react-icons/fi';
import PageHeader from '../../components/ui/PageHeader';
import StaffTable from '../../components/staff/StaffTable';
import StaffForm from '../../components/staff/StaffForm';
import Shifts from './Shifts';
import Attendance from './Attendance';

const tabs = [
    { id: 'staff', label: 'Staff', icon: FiUsers },
    { id: 'shifts', label: 'Shifts', icon: FiCalendar },
    { id: 'attendance', label: 'Attendance', icon: FiClock },
    { id: 'roles', label: 'Roles', icon: FiShield },
];

const StaffManagement = () => {
    const [activeTab, setActiveTab] = useState('staff');
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState(null);

    const handleEdit = (staff) => {
        setEditingStaff(staff);
        setIsFormOpen(true);
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setEditingStaff(null);
    };

    return (
        <div className="flex flex-col gap-6">
            <PageHeader
                title="Staff Management"
                description="Manage your team, schedules, and attendance."
                actions={
                    activeTab === 'staff' && (
                        <button 
                            onClick={() => {
                                setEditingStaff(null);
                                setIsFormOpen(true);
                            }}
                            className="btn-accent flex items-center gap-2"
                        >
                            <FiPlus /> Add Staff
                        </button>
                    )
                }
            />

            {/* Animated Tabs Navigation */}
            <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl w-fit">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`relative flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'text-accent shadow-sm' : 'text-slate-500 hover:text-ink hover:bg-white/50'}`}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="activeTab"
                                    className="absolute inset-0 bg-white rounded-lg -z-10"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon size={16} />
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Tab Content with Framer Motion Animation */}
            <div className="relative min-h-[500px]">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ x: 20, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: -20, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeOut' }}
                    >
                        {activeTab === 'staff' && <StaffTable onEdit={handleEdit} />}
                        {activeTab === 'shifts' && <Shifts />}
                        {activeTab === 'attendance' && <Attendance />}
                        {activeTab === 'roles' && (
                            <div className="panel p-12 text-center text-slate-400">
                                Roles & Permissions management coming soon.
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Modal for Staff Form */}
            <AnimatePresence>
                {isFormOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                            onClick={handleCloseForm}
                        />
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden"
                        >
                            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                                <h2 className="text-xl font-bold text-ink">
                                    {editingStaff ? 'Edit Staff' : 'Add New Staff'}
                                </h2>
                                <button 
                                    onClick={handleCloseForm}
                                    className="p-2 hover:bg-slate-50 rounded-full transition-colors"
                                >
                                    <FiX className="text-slate-400" />
                                </button>
                            </div>
                            <div className="p-8">
                                <StaffForm 
                                    staff={editingStaff}
                                    onSuccess={handleCloseForm} 
                                    onCancel={handleCloseForm} 
                                />
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

// Simple FiX icon if not imported correctly
const FiX = ({ className }) => (
  <svg className={className} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"></line>
    <line x1="6" y1="6" x2="18" y2="18"></line>
  </svg>
);

export default StaffManagement;

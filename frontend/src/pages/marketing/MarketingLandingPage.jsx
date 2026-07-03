import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import {
  FiSettings, FiRadio, FiStar, FiBook, FiCoffee,
  FiAward, FiImage, FiMessageSquare, FiClock,
  FiMapPin, FiHelpCircle, FiCalendar,
} from 'react-icons/fi';
import PageHeader from '../../components/ui/PageHeader';
import SiteConfigPanel from '../../components/cms/SiteConfigPanel';
import TickerItemsPanel from '../../components/cms/TickerItemsPanel';
import HeroPanel from '../../components/cms/HeroPanel';
import StoryPanel from '../../components/cms/StoryPanel';
import FeaturedDishesPanel from '../../components/cms/FeaturedDishesPanel';
import FeaturesPanel from '../../components/cms/FeaturesPanel';
import GalleryPanel from '../../components/cms/GalleryPanel';
import ReviewsPanel from '../../components/cms/ReviewsPanel';
import OpeningHoursPanel from '../../components/cms/OpeningHoursPanel';
import LocationPanel from '../../components/cms/LocationPanel';
import FaqPanel from '../../components/cms/FaqPanel';
import ReservationConfigPanel from '../../components/cms/ReservationConfigPanel';

const tabs = [
  { id: 'site-config',        label: 'Site Config',      icon: FiSettings },
  { id: 'ticker',             label: 'Ticker',            icon: FiRadio },
  { id: 'hero',               label: 'Hero',              icon: FiStar },
  { id: 'story',              label: 'Our Story',         icon: FiBook },
  { id: 'featured-dishes',   label: 'Signature Dishes',  icon: FiCoffee },
  { id: 'features',           label: 'Features',          icon: FiAward },
  { id: 'gallery',            label: 'Gallery',           icon: FiImage },
  { id: 'reviews',            label: 'Reviews',           icon: FiMessageSquare },
  { id: 'hours',              label: 'Hours',             icon: FiClock },
  { id: 'location',           label: 'Location',          icon: FiMapPin },
  { id: 'faq',                label: 'FAQ',               icon: FiHelpCircle },
  { id: 'reservation-config', label: 'Reservations',     icon: FiCalendar },
];

export default function MarketingLandingPage() {
  const [activeTab, setActiveTab] = useState('site-config');

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="CMS & Landing Page"
        description="Manage all public-facing content sections of your restaurant website."
        actions={
          <Link to="/home" target="_blank" rel="noopener noreferrer" className="btn-secondary flex items-center gap-2">
            <ExternalLink size={14} />
            View live page
          </Link>
        }
      />

      {/* Scrollable Tab Strip */}
      <div className="overflow-x-auto">
        <div className="flex items-center gap-1 bg-slate-100/50 p-1 rounded-xl w-max min-w-full">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive ? 'text-accent shadow-sm' : 'text-slate-500 hover:text-ink hover:bg-white/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="cmsActiveTab"
                    className="absolute inset-0 bg-white rounded-lg -z-10 shadow-sm"
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="relative min-h-[500px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ x: 16, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -16, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {activeTab === 'site-config'        && <SiteConfigPanel />}
            {activeTab === 'ticker'             && <TickerItemsPanel />}
            {activeTab === 'hero'               && <HeroPanel />}
            {activeTab === 'story'              && <StoryPanel />}
            {activeTab === 'featured-dishes'    && <FeaturedDishesPanel />}
            {activeTab === 'features'           && <FeaturesPanel />}
            {activeTab === 'gallery'            && <GalleryPanel />}
            {activeTab === 'reviews'            && <ReviewsPanel />}
            {activeTab === 'hours'              && <OpeningHoursPanel />}
            {activeTab === 'location'           && <LocationPanel />}
            {activeTab === 'faq'               && <FaqPanel />}
            {activeTab === 'reservation-config' && <ReservationConfigPanel />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

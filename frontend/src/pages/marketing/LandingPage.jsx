import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight, Star, Users, Clock, MapPin, Phone,
  Flame, ChevronDown, ChevronUp, Camera, Radio, Minus, Plus, CheckCircle2,
  Quote, Leaf, ChefHat, Timer, Sofa, HeartHandshake, Car, PhoneCall, Navigation,
  Loader2,
} from 'lucide-react'

import {
  useGetSiteConfigQuery, useGetTickerItemsQuery, useGetHeroQuery, useGetStoryQuery,
  useGetFeaturedDishesQuery, useGetFeaturesQuery, useGetGalleryItemsQuery, useGetReviewsQuery,
  useGetOpeningHoursQuery, useGetLocationQuery, useGetFaqItemsQuery, useGetReservationConfigQuery,
} from '../../store/api/cmsApi'
import { useGetCategoriesQuery } from '../../store/api/categoriesApi'
import { useGetItemsQuery } from '../../store/api/itemsApi'
import { useCreateReservationMutation } from '../../store/api/reservationApi'

/* ---------------------------------------------------------
   CONSTANTS / FALLBACKS
   (used only while data is loading, or as a visual fallback
   when a field genuinely has no image, so the layout never breaks)
--------------------------------------------------------- */
const NAV_LINKS = [
  { label: 'Home', href: '#home' },
  { label: 'Menu', href: '#menu' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'Reservation', href: '#reserve' },
]

const GRADIENT_PALETTE = [
  { from: '#FF6A3D', to: '#3A1408' },
  { from: '#F2A93B', to: '#4A3308' },
  { from: '#33F2D0', to: '#0C3B34' },
  { from: '#FF6A3D', to: '#4A1E0C' },
  { from: '#F2A93B', to: '#5A3A0C' },
  { from: '#33F2D0', to: '#123B36' },
]

const FEATURE_ICONS = {
  leaf: Leaf,
  chef: ChefHat,
  chef_hat: ChefHat,
  timer: Timer,
  clock: Clock,
  sofa: Sofa,
  heart: HeartHandshake,
  heart_handshake: HeartHandshake,
}

function gradientFor(index) {
  return GRADIENT_PALETTE[index % GRADIENT_PALETTE.length]
}

function iconFor(key) {
  return FEATURE_ICONS[(key || '').toLowerCase()] || Leaf
}

/* ---------------------------------------------------------
   MOTION VARIANTS
   Centralized so every section reveals/staggers consistently.
--------------------------------------------------------- */
const EASE = [0.22, 1, 0.36, 1]

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.65, ease: EASE } },
}

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.7, ease: EASE } },
}

const scaleIn = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: EASE } },
}

const staggerContainer = (stagger = 0.09, delay = 0.05) => ({
  hidden: {},
  visible: { transition: { staggerChildren: stagger, delayChildren: delay } },
})

// Convenience wrapper: reveals its children once, when scrolled into view.
function Reveal({ as = 'div', className, variants = staggerContainer(), children, viewportAmount = 0.2, ...props }) {
  const MotionTag = motion[as] || motion.div
  return (
    <MotionTag
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: viewportAmount }}
      variants={variants}
      {...props}
    >
      {children}
    </MotionTag>
  )
}

/* ---------------------------------------------------------
   SMALL PIECES
--------------------------------------------------------- */
function StarRow({ rating, size = 12 }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={size} className={i < rating ? 'text-[#F2A93B] fill-[#F2A93B]' : 'text-[#F3EFE4]/15'} />
      ))}
    </span>
  )
}

function GlowButton({ children, variant = 'primary', icon: Icon = ArrowRight, ...props }) {
  const base = 'group relative inline-flex items-center gap-2 px-7 py-3.5 rounded-full font-semibold text-[13px] tracking-wide uppercase transition-colors duration-300'
  const styles = {
    primary: 'bg-[#FF6A3D] text-[#0A0B0D] hover:shadow-[0_0_40px_-6px_#FF6A3D]',
    ghost: 'border border-[#33F2D0]/40 text-[#33F2D0] hover:bg-[#33F2D0]/10 hover:shadow-[0_0_30px_-8px_#33F2D0]',
  }
  return (
    <motion.button
      className={`${base} ${styles[variant]}`}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 400, damping: 22 }}
      {...props}
    >
      {children}
      <motion.span
        className="inline-flex"
        initial={{ x: 0 }}
        whileHover={{ x: 3 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
      >
        <Icon size={15} />
      </motion.span>
    </motion.button>
  )
}

function SectionEyebrow({ children, color = '#F2A93B' }) {
  return (
    <motion.p variants={fadeUp} className="font-mono-ui text-[11px] tracking-[0.25em] mb-3" style={{ color }}>
      {children}
    </motion.p>
  )
}

function InlineSpinner() {
  return <Loader2 size={16} className="animate-spin text-[#F3EFE4]/30" />
}

/* ---------------------------------------------------------
   MAIN
--------------------------------------------------------- */
export default function LandingPage() {
  /* ---------------- CMS data ---------------- */
  const { data: siteConfigRes } = useGetSiteConfigQuery()
  const { data: tickerRes } = useGetTickerItemsQuery()
  const { data: heroRes } = useGetHeroQuery()
  const { data: storyRes } = useGetStoryQuery()
  const { data: dishesRes, isLoading: dishesLoading } = useGetFeaturedDishesQuery()
  const { data: featuresRes } = useGetFeaturesQuery()
  const { data: galleryRes, isLoading: galleryLoading } = useGetGalleryItemsQuery()
  const { data: reviewsRes } = useGetReviewsQuery()
  const { data: hoursRes } = useGetOpeningHoursQuery()
  const { data: locationRes } = useGetLocationQuery()
  const { data: faqRes } = useGetFaqItemsQuery()
  const { data: reservationConfigRes } = useGetReservationConfigQuery()

  /* ---------------- Menu data (categories + items) ---------------- */
  const { data: categoriesRes, isLoading: categoriesLoading } = useGetCategoriesQuery({ is_active: true })
  const categories = useMemo(
    () => (categoriesRes?.data || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [categoriesRes]
  )
  const [activeCategoryId, setActiveCategoryId] = useState(null)
  useEffect(() => {
    if (!activeCategoryId && categories.length > 0) setActiveCategoryId(categories[0].id)
  }, [categories, activeCategoryId])

  const { data: itemsRes, isLoading: itemsLoading } = useGetItemsQuery(
    activeCategoryId ? { category_id: activeCategoryId } : undefined,
    { skip: !activeCategoryId }
  )
  const menuItems = useMemo(() => itemsRes?.data || [], [itemsRes])
  const topOrderCount = useMemo(
    () => menuItems.reduce((max, i) => Math.max(max, i.order_count_30d || 0), 0),
    [menuItems]
  )

  /* ---------------- Reservation ---------------- */
  const [createReservation, { isLoading: reserving }] = useCreateReservationMutation()

  /* ---------------- derived CMS values ---------------- */
  const siteConfig = siteConfigRes?.data || {}
  const brandName = siteConfig.brand_name || 'Banglawok Kitchen'
  const timezone = siteConfig.timezone || 'Asia/Dhaka'
  const primaryColor = siteConfig.primary_color || '#FF6A3D'

  const tickerItems = tickerRes?.data || []

  const hero = heroRes?.data || {}
  const heroPrimaryWord = hero.headline_primary || 'BANGLA'
  const heroAccentWord = hero.headline_accent || 'WOK'
  const heroSecondaryLine = hero.headline_secondary || 'KITCHEN'
  const heroSubheadline = hero.subheadline ||
    'Home-style Bangladeshi cooking, run like a control room, plated like a family kitchen.'
  const heroCtaPrimary = hero.cta_primary_text || 'Reserve a table'
  const heroCtaSecondary = hero.cta_secondary_text || 'View menu'
  const heroStats = [
    { icon: Star, value: hero.stat_rating || '—', label: 'Rating' },
    { icon: Users, value: hero.stat_reviews || '—', label: 'Reviews' },
    { icon: Clock, value: hero.stat_years || '—', label: 'Serving Dhaka' },
  ]

  const story = storyRes?.data || {}
  const storyStats = story.stats || []
  const storyParagraphs = story.body_paragraphs || (story.body ? [story.body] : [])

  const dishes = dishesRes?.data || []
  const features = (featuresRes?.data || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const galleryItems = galleryRes?.data || []
  const galleryFilters = useMemo(() => {
    const cats = Array.from(new Set(galleryItems.map((g) => g.category).filter(Boolean)))
    return ['All', ...cats]
  }, [galleryItems])
  const [galleryFilter, setGalleryFilter] = useState('All')
  const filteredGallery = galleryFilter === 'All' ? galleryItems : galleryItems.filter((g) => g.category === galleryFilter)

  const reviews = reviewsRes?.data || []

  const hours = (hoursRes?.data || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const location = locationRes?.data || {}

  const faqs = (faqRes?.data || []).slice().sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))

  const reservationConfig = reservationConfigRes?.data || {}
  const timeSlots = reservationConfig.time_slots || []
  const maxPartySize = reservationConfig.max_party_size || 12
  const holdMinutes = reservationConfig.hold_duration_minutes ?? 15
  const tablesAvailable = reservationConfig.tables_available

  /* ---------------- UI state ---------------- */
  const [now, setNow] = useState(new Date())
  const [scrolled, setScrolled] = useState(false)
  const [openFaq, setOpenFaq] = useState(0)

  const [party, setParty] = useState(2)
  const [slot, setSlot] = useState('')
  const [date, setDate] = useState('')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [confirmationCode, setConfirmationCode] = useState('')
  const [reserveError, setReserveError] = useState('')

  useEffect(() => {
    if (!slot && timeSlots.length > 0) setSlot(timeSlots[0])
  }, [timeSlots, slot])

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    window.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const timeStr = now.toLocaleTimeString('en-GB', { hour12: false, timeZone: timezone })
  const todayDow = now.getDay()

  async function handleReserve(e) {
    e.preventDefault()
    if (!date || !name || !phone || !slot) return
    setReserveError('')
    try {
      const reserved_at = new Date(`${date} ${slot}`).toISOString()
      const result = await createReservation({
        party_size: party,
        reserved_at,
        customer_name: name,
        customer_phone: phone,
        notes: '',
        status: 'pending',
      }).unwrap()
      setConfirmationCode(result?.data?.id ? `BWK-${String(result.data.id).slice(-4).toUpperCase()}` : `BWK-${Math.floor(1000 + Math.random() * 9000)}`)
      setSubmitted(true)
    } catch (err) {
      setReserveError('We could not confirm that reservation — please try again or call us directly.')
    }
  }

  return (
    <div
      className="min-h-screen bg-[#0A0B0D] text-[#F3EFE4] antialiased selection:bg-[#FF6A3D] selection:text-[#0A0B0D]"
      style={{ fontFamily: "'Inter', sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');
        .font-display { font-family: 'Space Grotesk', sans-serif; }
        .font-mono-ui { font-family: 'JetBrains Mono', monospace; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
        .animate-marquee { animation: marquee 32s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .animate-marquee { animation: none; } }
        @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(220%); } }
        .animate-scanline { animation: scanline 5s linear infinite; }
        .grid-bg {
          background-image: linear-gradient(#F3EFE4 1px, transparent 1px), linear-gradient(90deg, #F3EFE4 1px, transparent 1px);
          background-size: 44px 44px;
        }
        .ticket-edge {
          background-image: radial-gradient(circle at 6px 6px, #0A0B0D 6px, transparent 6.5px);
          background-size: 16px 16px;
          background-position: -2px 0;
        }
      `}</style>

      {/* ============================ STICKY NAV ============================ */}
      <motion.header
        initial={{ y: -72, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: EASE }}
        className={`fixed top-0 inset-x-0 z-40 backdrop-blur-md transition-all duration-300 ${scrolled ? 'bg-[#0A0B0D]/85 border-b border-[#F3EFE4]/10 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.6)]' : 'bg-[#0A0B0D]/40 border-b border-transparent'
          }`}
      >
        <div className="max-w-7xl mx-auto px-6 lg:px-10 h-16 flex items-center justify-between">
          <a href="#home" className="flex items-center gap-2.5">
            {siteConfig.logo ? (
              <img src={siteConfig.logo} alt={brandName} className="w-6 h-6 rounded-full object-cover" />
            ) : (
              <span className="w-2 h-2 rounded-full shadow-[0_0_10px_currentColor] animate-pulse" style={{ backgroundColor: '#33F2D0', color: '#33F2D0' }} />
            )}
            <span className="font-display font-bold tracking-wide text-sm uppercase">{brandName}</span>
          </a>
          <nav className="hidden md:flex items-center gap-8 text-[13px] font-medium text-[#F3EFE4]/60">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="relative hover:text-[#F3EFE4] transition-colors group">
                {l.label}
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-[#FF6A3D] transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>
          <motion.a
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            href="#reserve"
            className="font-mono-ui text-[11px] px-4 py-2 rounded-full border transition-colors"
            style={{ borderColor: `${primaryColor}66`, color: primaryColor }}
          >
            RESERVE →
          </motion.a>
        </div>
      </motion.header>

      {/* ============================ HERO ============================ */}
      <section id="home" className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 grid-bg opacity-[0.05]" />
        <motion.div
          className="absolute -top-40 left-1/2 -translate-x-1/2 w-[900px] h-[900px] rounded-full bg-[#FF6A3D]/10 blur-[140px]"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-[#33F2D0]/10 blur-[120px]" />

        <motion.div
          className="relative max-w-7xl mx-auto px-6 lg:px-10 pt-24 pb-28 flex flex-col items-center text-center"
          initial="hidden"
          animate="visible"
          variants={staggerContainer(0.12, 0.1)}
        >
          <motion.div
            variants={fadeUp}
            className="font-mono-ui text-[11px] tracking-[0.25em] text-[#33F2D0] flex items-center gap-2 mb-8 px-4 py-1.5 rounded-full border border-[#33F2D0]/25 bg-[#33F2D0]/5"
          >
            <Radio size={12} className="animate-pulse" />
            KITCHEN OS — LIVE · {timeStr} {siteConfig.timezone_label || 'GMT+6'}
          </motion.div>

          <motion.h1 variants={fadeUp} className="font-display font-bold leading-[0.92] text-[15vw] sm:text-[9vw] lg:text-[6.5vw]">
            <span className="block">{heroPrimaryWord}<span style={{ color: primaryColor }}>{heroAccentWord}</span></span>
            <span className="block text-[#F3EFE4]/25">{heroSecondaryLine}</span>
          </motion.h1>

          <motion.p variants={fadeUp} className="mt-8 max-w-xl text-[15px] sm:text-base text-[#F3EFE4]/60 leading-relaxed">
            {heroSubheadline}
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row items-center gap-4">
            <a href="#reserve"><GlowButton variant="primary">{heroCtaPrimary}</GlowButton></a>
            <a href="#menu"><GlowButton variant="ghost" icon={ChevronDown}>{heroCtaSecondary}</GlowButton></a>
          </motion.div>

          <motion.div variants={staggerContainer(0.1, 0)} className="mt-16 grid grid-cols-3 gap-10 sm:gap-16">
            {heroStats.map(({ icon: Icon, value, label }) => (
              <motion.div variants={scaleIn} key={label} className="flex flex-col items-center gap-1.5">
                <Icon size={14} className="text-[#FF6A3D]" />
                <span className="font-mono-ui font-semibold text-lg">{value}</span>
                <span className="text-[10px] tracking-widest uppercase text-[#F3EFE4]/40">{label}</span>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </section>

      {/* ===================== LIVE ANNOUNCEMENTS ===================== */}
      {tickerItems.length > 0 && (
        <section className="relative border-y border-[#F3EFE4]/8 bg-[#12141A]/80 backdrop-blur-md overflow-hidden">
          <div className="flex whitespace-nowrap py-3 animate-marquee">
            {[0, 1].map((rep) => (
              <div key={rep} className="flex items-center shrink-0">
                {tickerItems.map((item, i) => (
                  <span key={`${rep}-${item.id || i}`} className="flex items-center font-mono-ui text-[12px] tracking-wide text-[#F3EFE4]/70 px-8">
                    <span className="w-1.5 h-1.5 rounded-full mr-3" style={{ backgroundColor: item.dot_color || '#FF6A3D' }} />
                    {item.text}
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ===================== INFO & VIBE (SPLIT) ===================== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-28 grid lg:grid-cols-2 gap-16 items-center">
        <Reveal variants={staggerContainer()}>
          <SectionEyebrow color="#F2A93B">SYSTEM STATUS</SectionEyebrow>
          <motion.div variants={staggerContainer(0.08, 0)} className="grid grid-cols-2 gap-4">
            {storyStats.map((s) => (
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -4, borderColor: 'rgba(255,106,61,0.4)' }}
                key={s.label}
                className="relative p-5 rounded-xl bg-[#12141A] border border-[#F3EFE4]/8 overflow-hidden"
              >
                <span className="absolute left-0 top-0 bottom-0 w-[3px] bg-[#FF6A3D] shadow-[0_0_12px_#FF6A3D]" />
                <p className="font-mono-ui font-semibold text-3xl">{s.value}</p>
                <p className="mt-1 text-[11px] uppercase tracking-wider text-[#F3EFE4]/45">{s.label}</p>
              </motion.div>
            ))}
          </motion.div>
        </Reveal>

        <Reveal variants={staggerContainer()}>
          <SectionEyebrow color="#33F2D0">THE STORY</SectionEyebrow>
          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl leading-tight mb-5">
            {story.heading || "A mother's recipe book, running on a modern kitchen."}
          </motion.h2>
          {storyParagraphs.map((p, i) => (
            <motion.p variants={fadeUp} key={i} className="text-[#F3EFE4]/60 leading-relaxed mb-4">{p}</motion.p>
          ))}
          {story.read_more_link && (
            <motion.a
              variants={fadeUp}
              whileHover={{ gap: '0.75rem' }}
              href={story.read_more_link}
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#FF6A3D] transition-all"
            >
              {story.read_more_text || 'Read the full story'} <ArrowRight size={15} />
            </motion.a>
          )}
        </Reveal>
      </section>

      {/* ===================== SIGNATURE DISHES ===================== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <Reveal className="text-center mb-12">
          <SectionEyebrow color="#F2A93B">CHEF'S SIGNATURE</SectionEyebrow>
          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl">Dishes we're known for</motion.h2>
        </Reveal>

        {dishesLoading ? (
          <div className="flex justify-center py-10"><InlineSpinner /></div>
        ) : (
          <Reveal as="div" variants={staggerContainer(0.1, 0)} className="grid md:grid-cols-3 gap-6" viewportAmount={0.1}>
            {dishes.map((d, i) => {
              const grad = gradientFor(i)
              return (
                <motion.div
                  variants={fadeUp}
                  whileHover={{ y: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  key={d.id || d.name}
                  className="group rounded-2xl overflow-hidden bg-[#12141A] border border-[#F3EFE4]/8 hover:border-[#FF6A3D]/40 transition-colors duration-300 hover:shadow-[0_0_45px_-15px_#FF6A3D]"
                >
                  <div
                    className="relative aspect-[16/11] overflow-hidden"
                    style={!d.image_url ? { background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` } : {}}
                  >
                    {d.image_url && (
                      <img
                        src={d.image_url}
                        alt={d.name}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-[#0A0B0D]/20 group-hover:bg-[#0A0B0D]/5 transition-colors" />
                    <div className="absolute inset-3 border border-[#F3EFE4]/25 rounded-xl" />
                    {!d.image_url && <Camera size={20} className="absolute top-5 left-5 text-[#F3EFE4]/70" />}
                    {d.badge && (
                      <span className="absolute top-5 right-5 px-2.5 py-1 rounded-full bg-[#0A0B0D]/60 backdrop-blur-sm text-[10px] font-bold uppercase tracking-wide text-[#F3EFE4]">
                        {d.badge}
                      </span>
                    )}
                  </div>
                  <div className="p-6">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <h3 className="font-display font-bold text-xl leading-snug">{d.name}</h3>
                      <span className="font-mono-ui font-semibold text-[#FF6A3D] text-lg shrink-0">৳{d.price}</span>
                    </div>
                    <StarRow rating={d.rating || 0} />
                    <p className="mt-3 text-[13px] text-[#F3EFE4]/50 leading-relaxed">{d.description}</p>
                  </div>
                </motion.div>
              )
            })}
          </Reveal>
        )}
      </section>

      {/* ===================== WHY CHOOSE US ===================== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <Reveal className="text-center mb-12">
          <SectionEyebrow color="#33F2D0">WHY CHOOSE US</SectionEyebrow>
          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl">Built for a great table, every time</motion.h2>
        </Reveal>

        <Reveal variants={staggerContainer(0.07, 0)} className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5" viewportAmount={0.1}>
          {features.map((f) => {
            const Icon = iconFor(f.icon)
            return (
              <motion.div
                variants={fadeUp}
                whileHover={{ y: -5, borderColor: 'rgba(51,242,208,0.3)' }}
                key={f.id || f.title}
                className="rounded-xl bg-[#12141A] border border-[#F3EFE4]/8 p-6 text-center transition-colors"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                  className="w-11 h-11 mx-auto mb-4 rounded-full bg-[#33F2D0]/10 border border-[#33F2D0]/25 flex items-center justify-center"
                >
                  <Icon size={18} className="text-[#33F2D0]" />
                </motion.div>
                <h3 className="font-display font-semibold text-[14px] mb-2">{f.title}</h3>
                <p className="text-[12px] text-[#F3EFE4]/45 leading-relaxed">{f.description}</p>
              </motion.div>
            )
          })}
        </Reveal>
      </section>

      {/* ===================== INTERACTIVE MENU ===================== */}
      <section id="menu" className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <SectionEyebrow color="#F2A93B">TONIGHT'S ORDER TICKET</SectionEyebrow>
            <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl">Menu highlights</motion.h2>
          </div>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
            {categoriesLoading ? (
              <InlineSpinner />
            ) : (
              categories.map((cat) => (
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={`px-4 py-2 rounded-full text-[12px] font-semibold tracking-wide uppercase transition-colors border ${activeCategoryId === cat.id
                    ? 'bg-[#FF6A3D] text-[#0A0B0D] border-[#FF6A3D]'
                    : 'border-[#F3EFE4]/15 text-[#F3EFE4]/50 hover:text-[#F3EFE4] hover:border-[#F3EFE4]/30'
                    }`}
                >
                  {cat.name}
                </motion.button>
              ))
            )}
          </motion.div>
        </Reveal>

        {itemsLoading ? (
          <div className="flex justify-center py-10"><InlineSpinner /></div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategoryId || 'none'}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={staggerContainer(0.06, 0)}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5"
            >
              {menuItems.map((item) => {
                const isPopular = topOrderCount > 0 && item.order_count_30d === topOrderCount
                return (
                  <motion.div
                    variants={fadeUp}
                    whileHover={{ y: -5 }}
                    transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                    key={item.id}
                    className={`group relative rounded-xl bg-[#12141A] border border-[#F3EFE4]/8 p-5 pb-6 transition-colors duration-300 hover:border-[#FF6A3D]/40 hover:shadow-[0_0_35px_-12px_#FF6A3D] ${item.is_available === false ? 'opacity-50' : ''
                      }`}
                  >
                    {isPopular && (
                      <span className="absolute -top-2.5 left-5 px-2.5 py-0.5 rounded-full bg-[#F2A93B] text-[#0A0B0D] text-[10px] font-bold uppercase tracking-wide">
                        Chef's pick
                      </span>
                    )}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-display font-semibold text-[15px] leading-snug">{item.name}</h3>
                      {item.is_available === false && (
                        <span className="text-[10px] uppercase tracking-wide text-[#F3EFE4]/35">Sold out</span>
                      )}
                    </div>
                    <p className="text-[13px] text-[#F3EFE4]/50 leading-relaxed mb-5 min-h-[54px]">{item.description}</p>
                    <div className="flex items-center justify-between border-t border-dashed border-[#F3EFE4]/15 pt-3">
                      <span className="font-mono-ui text-[11px] text-[#F3EFE4]/35">ITEM #{String(item.id).slice(-4)}</span>
                      <span className="font-mono-ui font-semibold text-[#FF6A3D]">৳{item.base_price}</span>
                    </div>
                    <div className="h-[3px] w-full ticket-edge mt-4 opacity-30" />
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* ===================== GALLERY ===================== */}
      <section id="gallery" className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <Reveal className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
          <div>
            <SectionEyebrow color="#33F2D0">FROM THE FLOOR</SectionEyebrow>
            <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl">Gallery</motion.h2>
          </div>
          <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
            {galleryFilters.map((f) => (
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                key={f}
                onClick={() => setGalleryFilter(f)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] font-semibold tracking-wide uppercase transition-colors border ${galleryFilter === f
                  ? 'bg-[#33F2D0] text-[#0A0B0D] border-[#33F2D0]'
                  : 'border-[#F3EFE4]/15 text-[#F3EFE4]/50 hover:text-[#F3EFE4]'
                  }`}
              >
                {f}
              </motion.button>
            ))}
          </motion.div>
        </Reveal>

        {galleryLoading ? (
          <div className="flex justify-center py-10"><InlineSpinner /></div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={galleryFilter}
              initial="hidden"
              animate="visible"
              exit="hidden"
              variants={staggerContainer(0.05, 0)}
              className="grid grid-cols-2 md:grid-cols-3 gap-4"
            >
              {filteredGallery.map((g, i) => {
                const grad = gradientFor(i)
                return (
                  <motion.div
                    variants={scaleIn}
                    whileHover={{ scale: 1.03 }}
                    key={g.id || i}
                    className="group relative aspect-[4/3] rounded-xl overflow-hidden border border-[#F3EFE4]/10"
                    style={!g.image_url ? { background: `linear-gradient(135deg, ${grad.from}, ${grad.to})` } : {}}
                  >
                    {g.image_url && (
                      <img
                        src={g.image_url}
                        alt={g.caption || `Gallery ${i + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    )}
                    <div className="absolute inset-0 bg-[#0A0B0D]/25 group-hover:bg-[#0A0B0D]/10 transition-colors" />
                    <div className="absolute inset-3 border border-[#F3EFE4]/25 rounded-lg" />
                    {!g.image_url && <Camera size={18} className="absolute top-5 left-5 text-[#F3EFE4]/70" />}
                    <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
                      <span className="font-mono-ui text-[10px] text-[#F3EFE4]/70">{g.filename_label || `IMG_${i}`}</span>
                      <span className="font-display text-[13px] font-semibold text-[#F3EFE4] text-right">{g.caption}</span>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </AnimatePresence>
        )}
      </section>

      {/* ===================== TESTIMONIALS ===================== */}
      <section id="reviews" className="max-w-7xl mx-auto px-6 lg:px-10 py-24">
        <Reveal className="text-center mb-12">
          <SectionEyebrow color="#F2A93B">GUEST LOGS</SectionEyebrow>
          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl">What tonight's tables are saying</motion.h2>
        </Reveal>

        <Reveal variants={staggerContainer(0.09, 0)} className="grid sm:grid-cols-2 gap-5" viewportAmount={0.1}>
          {reviews.map((t) => (
            <motion.div
              variants={fadeUp}
              whileHover={{ y: -4, borderColor: 'rgba(242,169,59,0.3)' }}
              key={t.id || t.handle}
              className="relative rounded-xl bg-[#12141A] border border-[#F3EFE4]/8 p-6 transition-colors"
            >
              <Quote size={20} className="text-[#F2A93B]/40 mb-3" />
              <p className="text-[14px] text-[#F3EFE4]/75 leading-relaxed mb-5">{t.quote}</p>
              <div className="flex items-center justify-between pt-4 border-t border-[#F3EFE4]/8">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#FF6A3D] to-[#F2A93B] flex items-center justify-center font-display font-bold text-[11px] text-[#0A0B0D]">
                    {(t.author_name || '').split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="text-[12px] font-semibold text-[#F3EFE4]/85">{t.author_name}</p>
                    <p className="font-mono-ui text-[10px] text-[#F3EFE4]/35">{t.handle} · {t.visit_count} visits</p>
                  </div>
                </div>
                <StarRow rating={t.rating || 0} />
              </div>
            </motion.div>
          ))}
        </Reveal>
      </section>

      {/* ===================== OPENING HOURS ===================== */}
      <section className="max-w-5xl mx-auto px-6 lg:px-10 py-24">
        <Reveal className="text-center mb-12">
          <SectionEyebrow color="#33F2D0">KITCHEN SCHEDULE</SectionEyebrow>
          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl">Opening hours</motion.h2>
        </Reveal>

        <Reveal variants={staggerContainer(0.05, 0)} className="rounded-2xl bg-[#12141A] border border-[#F3EFE4]/8 divide-y divide-[#F3EFE4]/8 overflow-hidden">
          {hours.map((h) => {
            const isToday = h.is_today ?? (Array.isArray(h.days_of_week) ? h.days_of_week.includes(todayDow) : h.day_of_week === todayDow)
            const timeLabel = h.is_closed ? 'Closed' : `${h.open_time} – ${h.close_time}`
            return (
              <motion.div
                variants={fadeUp}
                key={h.id || h.day_label}
                className={`flex items-center justify-between px-6 sm:px-8 py-5 ${isToday ? 'bg-[#FF6A3D]/5' : ''}`}
              >
                <div className="flex items-center gap-3">
                  {isToday && (
                    <motion.span
                      className="w-1.5 h-1.5 rounded-full bg-[#FF6A3D] shadow-[0_0_8px_#FF6A3D]"
                      animate={{ scale: [1, 1.4, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}
                  <span className="font-display font-semibold text-[15px]">{h.day_label}</span>
                  {isToday && (
                    <span className="font-mono-ui text-[10px] px-2 py-0.5 rounded-full border border-[#FF6A3D]/40 text-[#FF6A3D] uppercase tracking-wide">Today</span>
                  )}
                </div>
                <span className={`font-mono-ui text-sm ${h.is_closed ? 'text-[#F3EFE4]/35' : 'text-[#F3EFE4]/70'}`}>{timeLabel}</span>
              </motion.div>
            )
          })}
        </Reveal>
      </section>

      {/* ===================== LOCATION ===================== */}
      <section className="max-w-7xl mx-auto px-6 lg:px-10 py-24 grid lg:grid-cols-2 gap-10 items-stretch">
        <Reveal variants={staggerContainer()}>
          <SectionEyebrow color="#F2A93B">FIND US</SectionEyebrow>
          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl mb-6">Visit the restaurant</motion.h2>

          <motion.div variants={staggerContainer(0.08, 0)} className="space-y-5">
            <motion.div variants={fadeUp} className="flex items-start gap-3">
              <MapPin size={17} className="text-[#FF6A3D] mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-[#F3EFE4]/85">Address</p>
                <p className="text-[13px] text-[#F3EFE4]/50">{location.address}</p>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="flex items-start gap-3">
              <Car size={17} className="text-[#FF6A3D] mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-[#F3EFE4]/85">Parking</p>
                <p className="text-[13px] text-[#F3EFE4]/50">{location.parking_info}</p>
              </div>
            </motion.div>
            <motion.div variants={fadeUp} className="flex items-start gap-3">
              <Clock size={17} className="text-[#FF6A3D] mt-0.5 shrink-0" />
              <div>
                <p className="text-[13px] font-semibold text-[#F3EFE4]/85">Hours today</p>
                <p className="text-[13px] text-[#F3EFE4]/50">
                  {(() => {
                    const today = hours.find((h) => (h.is_today ?? (Array.isArray(h.days_of_week) ? h.days_of_week.includes(todayDow) : h.day_of_week === todayDow)))
                    if (!today) return '—'
                    return today.is_closed ? 'Closed' : `${today.open_time} – ${today.close_time}`
                  })()}
                </p>
              </div>
            </motion.div>
          </motion.div>

          <motion.div variants={fadeUp} className="flex flex-wrap gap-3 mt-8">
            <motion.a
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              href={`tel:${location.phone || ''}`}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#FF6A3D] text-[#0A0B0D] font-semibold text-[13px] uppercase tracking-wide hover:shadow-[0_0_35px_-8px_#FF6A3D] transition-shadow"
            >
              <PhoneCall size={14} /> Call now
            </motion.a>
            <motion.a
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.96 }}
              href={location.directions_url || '#'}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[#33F2D0]/40 text-[#33F2D0] font-semibold text-[13px] uppercase tracking-wide hover:bg-[#33F2D0]/10 transition-colors"
            >
              <Navigation size={14} /> Get directions
            </motion.a>
          </motion.div>
        </Reveal>

        <Reveal variants={scaleIn} className="relative rounded-2xl overflow-hidden border border-[#F3EFE4]/10 min-h-[320px] bg-[#12141A]">
          <div className="absolute inset-0 grid-bg opacity-[0.12]" />
          <div className="absolute inset-0 bg-gradient-to-br from-[#33F2D0]/10 to-transparent" />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <motion.div
              className="w-11 h-11 rounded-full bg-[#FF6A3D] flex items-center justify-center shadow-[0_0_30px_-4px_#FF6A3D]"
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
            >
              <MapPin size={20} className="text-[#0A0B0D]" />
            </motion.div>
            <p className="font-display font-semibold text-sm">{location.address ? location.address.split(',').slice(-2).join(',').trim() : '—'}</p>
            {location.lat != null && location.lng != null && (
              <p className="font-mono-ui text-[11px] text-[#F3EFE4]/40">{location.lat}° N, {location.lng}° E</p>
            )}
          </div>
          <span className="absolute bottom-4 right-4 font-mono-ui text-[10px] px-2.5 py-1 rounded-full bg-[#0A0B0D]/60 backdrop-blur-sm text-[#F3EFE4]/50">MAP PREVIEW</span>
        </Reveal>
      </section>

      {/* ===================== FAQ ===================== */}
      <section className="max-w-3xl mx-auto px-6 lg:px-10 py-24">
        <Reveal className="text-center mb-12">
          <SectionEyebrow color="#33F2D0">FAQ</SectionEyebrow>
          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl">Good to know</motion.h2>
        </Reveal>

        <Reveal variants={staggerContainer(0.06, 0)} className="space-y-3">
          {faqs.map((f, i) => {
            const open = openFaq === i
            return (
              <motion.div variants={fadeUp} key={f.id || f.question} className="rounded-xl bg-[#12141A] border border-[#F3EFE4]/8 overflow-hidden">
                <button
                  onClick={() => setOpenFaq(open ? -1 : i)}
                  className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                >
                  <span className="font-display font-semibold text-[14px]">{f.question}</span>
                  <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease: EASE }}>
                    {open ? (
                      <ChevronUp size={16} className="text-[#FF6A3D] shrink-0" />
                    ) : (
                      <ChevronDown size={16} className="text-[#F3EFE4]/40 shrink-0" />
                    )}
                  </motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      key="content"
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-[13px] text-[#F3EFE4]/55 leading-relaxed">{f.answer}</div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </Reveal>
      </section>

      {/* ===================== RESERVATION ENGINE ===================== */}
      <section id="reserve" className="relative max-w-5xl mx-auto px-6 lg:px-10 py-24">
        <div className="absolute -inset-x-20 top-10 h-[400px] bg-[#FF6A3D]/5 blur-[120px] -z-10" />
        <Reveal className="text-center mb-12">
          <SectionEyebrow color="#F2A93B">INSTANT RESERVATION</SectionEyebrow>
          <motion.h2 variants={fadeUp} className="font-display font-bold text-3xl sm:text-4xl mb-3">Book your table</motion.h2>
          {tablesAvailable != null && (
            <motion.p variants={fadeUp} className="font-mono-ui text-[12px] text-[#33F2D0]">{tablesAvailable} TABLES AVAILABLE TONIGHT</motion.p>
          )}
        </Reveal>

        <Reveal variants={scaleIn} className="relative rounded-2xl bg-[#12141A] border border-[#F3EFE4]/10 p-6 sm:p-10 overflow-hidden">
          <div className="absolute top-0 left-8 right-8 h-[2px] overflow-hidden opacity-40">
            <span className="block h-full w-1/3 bg-gradient-to-r from-transparent via-[#33F2D0] to-transparent animate-scanline" />
          </div>

          <AnimatePresence mode="wait">
            {submitted ? (
              <motion.div
                key="confirmation"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: EASE }}
                className="flex flex-col items-center text-center py-10"
              >
                <motion.div
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, damping: 16, delay: 0.1 }}
                >
                  <CheckCircle2 size={40} className="text-[#33F2D0] mb-4" />
                </motion.div>
                <h3 className="font-display font-bold text-2xl mb-2">Reservation confirmed</h3>
                <p className="text-[#F3EFE4]/55 mb-6 max-w-sm">
                  Table for {party}, {date || 'today'} at {slot}. A confirmation text is on its way to {phone}.
                </p>
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25, duration: 0.4 }}
                  className="font-mono-ui text-sm px-5 py-2.5 rounded-full border border-dashed border-[#33F2D0]/40 text-[#33F2D0] mb-8"
                >
                  CONFIRMATION {confirmationCode}
                </motion.div>
                <button
                  onClick={() => { setSubmitted(false); setDate(''); setName(''); setPhone('') }}
                  className="text-[13px] font-semibold text-[#F3EFE4]/50 hover:text-[#F3EFE4] transition-colors"
                >
                  Make another reservation
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                transition={{ duration: 0.4, ease: EASE }}
                onSubmit={handleReserve}
                className="grid sm:grid-cols-2 gap-6"
              >
                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#F3EFE4]/45 mb-2">Date</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full bg-[#0A0B0D] border border-[#F3EFE4]/15 rounded-lg px-4 py-3 text-sm text-[#F3EFE4] focus:outline-none focus:border-[#33F2D0] focus:shadow-[0_0_0_3px_rgba(51,242,208,0.15)] transition-all [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#F3EFE4]/45 mb-2">Party size</label>
                  <div className="flex items-center justify-between bg-[#0A0B0D] border border-[#F3EFE4]/15 rounded-lg px-4 py-2.5">
                    <motion.button whileTap={{ scale: 0.85 }} type="button" onClick={() => setParty((p) => Math.max(1, p - 1))} className="text-[#F3EFE4]/60 hover:text-[#FF6A3D] transition-colors">
                      <Minus size={16} />
                    </motion.button>
                    <span className="font-mono-ui font-semibold text-sm">{party} {party === 1 ? 'guest' : 'guests'}</span>
                    <motion.button whileTap={{ scale: 0.85 }} type="button" onClick={() => setParty((p) => Math.min(maxPartySize, p + 1))} className="text-[#F3EFE4]/60 hover:text-[#FF6A3D] transition-colors">
                      <Plus size={16} />
                    </motion.button>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] uppercase tracking-wider text-[#F3EFE4]/45 mb-2">Time</label>
                  <div className="flex flex-wrap gap-2">
                    {timeSlots.map((t) => (
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        type="button"
                        key={t}
                        onClick={() => setSlot(t)}
                        className={`font-mono-ui text-[12px] px-3.5 py-2 rounded-lg border transition-colors ${slot === t
                          ? 'bg-[#FF6A3D] text-[#0A0B0D] border-[#FF6A3D]'
                          : 'border-[#F3EFE4]/15 text-[#F3EFE4]/55 hover:border-[#F3EFE4]/35'
                          }`}
                      >
                        {t}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#F3EFE4]/45 mb-2">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your full name"
                    required
                    className="w-full bg-[#0A0B0D] border border-[#F3EFE4]/15 rounded-lg px-4 py-3 text-sm placeholder:text-[#F3EFE4]/25 focus:outline-none focus:border-[#33F2D0] focus:shadow-[0_0_0_3px_rgba(51,242,208,0.15)] transition-all"
                  />
                </div>

                <div>
                  <label className="block text-[11px] uppercase tracking-wider text-[#F3EFE4]/45 mb-2">Phone</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01XXX-XXXXXX"
                    required
                    className="w-full bg-[#0A0B0D] border border-[#F3EFE4]/15 rounded-lg px-4 py-3 text-sm placeholder:text-[#F3EFE4]/25 focus:outline-none focus:border-[#33F2D0] focus:shadow-[0_0_0_3px_rgba(51,242,208,0.15)] transition-all"
                  />
                </div>

                <div className="sm:col-span-2">
                  <AnimatePresence>
                    {reserveError && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[12px] text-[#FF6A3D] mb-3"
                      >
                        {reserveError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[11px] text-[#F3EFE4]/35 max-w-[220px]">We hold tables for {holdMinutes} minutes past reservation time.</p>
                    <motion.button
                      whileHover={{ y: reserving ? 0 : -2 }}
                      whileTap={{ scale: reserving ? 1 : 0.96 }}
                      type="submit"
                      disabled={reserving}
                      className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-semibold text-[13px] uppercase tracking-wide bg-[#FF6A3D] text-[#0A0B0D] hover:shadow-[0_0_40px_-6px_#FF6A3D] transition-shadow disabled:opacity-50"
                    >
                      {reserving ? (
                        <>
                          <Loader2 size={15} className="animate-spin" /> Confirming…
                        </>
                      ) : (
                        <>
                          Confirm reservation <ArrowRight size={15} />
                        </>
                      )}
                    </motion.button>
                  </div>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Reveal>
      </section>

      {/* ============================ FOOTER ============================ */}
      <footer className="border-t border-[#F3EFE4]/8 mt-10">
        <Reveal variants={staggerContainer(0.08, 0)} className="max-w-7xl mx-auto px-6 lg:px-10 py-12 grid sm:grid-cols-3 gap-8">
          <motion.div variants={fadeUp}>
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: '#33F2D0' }} />
              <span className="font-display font-bold text-sm uppercase">{brandName}</span>
            </div>
            <p className="text-[13px] text-[#F3EFE4]/40 leading-relaxed">{siteConfig.tagline || 'Home-style Bangladeshi cooking, since 2014.'}</p>
          </motion.div>
          <motion.div variants={fadeUp} className="flex items-start gap-2 text-[13px] text-[#F3EFE4]/50">
            <MapPin size={14} className="mt-0.5 shrink-0" />
            {location.address}
          </motion.div>
          <motion.div variants={fadeUp} className="flex items-start gap-2 text-[13px] text-[#F3EFE4]/50">
            <Phone size={14} className="mt-0.5 shrink-0" />
            {location.phone}
          </motion.div>
        </Reveal>
        <div className="border-t border-[#F3EFE4]/8 py-5 text-center font-mono-ui text-[10px] text-[#F3EFE4]/25">
          © {new Date().getFullYear()} {brandName.toUpperCase()} — KITCHEN OS v2.4
        </div>
      </footer>
    </div>
  )
}
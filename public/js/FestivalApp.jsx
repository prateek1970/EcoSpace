import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';

// ============================================================================
// PARTICLE ENGINE (Hero Overlay Sparkles)
// ============================================================================
const PARTICLE_COUNT = 40;

const ParticlesOverlay = React.memo(() => {
  const particles = useMemo(() => {
    return Array.from({ length: PARTICLE_COUNT }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 4 + 3,
      delay: Math.random() * 2,
      color: i % 3 === 0 ? '#FF007F' : i % 2 === 0 ? '#39FF14' : '#00F0FF',
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-10 overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            backgroundColor: p.color,
            boxShadow: `0 0 12px ${p.color}, 0 0 24px ${p.color}`,
          }}
          animate={{
            y: ['0px', '-80px', '0px'],
            x: ['0px', `${(p.id % 2 === 0 ? 1 : -1) * 30}px`, '0px'],
            opacity: [0.2, 0.9, 0.2],
            scale: [0.8, 1.6, 0.8],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
});

// ============================================================================
// STATS COUNTER COMPONENT (Scroll Triggered Smooth Counting)
// ============================================================================
const StatCounter = ({ endValue, prefix = "", suffix = "", label, icon }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          let start = 0;
          const duration = 2000;
          const stepTime = 20;
          const steps = duration / stepTime;
          const increment = endValue / steps;

          const timer = setInterval(() => {
            start += increment;
            if (start >= endValue) {
              setCount(endValue);
              clearInterval(timer);
            } else {
              setCount(Math.floor(start));
            }
          }, stepTime);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [endValue, hasAnimated]);

  return (
    <motion.div
      ref={ref}
      whileHover={{ y: -5, scale: 1.03 }}
      className="glass-panel rounded-2xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden group border border-[#FFD2E1]/20 hover:border-[#FF007F]/50 transition-all duration-300"
    >
      <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF007F]/10 rounded-full blur-2xl group-hover:bg-[#39FF14]/20 transition-all duration-500 pointer-events-none" />
      <div className="text-3xl mb-3 text-[#FF007F] group-hover:text-[#39FF14] transition-colors duration-300">
        {icon}
      </div>
      <div className="font-extrabold text-4xl sm:text-5xl text-[#FFD2E1] font-display tracking-wider drop-shadow-[0_0_12px_rgba(255,0,127,0.5)]">
        {prefix}{count.toLocaleString()}{suffix}
      </div>
      <div className="text-xs sm:text-sm font-semibold text-[#F9CBD9] uppercase tracking-widest mt-2">
        {label}
      </div>
    </motion.div>
  );
};

// ============================================================================
// MAIN APPLICATION COMPONENT
// ============================================================================
export default function FestivalApp() {
  const [selectedDay, setSelectedDay] = useState('20 JUNE');
  const [shakingTicketId, setShakingTicketId] = useState(null);
  const [ticketModal, setTicketModal] = useState({ isOpen: false, ticket: null });
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Show floating toast alert
  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Schedule Data
  const scheduleData = {
    '20 JUNE': [
      { id: 1, time: '16:00 - 17:30', artist: 'NEON WAVE COLLECTIVE', stage: 'CYBER ARENA', genre: 'Synthwave / Opening Jam', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=600&q=80', status: 'Upcoming' },
      { id: 2, time: '18:00 - 19:30', artist: 'DREW FEIG & THE VIBES', stage: 'LASER MAIN STAGE', genre: 'Acoustic Electro Rock', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80', status: 'Live Soon' },
      { id: 3, time: '20:00 - 22:00', artist: 'OLIVIA WILSON', stage: 'LASER MAIN STAGE', genre: 'Neon Pop & Vocal Spectacle', img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80', status: 'Headline' },
      { id: 4, time: '22:30 - 01:00', artist: 'CYBER VIBE SESSIONS', stage: 'NEON DOME', genre: 'Deep Bass & Visual Light Show', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=600&q=80', status: 'Afterparty' },
    ],
    '21 JUNE': [
      { id: 5, time: '16:30 - 18:00', artist: 'ACOUSTIC SHADOWS', stage: 'NEON DOME', genre: 'Unplugged Indie Melodies', img: 'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=600&q=80', status: 'Upcoming' },
      { id: 6, time: '18:30 - 20:00', artist: 'RIMBERIO', stage: 'CYBER ARENA', genre: 'Alternative Beat Live', img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80', status: 'Live Soon' },
      { id: 7, time: '20:30 - 23:00', artist: 'ELECTRO BEATS SOUND SYSTEM', stage: 'LASER MAIN STAGE', genre: 'Grand Finale Showcase', img: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80', status: 'Headline' },
      { id: 8, time: '23:30 - 02:00', artist: 'NEON SIREN', stage: 'LASER MAIN STAGE', genre: 'Midnight Laser DJ Set', img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=600&q=80', status: 'Afterparty' },
    ]
  };

  // Ticket Packages Data
  const ticketPackages = [
    {
      id: 'pre-1',
      title: '1st Pre Sale',
      price: '$200',
      status: 'In Stock',
      inStock: true,
      perks: ['Full 2-Day Festival Pass', 'General Admission Access', 'Standard Stage Area', 'Free Festival Wristband'],
      badgeColor: 'bg-[#39FF14] text-[#1D0324]'
    },
    {
      id: 'pre-2',
      title: '2nd Pre Sale',
      price: '$250',
      status: 'In Stock',
      inStock: true,
      perks: ['Full 2-Day Priority Pass', 'Fast-Track Queue Entry', 'Near-Stage Pit Access', 'Exclusive Merch Coupon'],
      badgeColor: 'bg-[#00F0FF] text-[#1D0324]'
    },
    {
      id: 'spot-3',
      title: 'On The Spot',
      price: '$300',
      status: 'Out of Stock',
      inStock: false,
      perks: ['Gate Day Purchase Only', 'Subject to Availability', 'Standard Access Pass', 'High Demand Alert'],
      badgeColor: 'bg-gray-600 text-gray-200'
    },
    {
      id: 'vip-4',
      title: 'VIP Sponsorship Package',
      price: '$500',
      status: 'In Stock',
      inStock: true,
      popular: true,
      perks: ['All Access VIP Skydeck', 'Backstage Artist Lounge Access', 'Unlimited Premium Refreshments', 'Signed Festival Poster & Kit'],
      badgeColor: 'bg-[#FF007F] text-white'
    }
  ];

  // Artist Lineup Data
  const artists = [
    {
      name: 'OLIVIA WILSON',
      role: 'HEADLINE VOCALIST',
      day: '20 JUNE - LASER MAIN STAGE',
      bio: 'Grammy-nominated synth-pop icon known for magnetic vocals and live laser performances.',
      img: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=800&q=80',
      tag: 'POP / SYNTH'
    },
    {
      name: 'DREW FEIG',
      role: 'ACOUSTIC ELECTRO LEAD',
      day: '20 JUNE - LASER MAIN STAGE',
      bio: 'Master of raw acoustic riffs combined with modern electronic soundscapes and ambient loops.',
      img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
      tag: 'ACOUSTIC ROCK'
    },
    {
      name: 'RIMBERIO',
      role: 'CYBER BEAT PRODUCER',
      day: '21 JUNE - CYBER ARENA',
      bio: 'Renowned beat architect delivering bass-heavy improvisational sets and futuristic grooves.',
      img: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=800&q=80',
      tag: 'ELECTRONIC'
    },
    {
      name: 'NEON SIREN',
      role: 'MIDNIGHT LASER DJ',
      day: '21 JUNE - LASER MAIN STAGE',
      bio: 'Pioneering laser light show artist creating immersive multi-sensory midnight rave sets.',
      img: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?auto=format&fit=crop&w=800&q=80',
      tag: 'TECHNO / LIGHTS'
    }
  ];

  // Testimonials Data
  const testimonials = [
    {
      quote: "The visual staging, energy, and crystal-clear acoustics at STUDIO SHOWDE last year was unmatched. An unforgettable experience!",
      author: "Samantha K.",
      role: "Music Journalist",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80"
    },
    {
      quote: "Being on stage surrounded by 200,000 electric fans with laser beams cutting through the air was the peak of my tour.",
      author: "Marcus V.",
      role: "Guest Artist",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80"
    },
    {
      quote: "Everything from the seamless schedule app to the VIP skydeck was executed with pure perfection. 10/10 vibes!",
      author: "Elena Rostova",
      role: "Festival Fanatic",
      avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80"
    }
  ];

  // Handle Ticket Click
  const handleTicketClick = (ticket) => {
    if (!ticket.inStock) {
      setShakingTicketId(ticket.id);
      triggerToast(`⚠️ "${ticket.title}" is currently Out of Stock! Please select an available package.`);
      setTimeout(() => setShakingTicketId(null), 600);
      return;
    }
    setTicketModal({ isOpen: true, ticket });
  };

  // Handle Newsletter Submit
  const handleNewsletter = (e) => {
    e.preventDefault();
    if (!newsletterEmail || !newsletterEmail.includes('@')) {
      triggerToast('⚠️ Please enter a valid email address!');
      return;
    }
    setNewsletterSubmitted(true);
    triggerToast('⚡ Success! You are subscribed to festival VIP announcements.');
    setNewsletterEmail('');
  };

  const titleText = "FESTIVAL";

  return (
    <div className="min-h-screen bg-[#1D0324] text-white selection:bg-[#FF007F] selection:text-white relative">
      
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-3.5 bg-[#350B42] border border-[#FF007F] text-[#FFD2E1] font-semibold rounded-full shadow-[0_0_30px_#FF007F] backdrop-blur-xl flex items-center gap-3 text-sm sm:text-base max-w-[90vw]"
          >
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* --------------------------------------------------------------------------
         1. FLOATING NAVIGATION BAR & HEADER
         -------------------------------------------------------------------------- */}
      <header className="fixed top-0 left-0 w-full z-40 px-4 sm:px-8 py-4 transition-all duration-300">
        <div className="max-w-7xl mx-auto glass-panel rounded-full px-6 py-3 flex items-center justify-between border border-[#FFD2E1]/20 shadow-2xl">
          
          {/* Logo */}
          <a href="#hero" className="flex items-center gap-2 group">
            <span className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#FF007F] to-[#39FF14] flex items-center justify-center text-[#1D0324] font-black text-xl shadow-[0_0_15px_#FF007F] group-hover:scale-110 transition-transform">
              ⚡
            </span>
            <div className="flex flex-col">
              <span className="font-display text-xl sm:text-2xl text-[#FFD2E1] tracking-widest leading-none group-hover:text-[#39FF14] transition-colors">
                STUDIO SHOWDE
              </span>
              <span className="text-[10px] text-[#C994A7] font-mono tracking-wider hidden sm:block">
                MUSIC FESTIVAL 2026
              </span>
            </div>
          </a>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 font-header text-xs tracking-widest text-[#F9CBD9]">
            <a href="#about" className="hover:text-[#FF007F] transition-colors">ABOUT</a>
            <a href="#schedule" className="hover:text-[#FF007F] transition-colors">SCHEDULE</a>
            <a href="#lineup" className="hover:text-[#FF007F] transition-colors">LINEUP</a>
            <a href="#tickets" className="hover:text-[#FF007F] transition-colors">TICKETS</a>
            <a href="#testimonials" className="hover:text-[#FF007F] transition-colors">VIBES</a>
          </nav>

          {/* Header Call to Action */}
          <div className="flex items-center gap-3">
            <a
              href="#tickets"
              className="btn-neon px-5 py-2.5 text-xs sm:text-sm shadow-[0_0_20px_#FF007F] animate-pulse"
            >
              Buy Ticket Now
            </a>
          </div>
        </div>
      </header>

      {/* --------------------------------------------------------------------------
         2. HERO SECTION
         -------------------------------------------------------------------------- */}
      <section id="hero" className="relative min-h-screen w-full flex flex-col items-center justify-center pt-28 pb-16 px-4 overflow-hidden">
        
        {/* Background Image with Dark Vignette */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero_bg.png"
            alt="Festival Stage"
            className="w-full h-full object-cover opacity-35 scale-105 filter blur-[1px] transform animate-pulse-slow"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#1D0324]/80 via-[#1D0324]/60 to-[#1D0324]" />
        </div>

        {/* Ambient Neon Glow Orbs */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#FF007F] opacity-25 blur-[160px] rounded-full pointer-events-none animate-pulse" />
        <div className="absolute top-1/3 left-1/4 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-[#39FF14] opacity-20 blur-[140px] rounded-full pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-[450px] h-[450px] bg-[#00F0FF] opacity-20 blur-[150px] rounded-full pointer-events-none" />

        {/* Floating Sparkles & Fireworks Layer */}
        <ParticlesOverlay />

        {/* Content Box */}
        <div className="relative z-20 max-w-5xl mx-auto text-center flex flex-col items-center">
          
          {/* Subheader Banner */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#350B42]/80 border border-[#FF007F]/40 text-[#F9CBD9] tracking-[0.25em] text-xs sm:text-sm font-header uppercase mb-4 shadow-[0_0_15px_rgba(255,0,127,0.3)]"
          >
            <span className="w-2 h-2 rounded-full bg-[#39FF14] animate-ping" />
            STUDIO SHOWDE PRESENTS • 2026 LIVE EDITION
          </motion.div>

          {/* Massive Display 'FESTIVAL' Title */}
          <div className="relative flex justify-center flex-wrap overflow-hidden py-2 my-2">
            {titleText.split('').map((letter, index) => (
              <motion.span
                key={index}
                initial={{ y: 120, opacity: 0, scale: 0.7 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.08 + 0.2,
                  duration: 0.7,
                  ease: [0.2, 0.65, 0.3, 0.9],
                }}
                whileHover={{
                  scale: 1.18,
                  color: '#39FF14',
                  textShadow: '0 0 25px #39FF14, 0 0 50px #39FF14, 0 0 90px #39FF14',
                  transition: { duration: 0.15 },
                }}
                className="font-display font-extrabold text-7xl sm:text-9xl md:text-[12rem] tracking-tight text-[#FFD2E1] inline-block transform-gpu cursor-pointer px-0.5 sm:px-1"
                style={{
                  textShadow: `
                    0 0 15px rgba(255, 210, 225, 0.8),
                    0 0 30px #FF007F,
                    0 0 60px #FF007F,
                    0 0 100px #FF007F
                  `,
                }}
              >
                {letter}
              </motion.span>
            ))}
          </div>

          {/* Event Details Pill */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            className="mt-4 flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-[#C994A7] font-header text-xs sm:text-base tracking-widest uppercase bg-[#350B42]/60 px-6 py-3 rounded-full border border-[#FFD2E1]/20 shadow-xl"
          >
            <span className="flex items-center gap-1.5 text-white">
              📍 VENUE 123 ANYWHERE ST.
            </span>
            <span className="text-[#FF007F] font-bold">•</span>
            <span className="flex items-center gap-1.5 text-[#39FF14]">
              📅 20–21 JUNE 2026
            </span>
            <span className="text-[#FF007F] font-bold">•</span>
            <span className="text-[#00F0FF]">
              🔊 4 LASER STAGES
            </span>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 1.1 }}
            className="mt-8 flex flex-wrap justify-center items-center gap-4"
          >
            <a
              href="#tickets"
              className="btn-neon px-8 py-4 text-sm sm:text-base shadow-[0_0_30px_#FF007F]"
            >
              Get Your Tickets Now
            </a>
            <a
              href="#schedule"
              className="btn-outline-neon px-8 py-4 text-sm sm:text-base"
            >
              Explore Festival Schedule
            </a>
          </motion.div>

        </div>
      </section>

      {/* --------------------------------------------------------------------------
         3. ABOUT / VISION / GOALS SECTION (With Animated Counter Stats)
         -------------------------------------------------------------------------- */}
      <section id="about" className="py-24 px-4 sm:px-8 relative max-w-7xl mx-auto">
        
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[#39FF14] font-header tracking-[0.3em] text-xs uppercase block mb-2">
            VISION & EXPERIENCE
          </span>
          <h2 className="font-display text-5xl sm:text-7xl text-[#FFD2E1] tracking-wider drop-shadow-[0_0_15px_#FF007F]">
            HIGH ENERGY MUSIC IMMERSION
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#FF007F] to-[#39FF14] mx-auto mt-4 rounded-full" />
        </motion.div>

        {/* 2-Column Staggered Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Card 1: Vision */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-panel rounded-3xl p-8 sm:p-10 border border-[#FFD2E1]/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#FF007F]/10 rounded-full blur-3xl group-hover:bg-[#FF007F]/25 transition-all duration-500" />
            <h3 className="font-header text-2xl sm:text-3xl text-[#FFD2E1] mb-4 flex items-center gap-3">
              <span className="text-3xl text-[#FF007F]">🔥</span>
              EXPLOSIVE FESTIVAL VIBES
            </h3>
            <p className="text-[#F9CBD9] leading-relaxed mb-6 font-body text-sm sm:text-base">
              STUDIO SHOWDE is a multi-genre music festival bringing together the world's most electrifying vocalists, acoustic masters, synth producers, and visual stage artists. Experience two days of non-stop energy across four immersive laser stages.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#FFD2E1]/10 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-[#39FF14]">
                <span>✓</span> 4K Laser Projection
              </div>
              <div className="flex items-center gap-2 text-[#39FF14]">
                <span>✓</span> Dolby Atmos Surround
              </div>
              <div className="flex items-center gap-2 text-[#39FF14]">
                <span>✓</span> Pyrotechnic Light Show
              </div>
              <div className="flex items-center gap-2 text-[#39FF14]">
                <span>✓</span> VIP Skydeck Lounges
              </div>
            </div>
          </motion.div>

          {/* Card 2: Goals */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="glass-panel rounded-3xl p-8 sm:p-10 border border-[#FFD2E1]/20 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-[#39FF14]/10 rounded-full blur-3xl group-hover:bg-[#39FF14]/25 transition-all duration-500" />
            <h3 className="font-header text-2xl sm:text-3xl text-[#FFD2E1] mb-4 flex items-center gap-3">
              <span className="text-3xl text-[#39FF14]">⚡</span>
              THE 2026 BENCHMARK
            </h3>
            <p className="text-[#F9CBD9] leading-relaxed mb-6 font-body text-sm sm:text-base">
              Our mission is to fuse raw acoustic talent with cutting-edge electronic beats and futuristic stage design. From acoustic covers to midnight techno sets, every moment is crafted for peak audio-visual euphoria.
            </p>
            <div className="p-4 rounded-xl bg-[#1D0324]/80 border border-[#FF007F]/30 text-xs text-[#C994A7] font-mono">
              "STUDIO SHOWDE 2026 sets the standard for high-octane live festival production, sound quality, and artist-audience connection."
            </div>
          </motion.div>
        </div>

        {/* Stats Counter Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-12">
          <StatCounter endValue={200000} prefix="+" label="Visitors Attending" icon="👥" />
          <StatCounter endValue={50} prefix="+" label="Headline Artists" icon="🎸" />
          <StatCounter endValue={4} label="Epic Laser Stages" icon="🎪" />
          <StatCounter endValue={99} suffix="%" label="Sound Quality Score" icon="🔊" />
        </div>
      </section>

      {/* --------------------------------------------------------------------------
         4. THE SCHEDULE SECTION (Dynamic Interactive Tabs)
         -------------------------------------------------------------------------- */}
      <section id="schedule" className="py-24 px-4 sm:px-8 relative bg-[#280732]/60">
        <div className="max-w-7xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <span className="text-[#FF007F] font-header tracking-[0.3em] text-xs uppercase block mb-2">
              TIMELINE & SETS
            </span>
            <h2 className="font-display text-5xl sm:text-7xl text-[#FFD2E1] tracking-wider drop-shadow-[0_0_15px_#FF007F]">
              THE SCHEDULE
            </h2>
            <p className="text-[#C994A7] text-sm sm:text-base max-w-xl mx-auto mt-2">
              Choose your festival day to explore set times, stage locations, and performance line-ups.
            </p>
          </motion.div>

          {/* Interactive Day Selection Tabs */}
          <div className="flex justify-center items-center gap-4 mb-12">
            {['20 JUNE', '21 JUNE'].map((day) => (
              <button
                key={day}
                onClick={() => setSelectedDay(day)}
                className={`px-8 py-3.5 rounded-full font-header text-sm sm:text-base tracking-widest uppercase transition-all duration-300 cursor-pointer ${
                  selectedDay === day
                    ? 'bg-gradient-to-r from-[#FF007F] to-[#E6399B] text-white shadow-[0_0_25px_#FF007F] border-2 border-[#FFD2E1]'
                    : 'bg-[#350B42]/70 text-[#F9CBD9] border border-[#FFD2E1]/20 hover:border-[#FF007F]/50 hover:bg-[#350B42]'
                }`}
              >
                📅 {day}
              </button>
            ))}
          </div>

          {/* Schedule Cards List */}
          <motion.div
            key={selectedDay}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {scheduleData[selectedDay].map((item) => (
              <motion.div
                key={item.id}
                whileHover={{ scale: 1.02, y: -4 }}
                className="glass-panel rounded-2xl p-6 border border-[#FFD2E1]/20 flex flex-col sm:flex-row gap-5 items-center relative overflow-hidden group"
              >
                {/* Thumbnail */}
                <div className="w-full sm:w-36 h-36 rounded-xl overflow-hidden shrink-0 relative">
                  <img src={item.img} alt={item.artist} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                  <span className="absolute top-2 left-2 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase bg-[#1D0324]/80 text-[#39FF14] border border-[#39FF14]/40">
                    {item.status}
                  </span>
                </div>

                {/* Info */}
                <div className="flex-1 text-center sm:text-left">
                  <div className="inline-block px-3 py-1 rounded-full text-xs font-mono text-[#00F0FF] bg-[#00F0FF]/10 mb-2 border border-[#00F0FF]/30">
                    ⏰ {item.time}
                  </div>
                  <h3 className="font-header text-xl sm:text-2xl text-[#FFD2E1] group-hover:text-[#39FF14] transition-colors">
                    {item.artist}
                  </h3>
                  <p className="text-xs text-[#C994A7] font-semibold tracking-wider uppercase mt-1">
                    📍 STAGE: <span className="text-[#FF007F]">{item.stage}</span>
                  </p>
                  <p className="text-xs text-[#F9CBD9] mt-2 italic">
                    {item.genre}
                  </p>
                </div>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* --------------------------------------------------------------------------
         5. SPECIAL GUEST STARS (LINEUP) (Grid with Spotlight Flares & Sibling Dimming)
         -------------------------------------------------------------------------- */}
      <section id="lineup" className="py-24 px-4 sm:px-8 relative max-w-7xl mx-auto">
        
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[#39FF14] font-header tracking-[0.3em] text-xs uppercase block mb-2">
            STAR LINEUP
          </span>
          <h2 className="font-display text-5xl sm:text-7xl text-[#FFD2E1] tracking-wider drop-shadow-[0_0_15px_#FF007F]">
            SPECIAL GUEST STARS
          </h2>
          <p className="text-[#C994A7] text-sm sm:text-base max-w-xl mx-auto mt-2">
            Hover over any artist card to ignite the neon spotlight flare!
          </p>
        </motion.div>

        {/* Artist Grid Container (Triggers Sibling Dimming via CSS) */}
        <div className="artist-grid-container grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {artists.map((artist, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="artist-card glass-panel rounded-3xl overflow-hidden border border-[#FFD2E1]/20 flex flex-col"
            >
              {/* Spotlight Flare Overlay */}
              <div className="spotlight-flare" />

              {/* Photo */}
              <div className="artist-image-container h-72 w-full relative">
                <img
                  src={artist.img}
                  alt={artist.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-[10px] font-bold font-header tracking-wider bg-[#FF007F] text-white shadow-[0_0_10px_#FF007F]">
                  {artist.tag}
                </span>
                <div className="absolute inset-0 bg-gradient-to-t from-[#350B42] via-transparent to-transparent opacity-90" />
              </div>

              {/* Card Body */}
              <div className="p-6 flex-1 flex flex-col justify-between relative z-10">
                <div>
                  <h3 className="font-header text-2xl text-[#FFD2E1] tracking-wider">
                    {artist.name}
                  </h3>
                  <div className="text-xs font-bold text-[#39FF14] tracking-widest uppercase mt-1">
                    {artist.role}
                  </div>
                  <p className="text-xs text-[#F9CBD9] mt-3 leading-relaxed">
                    {artist.bio}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#FFD2E1]/10 text-[11px] text-[#C994A7] font-mono">
                  {artist.day}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------------------
         6. TICKET & SPONSORSHIP PACKAGES (3D Tilt & In Stock / Out of Stock Handlers)
         -------------------------------------------------------------------------- */}
      <section id="tickets" className="py-24 px-4 sm:px-8 relative bg-[#280732]/60">
        <div className="max-w-7xl mx-auto">
          
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-[#00F0FF] font-header tracking-[0.3em] text-xs uppercase block mb-2">
              PASSES & ACCESS
            </span>
            <h2 className="font-display text-5xl sm:text-7xl text-[#FFD2E1] tracking-wider drop-shadow-[0_0_15px_#FF007F]">
              TICKET PACKAGES
            </h2>
            <p className="text-[#C994A7] text-sm sm:text-base max-w-xl mx-auto mt-2">
              Secure your festival pass now before presale tiers sell out.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {ticketPackages.map((pkg) => (
              <motion.div
                key={pkg.id}
                whileHover={{ y: -8, scale: 1.03 }}
                className={`glass-panel rounded-3xl p-6 sm:p-8 flex flex-col justify-between relative border transition-all duration-300 ${
                  shakingTicketId === pkg.id ? 'shake-active' : ''
                } ${
                  pkg.inStock ? 'pulse-border border-[#FF007F]' : 'border-gray-700 opacity-75'
                }`}
              >
                {pkg.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-[#FF007F] to-[#39FF14] text-[#1D0324] font-header text-[10px] font-black tracking-widest uppercase shadow-[0_0_15px_#FF007F]">
                    ★ MOST POPULAR VIP
                  </span>
                )}

                <div>
                  {/* Status Badge */}
                  <div className="flex justify-between items-center mb-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-header font-bold uppercase tracking-wider ${pkg.badgeColor}`}>
                      {pkg.status}
                    </span>
                    <span className="text-xs font-mono text-[#C994A7]">PASS TIER</span>
                  </div>

                  {/* Title & Price */}
                  <h3 className="font-header text-2xl text-[#FFD2E1]">{pkg.title}</h3>
                  <div className="my-4">
                    <span className="font-display text-5xl text-[#FFD2E1] drop-shadow-[0_0_10px_#FF007F]">
                      {pkg.price}
                    </span>
                    <span className="text-xs text-[#C994A7] block mt-1">/ person</span>
                  </div>

                  {/* Perks List */}
                  <ul className="space-y-3 my-6 text-xs text-[#F9CBD9]">
                    {pkg.perks.map((perk, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className={pkg.inStock ? "text-[#39FF14]" : "text-gray-500"}>✓</span>
                        <span>{perk}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Purchase Button */}
                <button
                  onClick={() => handleTicketClick(pkg)}
                  className={`w-full py-3.5 rounded-full font-header text-xs tracking-widest uppercase transition-all duration-300 cursor-pointer ${
                    pkg.inStock
                      ? 'btn-neon shadow-[0_0_20px_#FF007F]'
                      : 'bg-gray-800 text-gray-400 border border-gray-700 cursor-not-allowed'
                  }`}
                >
                  {pkg.inStock ? 'Select Package' : 'Sold Out'}
                </button>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* --------------------------------------------------------------------------
         7. TESTIMONIALS SECTION
         -------------------------------------------------------------------------- */}
      <section id="testimonials" className="py-24 px-4 sm:px-8 relative max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-[#FF007F] font-header tracking-[0.3em] text-xs uppercase block mb-2">
            FAN & ARTIST REVIEWS
          </span>
          <h2 className="font-display text-5xl sm:text-7xl text-[#FFD2E1] tracking-wider drop-shadow-[0_0_15px_#FF007F]">
            FESTIVAL VIBES
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -6, scale: 1.02 }}
              className="glass-panel rounded-3xl p-8 border border-[#FFD2E1]/20 flex flex-col justify-between relative group"
            >
              <div className="text-4xl text-[#FF007F] mb-4">“</div>
              <p className="text-sm text-[#F9CBD9] leading-relaxed italic mb-6">
                {t.quote}
              </p>
              <div className="flex items-center gap-4 pt-4 border-t border-[#FFD2E1]/10">
                <img src={t.avatar} alt={t.author} className="w-12 h-12 rounded-full object-cover border-2 border-[#39FF14]" />
                <div>
                  <div className="font-header text-sm text-[#FFD2E1]">{t.author}</div>
                  <div className="text-xs text-[#C994A7]">{t.role}</div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* --------------------------------------------------------------------------
         8. FOOTER & NEWSLETTER SIGNUP
         -------------------------------------------------------------------------- */}
      <footer className="bg-[#1D0324] border-t border-[#FFD2E1]/20 pt-20 pb-12 px-4 sm:px-8 relative overflow-hidden">
        
        {/* Glow Accent */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#FF007F]/15 blur-[150px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-12 mb-16 relative z-10">
          
          {/* Brand Col */}
          <div className="md:col-span-5 flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <span className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#FF007F] to-[#39FF14] flex items-center justify-center text-[#1D0324] font-black text-2xl">
                ⚡
              </span>
              <span className="font-display text-3xl text-[#FFD2E1] tracking-widest">
                STUDIO SHOWDE
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#C994A7] max-w-sm leading-relaxed">
              The ultimate multi-genre live music festival experience. 20-21 June 2026. High energy acoustics, laser visual shows, and unmissable stage performances.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-[#39FF14] mt-2">
              <span>SOCIAL: @reallygreatsite</span>
              <span>•</span>
              <span>HASHTAG: #STUDIOSHOWDE2026</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="md:col-span-3">
            <h4 className="font-header text-sm text-[#FFD2E1] tracking-widest uppercase mb-4">NAVIGATION</h4>
            <ul className="space-y-2.5 text-xs text-[#F9CBD9] font-body">
              <li><a href="#hero" className="hover:text-[#FF007F] transition-colors">Home & Festival Title</a></li>
              <li><a href="#about" className="hover:text-[#FF007F] transition-colors">Vision & Stat Counter</a></li>
              <li><a href="#schedule" className="hover:text-[#FF007F] transition-colors">Interactive Set Schedule</a></li>
              <li><a href="#lineup" className="hover:text-[#FF007F] transition-colors">Guest Stars Spotlight</a></li>
              <li><a href="#tickets" className="hover:text-[#FF007F] transition-colors">Presale Ticket Packages</a></li>
            </ul>
          </div>

          {/* Newsletter Input */}
          <div className="md:col-span-4 flex flex-col gap-4">
            <h4 className="font-header text-sm text-[#FFD2E1] tracking-widest uppercase">STAY CONNECTED</h4>
            <p className="text-xs text-[#C994A7]">
              Subscribe to get secret artist announcements and presale alerts straight to your inbox.
            </p>
            <form onSubmit={handleNewsletter} className="flex flex-col gap-3">
              <input
                type="email"
                placeholder="Enter your email address"
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                className="w-full px-5 py-3 rounded-full bg-[#350B42]/80 border border-[#FFD2E1]/20 text-white placeholder-gray-400 text-xs focus:outline-none focus:border-[#FF007F] transition-colors"
              />
              <button
                type="submit"
                className="btn-neon-green px-6 py-3 text-xs tracking-widest uppercase"
              >
                Join VIP Newsletter
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="max-w-7xl mx-auto pt-8 border-t border-[#FFD2E1]/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#C994A7] font-mono relative z-10">
          <div>© 2026 STUDIO SHOWDE MUSIC FESTIVAL. ALL RIGHTS RESERVED.</div>
          <div>POWERED BY HIGH-ENERGY FULLSTACK REACT & TAILWIND</div>
        </div>
      </footer>

      {/* --------------------------------------------------------------------------
         9. INTERACTIVE TICKET MODAL
         -------------------------------------------------------------------------- */}
      <AnimatePresence>
        {ticketModal.isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            onClick={() => setTicketModal({ isOpen: false, ticket: null })}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.8, y: 30 }}
              onClick={(e) => e.stopPropagation()}
              className="glass-panel rounded-3xl p-8 max-w-md w-full border border-[#FF007F] shadow-[0_0_50px_rgba(255,0,127,0.5)] relative overflow-hidden"
            >
              <button
                onClick={() => setTicketModal({ isOpen: false, ticket: null })}
                className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
              >
                ✕
              </button>

              <span className="px-3 py-1 rounded-full text-[10px] font-header font-bold uppercase bg-[#39FF14] text-[#1D0324]">
                CONFIRM RESERVATION
              </span>
              <h3 className="font-header text-3xl text-[#FFD2E1] mt-3">
                {ticketModal.ticket.title}
              </h3>
              <div className="font-display text-4xl text-[#39FF14] my-2">
                {ticketModal.ticket.price}
              </div>
              <p className="text-xs text-[#F9CBD9] mb-6">
                You are locking in your 2-Day Pass for STUDIO SHOWDE 2026 (20–21 June).
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  triggerToast(`🎉 Ticket Reserved for ${ticketModal.ticket.title}! Confirmation sent to your email.`);
                  setTicketModal({ isOpen: false, ticket: null });
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-[10px] font-header uppercase tracking-wider text-[#C994A7] block mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    placeholder="Alex Morgan"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1D0324] border border-[#FFD2E1]/20 text-white text-xs focus:outline-none focus:border-[#FF007F]"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-header uppercase tracking-wider text-[#C994A7] block mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="alex@example.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#1D0324] border border-[#FFD2E1]/20 text-white text-xs focus:outline-none focus:border-[#FF007F]"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 mt-2 rounded-full btn-neon font-header text-xs tracking-widest uppercase shadow-[0_0_25px_#FF007F]"
                >
                  Complete Checkout
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

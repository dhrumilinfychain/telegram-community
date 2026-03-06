import { useEffect, useState, useRef } from "react";
import "./App.css";
import ReactPixel from "react-facebook-pixel";

function App() {
  // Live Crypto Ticker State
  const [tickerData, setTickerData] = useState([
    { id: "bitcoin", symbol: "BTC", price: 0, change: 0 },
    { id: "sepolia", symbol: "SEP", price: 0, change: 0 },
    { id: "avalanche-2", symbol: "AVAX", price: 0, change: 0 },
    { id: "ethereum", symbol: "ETH", price: 0, change: 0 },
    { id: "solana", symbol: "SOL", price: 0, change: 0 },
    { id: "binancecoin", symbol: "BNB", price: 0, change: 0 },
    { id: "arbitrum", symbol: "ARB", price: 0, change: 0 },
    { id: "matic-network", symbol: "MATIC", price: 0, change: 0 },
  ]);

  // --- NEW: INITIALIZE META (FACEBOOK) PIXEL ON PAGE LOAD ---
  useEffect(() => {
    const pixelId = import.meta.env.VITE_META_PIXEL_ID;
    
    if (pixelId) {
      // Connects your website to your Facebook Ad Account
      ReactPixel.init(pixelId);
      // Tells Facebook someone landed on the website
      ReactPixel.pageView(); 
    } else {
      console.warn("Meta Pixel ID is missing from .env file or Vercel Environment Variables");
    }
  }, []);

  // Handle Button Clicks (Fires Lead Event & Opens Telegram)
  const handleJoinClick = () => {
    ReactPixel.track("Lead");
    const telegramLink = import.meta.env.VITE_TELEGRAM_LINK;
    if (telegramLink) {
      window.open(telegramLink, "_blank");
    } else {
      console.error("Telegram Link is missing!");
    }
  };

  // Fetch live crypto prices
  useEffect(() => {
    const fetchLivePrices = async () => {
      try {
        const ids = tickerData.map((coin) => coin.id).join(",");
        const res = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`,
        );
        const data = await res.json();

        setTickerData((prevData) =>
          prevData.map((coin) => ({
            ...coin,
            price: data[coin.id]?.usd || 0,
            change: data[coin.id]?.usd_24h_change || 0,
          })),
        );
      } catch (error) {
        console.error("Failed to fetch live crypto prices:", error);
      }
    };

    fetchLivePrices(); // Initial fetch
    const interval = setInterval(fetchLivePrices, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Add scroll animation logic for the roadmap boxes
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Add classes when visible
            entry.target.classList.add("opacity-100", "translate-y-0");
            entry.target.classList.remove("opacity-0", "translate-y-16");
          } else {
            // REMOVE classes when scrolled out of view
            entry.target.classList.remove("opacity-100", "translate-y-0");
            entry.target.classList.add("opacity-0", "translate-y-16");
          }
        });
      },
      {
        threshold: 0.2, // Trigger when 20% of the box is visible
        rootMargin: "0px 0px -50px 0px", // Slight offset for smoother feel
      },
    );

    document.querySelectorAll(".reveal-on-scroll").forEach((el) => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Animated Counter Component for Stats Section
  const AnimatedCounter = ({
    value,
    prefix = "",
    suffix = "",
  }: {
    value: number;
    prefix?: string;
    suffix?: string;
  }) => {
    const [count, setCount] = useState(0);
    const nodeRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
      const node = nodeRef.current;
      if (!node) return;

      const observer = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            const duration = 2000; // 2 seconds animation
            const startTime = performance.now();

            const animate = (currentTime: number) => {
              const elapsedTime = currentTime - startTime;
              const progress = Math.min(elapsedTime / duration, 1);

              // easeOutQuart equation for a smooth slowdown at the end
              const easeOut = 1 - Math.pow(1 - progress, 4);

              setCount(Math.floor(easeOut * value));

              if (progress < 1) {
                requestAnimationFrame(animate);
              } else {
                setCount(value);
              }
            };

            requestAnimationFrame(animate);
            observer.unobserve(node); // Stop observing once animated
          }
        },
        { threshold: 0.5 }, // Triggers when 50% of the stat is visible
      );

      observer.observe(node);
      return () => observer.disconnect();
    }, [value]);

    return (
      <span ref={nodeRef}>
        {prefix}
        {count}
        {suffix}
      </span>
    );
  };

  return (
    <>
      {/* Top Ticker (LIVE DATA) */}
      <div className="w-full bg-slate-900/80 border-b border-primary/20 backdrop-blur-md overflow-hidden sticky top-0 z-50 py-2">
        <div className="flex whitespace-nowrap animate-ticker hover:animation-play-state-paused">
          <div className="flex items-center space-x-6 md:space-x-8 px-4 text-[10px] md:text-xs font-bold uppercase tracking-wider text-primary">
            {/* We map the data twice to create an infinite seamless loop */}
            {[...tickerData, ...tickerData].map((coin, index) => (
              <span key={`${coin.id}-${index}`} className="flex items-center">
                {coin.symbol}/USDT
                {/* Dynamic Color for Positive/Negative Change */}
                <span
                  className={`ml-1 ${coin.change >= 0 ? "text-green-400" : "text-red-400"}`}
                >
                  {coin.change >= 0 ? "+" : ""}
                  {coin.change.toFixed(2)}%
                </span>
                {/* Live Price */}
                <span className="text-white ml-2 font-black tracking-widest">
                  $
                  {coin.price > 1
                    ? coin.price.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })
                    : coin.price.toFixed(4)}
                </span>
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 grid-bg pointer-events-none opacity-50 z-0"></div>
      <div className="fixed top-[-5%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-primary/20 blur-[100px] md:blur-[120px] rounded-full pointer-events-none z-0"></div>
      <div className="fixed bottom-[-5%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-secondary/10 blur-[100px] md:blur-[120px] rounded-full pointer-events-none z-0"></div>

      {/* Main Container - Added overflow-x-hidden to prevent mobile horizontal scroll */}
      <main className="relative z-10 overflow-x-hidden">
        
        {/* Hero Section */}
        <section className="container mx-auto px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-32">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-16">
            {/* Left Content Area (Text & Buttons) */}
            <div className="lg:w-1/2 text-center lg:text-left">
              <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-[10px] sm:text-xs font-bold tracking-widest uppercase mb-6 sm:mb-8 shadow-[0_0_15px_rgba(0,149,255,0.2)]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                </span>
                <span>LIVE CHANNEL</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold mb-6 sm:mb-8 font-display leading-[1.2] sm:leading-[1.40]">
                नीचे क्लिक करके <br className="hidden sm:block" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400 drop-shadow-lg">
                  टेलीग्राम चैनल
                </span>{" "}
                <br />
                में ज्वाइन करें!
              </h1>
              
              {/* --- HERO BUTTON AREA (Fixed Animation & Full Width) --- */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start w-full mt-4 sm:mt-0">
                <button
                  onClick={handleJoinClick}
                  className="w-full sm:w-auto bg-primary hover:bg-primary/90 text-white px-8 py-5 sm:px-10 rounded-2xl flex items-center justify-center gap-3 transition-all transform hover:scale-105 active:scale-95 glow-blue group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 bg-white/20 w-1/2 -skew-x-12 -translate-x-full group-hover:translate-x-[250%] transition-transform duration-700"></div>
                  <span className="material-icons-round text-xl sm:text-2xl group-hover:rotate-12 transition-transform">
                    rocket_launch
                  </span>
                  <span className="text-lg sm:text-xl font-bold tracking-wide">
                    JOIN NOW
                  </span>
                </button>
              </div>
            </div>

            {/* Right Content Area */}
            <div className="lg:w-1/2 relative w-full max-w-lg sm:max-w-2xl mx-auto lg:max-w-none mt-12 lg:mt-0 group perspective-1000 scale-100 sm:scale-[1.10] origin-center">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] sm:w-[110%] aspect-square bg-gradient-to-tr from-primary/30 via-cyan-400/10 to-secondary/20 rounded-full blur-[80px] sm:blur-[120px] animate-pulse-slow z-0"></div>

              <div className="relative z-10 animate-float transition-all duration-700 hover:scale-[1.05] hover:shadow-[0_0_70px_rgba(0,149,255,0.4)] p-1.5 sm:p-2 rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-b from-white/10 via-white/5 to-transparent backdrop-blur-md">
                <div className="relative rounded-[1.8rem] sm:rounded-[2.5rem] overflow-hidden bg-slate-900/80 border border-white/10 shadow-2xl">
                  <img
                    alt="Hero Image"
                    className="w-full h-auto object-cover transform transition-transform duration-1000 group-hover:scale-105 opacity-100"
                    src="/hero.png"
                    fetchPriority="high"
                  />
                </div>

                <div
                  className="absolute top-4 -right-2 sm:top-8 sm:-right-8 lg:-right-12 glass p-3 sm:p-5 rounded-2xl sm:rounded-3xl animate-float glow-blue z-30 border border-primary/30 backdrop-blur-xl "
                  style={{ animationDelay: "3s" }}
                >
                  <div className="bg-primary/20 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl shadow-[0_0_20px_rgba(0,149,255,0.6)]">
                    <span className="material-icons-round text-primary text-base sm:text-xl">
                      query_stats
                    </span>
                  </div>
                </div>

                <div
                  className="absolute bottom-6 -left-2 sm:bottom-12 sm:-left-6 lg:-left-10 glass p-3 sm:p-4 rounded-2xl sm:rounded-3xl animate-float glow-gold z-30 border border-secondary/30 backdrop-blur-xl transition-transform duration-300 hover:translate-y-2 hover:-rotate-6"
                  style={{ animationDelay: "2.5s" }}
                >
                  <div className="bg-secondary/20 p-1.5 sm:p-2 rounded-xl sm:rounded-2xl mb-1 shadow-[0_0_15px_rgba(255,215,0,0.4)]">
                    <span className="material-icons-round text-secondary text-base sm:text-xl">
                      auto_graph
                    </span>
                  </div>
                </div>
              </div>

              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[115%] aspect-square border border-primary/20 rounded-full -z-10 animate-spin-slow opacity-60"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[100%] aspect-square border border-dashed border-cyan-500/30 rounded-full -z-10 animate-spin-reverse-slow opacity-60"></div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-white/5 bg-slate-900/40 backdrop-blur-xl py-10 sm:py-12 relative z-20">
          <div className="container mx-auto px-4 sm:px-6 grid grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 text-center">
            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-primary">
                <AnimatedCounter value={50} suffix="K+" />
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-2 font-bold">
                Active Members
              </p>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-secondary">
                <AnimatedCounter value={2} prefix="$" suffix="M+" />
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-2 font-bold">
                Value Shared
              </p>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-primary">
                <AnimatedCounter value={24} suffix="/7" />
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-2 font-bold">
                Market Watch
              </p>
            </div>

            <div>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-secondary">
                <AnimatedCounter value={92} suffix="%" />
              </h3>
              <p className="text-[9px] sm:text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-2 font-bold">
                Win Rate
              </p>
            </div>
          </div>
        </section>

        {/* Strategic Roadmap Section */}
        <section className="container mx-auto px-4 sm:px-6 pt-20 sm:pt-32 pb-16 relative">
          <div className="text-center mb-20 sm:mb-32">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 font-display">
              Strategic <span className="text-primary">Roadmap</span> 2026
            </h2>
            <p className="text-slate-500 text-xs sm:text-sm max-w-lg mx-auto">
              Our trajectory towards becoming the premier intelligence hub in
              the ecosystem.
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto relative px-2 sm:px-4">
            <div className="absolute left-6 lg:left-1/2 top-0 bottom-0 roadmap-line -translate-x-1/2 opacity-30 z-0"></div>

            {/* Phase 01 */}
            <div className="reveal-on-scroll opacity-0 translate-y-16 transition-all duration-1000 ease-out relative flex items-center justify-between mb-12 sm:mb-16 flex-col lg:flex-row z-10">
              <div className="w-full pl-14 lg:pl-0 lg:w-[45%] mb-4 lg:mb-0">
                <div className="glass p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-primary/20 relative group hover:border-primary/60 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,149,255,0.15)] bg-slate-900/50 backdrop-blur-xl">
                  <span className="text-primary text-[9px] sm:text-[10px] font-bold tracking-widest uppercase block text-left lg:text-right mb-2">
                    Phase 01
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 text-left lg:text-right">
                    Elite Telegram Access
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed text-left lg:text-right">
                    Integrate into our exclusive Telegram community to receive
                    instant, high-probability trade setups and real-time
                    algorithmic alerts.
                  </p>
                </div>
              </div>
              <div className="absolute left-6 lg:left-1/2 -translate-x-1/2 bg-slate-900 border-2 border-primary glow-blue p-3 sm:p-4 rounded-full z-20 transition-transform duration-300 hover:scale-110">
                <span className="material-icons-round text-primary text-xl sm:text-2xl">
                  telegram
                </span>
              </div>
              <div className="hidden lg:block lg:w-[45%]"></div>
            </div>

            {/* Phase 02 */}
            <div className="reveal-on-scroll opacity-0 translate-y-16 transition-all duration-1000 ease-out delay-100 relative flex items-center justify-between mb-12 sm:mb-16 flex-col lg:flex-row z-10">
              <div className="hidden lg:block lg:w-[45%]"></div>
              <div className="absolute left-6 lg:left-1/2 -translate-x-1/2 bg-slate-900 border-2 border-secondary glow-gold p-3 sm:p-4 rounded-full z-20 transition-transform duration-300 hover:scale-110">
                <span className="material-icons-round text-secondary text-xl sm:text-2xl">
                  insights
                </span>
              </div>
              <div className="w-full pl-14 lg:pl-0 lg:w-[45%] mt-4 lg:mt-0">
                <div className="glass p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-secondary/20 relative group hover:border-secondary/60 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(255,215,0,0.1)] bg-slate-900/50 backdrop-blur-xl">
                  <span className="text-secondary text-[9px] sm:text-[10px] font-bold tracking-widest uppercase block mb-2 text-left">
                    Phase 02
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 text-left">
                    Actionable Intelligence
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed text-left">
                    Unlock deep-dive technical analysis, whale wallet tracking,
                    and institutional-grade market tips to stay ahead of retail
                    traders.
                  </p>
                </div>
              </div>
            </div>

            {/* Phase 03 */}
            <div className="reveal-on-scroll opacity-0 translate-y-16 transition-all duration-1000 ease-out delay-200 relative flex items-center justify-between flex-col lg:flex-row z-10">
              <div className="w-full pl-14 lg:pl-0 lg:w-[45%] mb-4 lg:mb-0">
                <div className="glass p-6 sm:p-8 rounded-[24px] sm:rounded-[32px] border border-primary/20 relative group hover:border-primary/60 transition-all duration-300 transform hover:-translate-y-2 hover:shadow-[0_10px_30px_rgba(0,149,255,0.15)] bg-slate-900/50 backdrop-blur-xl">
                  <span className="text-primary text-[9px] sm:text-[10px] font-bold tracking-widest uppercase block text-left lg:text-right mb-2">
                    Phase 03
                  </span>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4 text-left lg:text-right">
                    Exponential Growth
                  </h3>
                  <p className="text-slate-400 text-xs sm:text-sm leading-relaxed text-left lg:text-right">
                    Scale your portfolio through closed-circle investment
                    strategies, automated risk management frameworks, and
                    compounded wealth building.
                  </p>
                </div>
              </div>
              <div className="absolute left-6 lg:left-1/2 -translate-x-1/2 bg-slate-900 border-2 border-primary glow-blue p-3 sm:p-4 rounded-full z-20 transition-transform duration-300 hover:scale-110">
                <span className="material-icons-round text-primary text-xl sm:text-2xl">
                  auto_graph
                </span>
              </div>
              <div className="hidden lg:block lg:w-[45%]"></div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto pt-16 pb-24 sm:pb-32 px-4 sm:px-6 relative z-20">
          <div className="relative rounded-[1.5rem] sm:rounded-[2rem] overflow-hidden bg-[#050a18] border border-white/5 shadow-2xl backdrop-blur-3xl group transition-all duration-500 hover:border-primary/40">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(0,149,255,0.08),transparent_50%)]"></div>
            <div className="relative z-10 p-6 sm:p-10 md:p-14 flex flex-col lg:flex-row items-center justify-between gap-8 md:gap-10">
              {/* Left Side (Text) */}
              <div className="lg:w-7/12 text-center lg:text-left relative w-full">
                <h2 className="text-2xl sm:text-3xl md:text-5xl font-black mb-4 sm:mb-5 text-white relative z-10">
                  Secure Your{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-400">
                    Competitive Edge!
                  </span>
                </h2>
                <div className="flex flex-col gap-3 sm:gap-4 text-center md:text-left relative z-10">
                  <p className="text-slate-400 text-xs sm:text-sm md:text-base font-light italic mt-1 sm:mt-2">
                    "Turn data into alpha. Leverage institutional flow to
                    dominate the decentralized frontier."
                  </p>
                </div>

                <div className="hidden lg:block absolute -right-32 xl:-right-40 top-[55%] xl:top-[60%] -translate-y-1/2 w-32 xl:w-40 z-0 pointer-events-none">
                  <img
                    src="/arrow.webp"
                    alt="Arrow"
                    className="w-full h-auto opacity-70 invert drop-shadow-[0_0_15px_rgba(0,212,255,0.4)] animate-arrow-flow"
                    loading="lazy"
                  />
                </div>
              </div>

              {/* --- CTA BUTTON AREA (Fixed Animation & Full Width) --- */}
              <div className="lg:w-5/12 flex flex-col items-center lg:items-end w-full relative z-20">
                <button
                  onClick={handleJoinClick}
                  className="w-full sm:w-auto bg-cyan-500 text-[#020617] hover:bg-cyan-400 px-6 py-5 sm:px-12 rounded-xl flex items-center justify-center gap-2 sm:gap-4 transition-all transform hover:scale-[1.03] active:scale-95 shadow-[0_0_30px_rgba(0,212,255,0.3)] group relative overflow-hidden cursor-pointer"
                >
                  <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out z-0"></div>
                  
                  <span className="material-icons-round text-2xl sm:text-3xl shrink-0 group-hover:-rotate-12 transition-transform relative z-10">
                    telegram
                  </span>
                  <span className="text-[14px] sm:text-lg font-bold uppercase tracking-widest whitespace-nowrap relative z-10">
                    Access Private Channel
                  </span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 bg-slate-950/80 backdrop-blur-md relative z-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="flex flex-wrap justify-center items-center gap-4 md:space-x-8 md:gap-0 text-[10px] md:text-xs font-bold text-slate-500 tracking-widest uppercase">
            <a className="hover:text-primary transition-colors" href="#">
              Privacy
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Terms
            </a>
            <a className="hover:text-primary transition-colors" href="#">
              Contact
            </a>
          </div>
          <p className="text-slate-600 text-[10px] md:text-sm text-center">
            Copyright © 2026 All Rights Reserved.
          </p>
        </div>
      </footer>
    </>
  );
}

export default App;
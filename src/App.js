import React, { useState, useEffect, useRef } from 'react';

// ============================================================
// CONFIGURATION & ARE.NA CHANNEL SLUGS
// ============================================================
const ARCHIVE_CHANNEL = 'archive-4kwdmkcfu_y';
const PUBS_CHANNEL = 'publications-hoc7ciafzuq';
const FILM_CHANNEL = 'film-0iexlngxoz0';

export default function App() {
  // View states: 'home' | 'film' | 'publications' | 'archive'
  const [view, setView] = useState('home');
  const [archiveItems, setArchiveItems] = useState([]);
  const [pubItems, setPubItems] = useState([]);
  const [filmItems, setFilmItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // Interface states
  const [hoveredBlock, setHoveredBlock] = useState(null);
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(-1);
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [isBioOpen, setIsBioOpen] = useState(false);
  const [showEvent, setShowEvent] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
      const check = () => setIsMobile(window.innerWidth < 600);
      check();
      window.addEventListener('resize', check);
      return () => window.removeEventListener('resize', check);
    }, []);

  // Canvas context refs
  const sporeCanvasRef = useRef(null);
  const gradientCanvasRef = useRef(null);
  const sporesRef = useRef([]);
  const sporeImgRef = useRef(null); 

  // ============================================================
  // DATA AND SVG INLINE PRELOADING PIPELINES
  // ============================================================
  useEffect(() => {
    const svgMarkup = `
    <svg width="50" height="50" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="14.6984" cy="14.6984" r="14.6984" fill="url(#paint0_radial_1902_4183)"/>
    <defs>
    <radialGradient id="paint0_radial_1902_4183" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(14.6984 14.6984) rotate(90) scale(14.6984)">
    <stop stop-color="#D9D9D9"/>
    <stop offset="1" stop-color="#D9D9D9" stop-opacity="0"/>
    </radialGradient>
    </defs>
    </svg>

    `;

    const img = new Image();
    img.src = `data:image/svg+xml;utf8,${encodeURIComponent(svgMarkup)}`;
    sporeImgRef.current = img;

    const fetchChannel = (id) => 
      fetch(`https://api.are.na/v2/channels/${id}/contents?per=50`)
        .then(res => res.json())
        .then(data => data.contents || []);

    Promise.all([
      fetchChannel(ARCHIVE_CHANNEL), 
      fetchChannel(PUBS_CHANNEL),
      fetchChannel(FILM_CHANNEL)
    ])
      .then(([archive, pubs, film]) => {
        setArchiveItems(archive);
        setPubItems(pubs);
        setFilmItems(film);
        setLoading(false);
      })
      .catch(err => {
        console.error("Are.na pull failed:", err);
        setLoading(false);
      });
  }, []);

  // Global Cross-Page Keyboard Triggers
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeLightboxIndex === -1) return;
      const currentItems = view === 'archive' ? archiveItems : view === 'publications' ? pubItems : filmItems;
      if (!currentItems.length) return;

      if (e.key === 'ArrowRight') {
        setActiveLightboxIndex((prev) => (prev + 1) % currentItems.length);
      } else if (e.key === 'ArrowLeft') {
        setActiveLightboxIndex((prev) => (prev - 1 + currentItems.length) % currentItems.length);
      } else if (e.key === 'Escape') {
        setActiveLightboxIndex(-1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, archiveItems, pubItems, filmItems, view]);

  // Reset hovered element state on tab route shift to prevent ghost layouts
  useEffect(() => {
    setHoveredBlock(null);
  }, [view]);

  // ============================================================
  // CANVAS SPORE VECTOR GRAPHICS RENDER ENGINE
  // ============================================================
  useEffect(() => {
    if (view !== 'home' || loading || !sporeCanvasRef.current) return;

    const canvas = sporeCanvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    sporesRef.current = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: (Math.random() - 0.5) * 0.9,
      vy: (Math.random() - 0.5) * 0.9,
      size: 50, 
      isHovered: false,
      blockData: archiveItems[i] || null
    }));

    const renderLoop = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      sporesRef.current.forEach((spore) => {
        if (!spore.isHovered) {
          spore.x += spore.vx;
          spore.y += spore.vy;

          if (spore.x < 0 || spore.x > canvas.width) spore.vx *= -1;
          if (spore.y < 0 || spore.y > canvas.height) spore.vy *= -1;
        }

        if (sporeImgRef.current && sporeImgRef.current.complete) {
          ctx.drawImage(
            sporeImgRef.current,
            spore.x - spore.size / 2,
            spore.y - spore.size / 2,
            spore.size,
            spore.size
          );
        } else {
          ctx.beginPath();
          ctx.arc(spore.x, spore.y, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#D9D9D9';
          ctx.fill();
        }
      });

      animationFrameId = requestAnimationFrame(renderLoop);
    };
    renderLoop();

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;
      let matchFound = null;

      sporesRef.current.forEach((spore) => {
        const dist = Math.hypot(spore.x - mx, spore.y - my);
        if (dist < 45) { 
          spore.isHovered = true;
          matchFound = spore.blockData;
        } else {
          spore.isHovered = false;
        }
      });
      setHoveredBlock(matchFound);
    };

    const handleMouseLeave = () => {
      sporesRef.current.forEach(s => s.isHovered = false);
      setHoveredBlock(null);
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      if (canvas) {
        canvas.removeEventListener('mousemove', handleMouseMove);
        canvas.removeEventListener('mouseleave', handleMouseLeave);
      }
    };
  }, [view, loading, archiveItems]);

  // ============================================================
  // MUSHROOM RADIAL INFO GRADIENT LAYER
  // ============================================================
  useEffect(() => {
    if (!gradientCanvasRef.current) return;
    const canvas = gradientCanvasRef.current;
    const ctx = canvas.getContext('2d');
    let animId;
    let time = 0;

    const drawGradient = () => {
      time += 0.02;
      const w = canvas.width = canvas.offsetWidth;
      const h = canvas.height = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const pulseFactor = Math.sin(time) * 16;
      const radius = Math.min(w, h) * 0.8 + pulseFactor;

      let grad = ctx.createRadialGradient(w, h, 0, w, h, radius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 1.0)');
      grad.addColorStop(0.6, 'rgba(255, 255, 255, 0.95)');
      grad.addColorStop(1, 'rgba(255, 255, 255, 0.0)');

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);
      animId = requestAnimationFrame(drawGradient);
    };

    drawGradient();
    return () => cancelAnimationFrame(animId);
  }, []);

  // Helper utility to safely construct structural modern iframe paths
  const launchVideoTarget = (item) => {
    const rawUrl = item.source?.url || item.attachment?.url;
    if (!rawUrl) return;

    if (rawUrl.includes('youtube.com/watch')) {
      const urlObj = new URL(rawUrl);
      const vParam = urlObj.searchParams.get('v');
      if (vParam) {
        setActiveVideoUrl(`https://www.youtube.com/embed/${vParam}?autoplay=1`);
        return;
      }
    }
    if (rawUrl.includes('youtu.be/')) {
      const id = rawUrl.split('youtu.be/')[1]?.split(/[?#]/)[0];
      if (id) {
        setActiveVideoUrl(`https://www.youtube.com/embed/${id}?autoplay=1`);
        return;
      }
    }
    if (rawUrl.includes('vimeo.com/')) {
      const id = rawUrl.split('vimeo.com/')[1]?.split(/[?#]/)[0];
      if (id) {
        setActiveVideoUrl(`https://player.vimeo.com/video/${id}?autoplay=1`);
        return;
      }
    }
    setActiveVideoUrl(rawUrl);
  };

  // Run this after the DOM is fully loaded
document.body.innerHTML = document.body.innerHTML.replace(/9413 sophia ave/gi, '<i>9413 sophia ave</i>');
  if (loading) return <div className="loading-screen italic">9413 sophia ave</div>;

  // Track down current metadata target relative to cross-page view types
  const currentActiveBlock = activeLightboxIndex !== -1 
    ? (view === 'archive' ? archiveItems[activeLightboxIndex] : view === 'publications' ? pubItems[activeLightboxIndex] : filmItems[activeLightboxIndex])
    : hoveredBlock;

  return (
    <div className="app-container" style={{
      backgroundImage: (view === 'home' && hoveredBlock?.image?.display?.url) ? `url(${hoveredBlock.image.display.url})` : 'none',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh'
    }}>
      
      {/* GLOBAL TOP NAV SYSTEM */}
      <nav className="nav">
        <div className="nav-sentence">
          9413 Sophia Ave is a choreographed deconstruction of the built environment{' '}
          <span className="info-read-toggle" onClick={() => { setView('home'); setIsBioOpen(!isBioOpen); }}>
            {isBioOpen ? '(Close)' : '(Read More)'}
          </span>
        </div>

        <button className="nav-arrow" onClick={() => {
          const routes = ['home', 'film', 'publications', 'archive'];
          const nextIdx = (routes.indexOf(view) + 1) % routes.length;
          setView(routes[nextIdx]);
          setIsBioOpen(false);
        }}>
          <span>See {view === 'home' ? 'Film' : view === 'film' ? 'Publications' : view === 'publications' ? 'Archive' : 'Home'}</span>
          <svg width="65" height="30" viewBox="0 0 65 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 14.6485H63.8286M49.5336 28.9435L63.8286 14.6485L49.5336 0.353516" stroke="black"/>
          </svg>
        </button>
      </nav>

      {/* RENDER VIEW DISTRIBUTION ROUTER */}
      <main className="page">
        {isBioOpen && (
          <div className="info-overlay-panel">
            <div className="info-page">
              <div className="info-bio-col">
                <p>9413 Sophia Ave is both an address and the title of a durational, in situ performance which took place from September 2024 - September 2025.
                <br />Driven by an interest in the life cycle of structures, 9413 Sophia Ave operated as a case study with the aim to enact collective maintenance and intentional turnover of a structure through an active exchange with peoples' interest in their own neighborhood. 
                <br />This social practice work took interest in the relationship between several local environmental justice organizations with focuses on varied aspects of the built environment, seeking to emphasize the group's existing working dynamic and engage the broader community through workshops and onsite gatherings.
                <br />The year-long performance involved the choreographed deconstruction and the subsequent recycling and biocycling of a home which was condemned by the Cuyahoga Land Bank – this resulted in a participatorily designed installation on the site. By using the concept of biocycling as an artistic medium, the life cycle of a built structure could be considered from myriad perspectives – the material as well as the cultural.
                <br />Biocycling refers to a process of using a waste product – in this case, demolition waste – as a substrate to be bound together by mycelium. The resultant substance can be used as an alternative building material for sculptural or, potentially, structural purposes. The material treatment within 9413 Sophia Ave is situated in a post-industrial and post-recycling cultural landscape – it aimed to recycle in an active, rather than passive, sense.
                <br />In addition to the physical performance, this work resulted in two publications in collaboration with Colin Martinez, and a forthcoming documentary film by Jacob Koestler and Michael McDermit of Blurry Pictures.
                <br />This work was made possible through the support of the City of Cleveland and Cleveland City Council's Transformative Arts Fund, a portion of American Rescue Plan Act funds allotted for public art.</p>
              </div>
              <div className="info-visiting-col">
                <p><LiveWeather /> It's open to the public 24/7</p>
              </div>
              <div className="info-team-col">
                <div className="info-team-list">
                  <a href="https://malenagrigoli.com/9413sophia.html" target="_blank" rel="noreferrer" className="info-team-row">
                    <span className="info-team-role">Project Lead</span>
                    <span className="info-team-name">Malena Grigoli</span>
                  </a>
                  <a href="https://colinmartinez.xyz/9413-sophia-avenue-gallery" target="_blank" rel="noreferrer" className="info-team-row">
                    <span className="info-team-role">Photographer</span>
                    <span className="info-team-name">Colin Martinez</span>
                  </a>
                  <a href="https://cjcontractorsco.com/" target="_blank" rel="noreferrer" className="info-team-row">
                    <span className="info-team-role">Demolition</span>
                    <span className="info-team-name">C&J Contractors</span>
                  </a>
                  <a href="https://www.redhousearchitecture.org/" target="_blank" rel="noreferrer" className="info-team-row">
                    <span className="info-team-role">Institutional Partner</span>
                    <span className="info-team-name">redhouse studio</span>
                  </a>
                  <a href="https://blurry-pictures.com/work" target="_blank" rel="noreferrer" className="info-team-row">
                    <span className="info-team-role">Videography</span>
                    <span className="info-team-name">Blurry Pictures</span>
                  </a>
                  <a href="https://www.facebook.com/groups/90189049894/" target="_blank" rel="noreferrer" className="info-team-row">
                    <span className="info-team-role">Lead Contamination Consulting</span>
                    <span className="info-team-name">Robin Brown</span>
                  </a>
                  <a href="https://mygrowconnect.org/" target="_blank" rel="noreferrer" className="info-team-row">
                    <span className="info-team-role">Lead Field Agronomist</span>
                    <span className="info-team-name">Jennifer Lumpkin</span>
                  </a>
                  <a href="https://www.instagram.com/indigo.bishop/" target="_blank" rel="noreferrer" className="info-team-row">
                    <span className="info-team-role">Community Organizing</span>
                    <span className="info-team-name">Indigo Bishop</span>
                  </a>
                  <a href="https://cuyahogalandbank.org/" target="_blank" rel="noreferrer" className="info-team-row">
                    <span className="info-team-role">Project Partner</span>
                    <span className="info-team-name">Cuyahoga Land Bank</span>
                  </a>
                  <a href="https://www.clevelandohio.gov/city-hall/office-mayor/taf" target="_blank" rel="noreferrer" className="info-team-row">
                    <span className="info-team-role">Funding</span>
                    <span className="info-team-name">Transformative Arts Fund</span>
                  </a>
                  <a href="https://harperdaniel.com" target="_blank" rel="noreferrer" className="info-team-row">
                    <span className="info-team-role">Branding and Website</span>
                    <span className="info-team-name">Harper Daniel</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'home' && (
          <div className="home-wrap">
            <canvas ref={sporeCanvasRef} className="spore-canvas" />
          </div>
        )}

        {view === 'film' && (
          <div className="film-blocks">
            {filmItems.map((item, index) => (
              <div 
                key={item.id} 
                className="film-block-row"
                onMouseEnter={() => setHoveredBlock(item)}
                onMouseLeave={() => setHoveredBlock(null)}
              >
                <div className="film-block-img-wrap" onClick={() => launchVideoTarget(item)}>
                  <img src={item.image?.large?.url || "/contact-3.jpg"} alt="" />
                  {(item.source?.url || item.attachment?.url) && (
                    <div className="film-block-play">[PLAY VIDEO]</div>
                  )}
                </div>
                {/* hide film info for now 
                <div className="film-block-info">
                  <h3>{item.title || "Untitled Sequence"}</h3>
                  <p>{item.description || "Archive Film Record Stream"}</p>
                </div>*/}
              </div> 
            ))}
          </div>
        )}

        {view === 'publications' && (
          <div className="publications-grid">
            {pubItems.map((pub, index) => (
              <div 
                key={pub.id} 
                className="pub-block"
                onClick={() => setActiveLightboxIndex(index)}
                onMouseEnter={() => setHoveredBlock(pub)}
                onMouseLeave={() => setHoveredBlock(null)}
              >
                {pub.image?.large?.url && <img src={pub.image.large.url} alt={pub.title} />}
                <div className="pub-block-info">
                  <h3>{pub.title}</h3>
                </div>
              </div>
            ))}
          </div>
        )}

        {view === 'archive' && (
          <div className="archive-col">
            {archiveItems.map((item, index) => (
              <div 
                key={item.id} 
                className="archive-block" 
                onClick={() => setActiveLightboxIndex(index)}
                onMouseEnter={() => setHoveredBlock(item)}
                onMouseLeave={() => setHoveredBlock(null)}
                style={{ marginBottom: `${(index % 3) * 16}px` }}
              >
                {item.image?.display?.url && <img src={item.image.display.url} alt={item.title} />}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* EVENT MODULE
      {showEvent && (
        <div className="event-widget">
          <div className="event-widget-header">
            <span>Upcoming Film Screening</span>
            <span className="event-widget-close" onClick={() => setShowEvent(false)}>×</span>
          </div>
          <div className="event-widget-body">
            <br />06/06/24<br />
            <a href="#rsvp">RSVP HERE</a>
          </div>
        </div>
      )} */}

      {/* FIXED CORNER RADIAL METADATA INTERFACE */}
      {(!isMobile || view === 'home') && (
      <div className="info-gradient-wrapper">
        <div className="info-gradient">
          <canvas ref={gradientCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: -1 }} />
          <div className="info-gradient-text">
            {currentActiveBlock ? (
              <>
                <div className="info-title" style={{ fontWeight: 'bold' }}>{currentActiveBlock.title || 'Untitled Record'}</div>
                <div className="info-desc">{currentActiveBlock.description || 'No description supplied.'}</div>
              </>
            ) : (
              <div className="info-desc">
                {isMobile ? 'Tap spores to extract details' : 'Hover to extract details'}
              </div>
            )}
          </div>
        </div>
      </div>
      )}

      {/* SYSTEM LIGHTBOX ARCHIVE MODAL */}
      {activeLightboxIndex !== -1 && (
        <div className="lightbox" onClick={() => setActiveLightboxIndex(-1)}>
          <span className="lightbox-close">(close)</span>
          <div className="lightbox-inner" onClick={e => e.stopPropagation()}>
            <div className="lightbox-img-wrap">
              <img 
                src={
                  view === 'archive' 
                    ? archiveItems[activeLightboxIndex]?.image?.large?.url 
                    : pubItems[activeLightboxIndex]?.image?.large?.url
                } 
                alt="" 
              />
            </div>
          </div>
        </div>
      )}

      {activeVideoUrl && (
        <div className="video-modal" onClick={() => setActiveVideoUrl(null)}>
          <div className="video-modal-inner" onClick={e => e.stopPropagation()}>
            <span className="video-modal-close">(close)</span>
            <div className="video-embed-wrapper">
              <iframe 
                src={activeVideoUrl} 
                title="Video Embed" 
                allowFullScreen 
                allow="autoplay; fullscreen"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// HYPERLOCAL COORDINATE OPEN-METEO WEATHER ENGINE
// ============================================================
function LiveWeather() {
  const [weather, setWeather] = useState({ temp: '--°F', condition: 'loading' });

  useEffect(() => {
    const lat = 41.4820;
    const lon = -81.6521;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code&temperature_unit=fahrenheit`;

    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then(data => {
        if (data?.current) {
          const currentTemp = Math.round(data.current.temperature_2m);
          const code = data.current.weather_code;
          
          let condStr = 'clear';
          if (code >= 1 && code <= 3) condStr = 'partly cloudy';
          if (code >= 45 && code <= 48) condStr = 'foggy';
          if (code >= 51 && code <= 67) condStr = 'raining';
          if (code >= 71 && code <= 77) condStr = 'snowing';
          if (code >= 80) condStr = 'stormy';

          setWeather({ temp: `${currentTemp}°F`, condition: condStr });
        }
      })
      .catch(() => {
        setWeather({ temp: '64°F', condition: 'overcast' }); 
      });
  }, []);

  return (
    <span className="inline-weather">The weather is currently {weather.condition} and {weather.temp} directly at the site.</span>
  );
}
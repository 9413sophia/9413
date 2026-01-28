import React, { useState, useEffect, useRef } from 'react';
import Arena from 'are.na';
import './index.css';
import footerImage from './images/footer-inverted.jpg';
import contact1 from './images/contact-1.png';
import contact2 from './images/contact-2.jpg';
import contact3 from './images/contact-3.jpg';

const arena = new Arena();

const CHANNEL_SLUGS = {
  publication: '9413-sophia-ave-publication',
  archive: '9413-sophia-ave-archive',
  film: '9413-sophia-ave-film',
};

const SophiaAvenue = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [contactOpen, setContactOpen] = useState(false);
  const [infoOpen, setInfoOpen] = useState(false);
  const [blocks, setBlocks] = useState({ publication: [], archive: [], film: [] });
  const [loading, setLoading] = useState(true);
  const [showMoreCount, setShowMoreCount] = useState(20);
  const [expandedImageIndex, setExpandedImageIndex] = useState(null);
  const [hoverBlock, setHoverBlock] = useState(null);
  const [holdTimer, setHoldTimer] = useState(null);
  const [holdBlock, setHoldBlock] = useState(null);
  const [scrollPositions, setScrollPositions] = useState({});
  const scrollTimeout = useRef(null);
  const itemRefs = useRef({});
  const POLL_INTERVAL = 120000;

  useEffect(() => {
    let poller;

    const fetchChannel = async (category, slug) => {
      try {
        const channel = await arena.channel(slug).get({ page: 1, per: 100 });
        return { category, blocks: channel.contents || [] };
      } catch (error) {
        console.error(`Error fetching ${category} (${slug}):`, error);
        return { category, blocks: [] };
      }
    };

    const hasChanged = (oldBlocks, newBlocks) => {
      if (!oldBlocks || oldBlocks.length !== newBlocks.length) return true;
      return oldBlocks[0]?.id !== newBlocks[0]?.id ||
             oldBlocks[0]?.updated_at !== newBlocks[0]?.updated_at;
    };

    const fetchAllChannels = async (isInitial = false) => {
      if (isInitial) setLoading(true);

      const results = await Promise.all([
        fetchChannel('publication', CHANNEL_SLUGS.publication),
        fetchChannel('archive', CHANNEL_SLUGS.archive),
        fetchChannel('film', CHANNEL_SLUGS.film)
      ]);

      setBlocks(prev => {
        const updated = { ...prev };
        let didUpdate = false;

        results.forEach(({ category, blocks }) => {
          if (hasChanged(prev[category], blocks)) {
            updated[category] = blocks;
            didUpdate = true;
          }
        });

        return didUpdate ? updated : prev;
      });

      if (isInitial) setLoading(false);
    };

    fetchAllChannels(true);
    poller = setInterval(() => {
      fetchAllChannels(false);
    }, POLL_INTERVAL);

    return () => clearInterval(poller);
  }, []);

  useEffect(() => {
    if (contactOpen || infoOpen || expandedImageIndex !== null) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [contactOpen, infoOpen, expandedImageIndex]);

  // Scroll-based animation for variable fonts
  useEffect(() => {
    const updateFungalStyles = () => {
      const viewportHeight = window.innerHeight;
      const scrollTop = window.scrollY;
      const viewportTop = scrollTop;

      const newPositions = {};

      Object.keys(itemRefs.current).forEach(key => {
        const element = itemRefs.current[key];
        if (!element) return;

        const rect = element.getBoundingClientRect();
        const elementTop = rect.top + scrollTop;
        const elementMiddle = elementTop + (rect.height / 2);

        // Calculate distance from element middle to viewport top
        const distanceFromTop = elementMiddle - viewportTop;

        // Define animation range (in pixels)
        // Animation happens across the full viewport height
        const animationStart = viewportHeight; // Element at bottom of viewport (0%)
        const animationEnd = 0; // Element at top of viewport (100%)

        // Calculate progress (0 = bottom of viewport, 1 = top of viewport)
        let progress = 0;
        if (distanceFromTop >= animationStart) {
          progress = 0; // Below viewport / at bottom - 0%
        } else if (distanceFromTop <= animationEnd) {
          progress = 1; // At top of viewport - 100%
        } else {
          // In between - interpolate from bottom (0) to top (1)
          progress = 1 - (distanceFromTop / animationStart);
        }

        // Ease the transition (optional - creates smoother animation)
        const easedProgress = easeInOutCubic(progress);

        // Convert to percentage (0-100)
        const percentage = easedProgress * 100;

        // Keyframe-style animation with independent grow and thick
        // 0% = bottom of viewport, 100% = top of viewport
        let grow, thick;

        if (percentage <= 20) {
          // 0-20% (bottom 20% of viewport): grow=1000, thick=300
          grow = 1000;
          thick = 300;
        } else if (percentage <= 70) {
          // 20-70%: grow=100, thick=100
          const localProgress = (percentage - 20) / 50; // 0-1 within this range
          grow = 1000 - (localProgress * 900); // 1000 -> 100
          thick = 300 - (localProgress * 200);  // 300 -> 100
        } else if (percentage <= 90) {
          // 70-90%: grow=700, thick=200
          const localProgress = (percentage - 70) / 20; // 0-1 within this range
          grow = 100 + (localProgress * 200);  // 100 -> 300
          thick = 100 + (localProgress * 100); // 100 -> 200
        } else {
          // 90-100% (top 10% of viewport): grow=1000, thick=1000
          const localProgress = (percentage - 90) / 10; // 0-1 within this range
          grow = 600 + (localProgress * 200);  // 300 -> 1000
          thick = 200 + (localProgress * 800); // 200 -> 1000
        }

        newPositions[key] = { 
          grow: Math.round(grow), 
          thick: Math.round(thick) 
        };
      });

      setScrollPositions(newPositions);
    };

    // Easing function for smoother transitions
    const easeInOutCubic = (t) => {
      return t < 0.5 
        ? 4 * t * t * t 
        : 1 - Math.pow(-2 * t + 2, 3) / 2;
    };

    const handleScroll = () => {
      if (scrollTimeout.current) {
        cancelAnimationFrame(scrollTimeout.current);
      }
      
      scrollTimeout.current = requestAnimationFrame(updateFungalStyles);
    };

    // Initial update
    updateFungalStyles();
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('resize', updateFungalStyles);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', updateFungalStyles);
      if (scrollTimeout.current) {
        cancelAnimationFrame(scrollTimeout.current);
      }
    };
  }, [blocks, activeCategory, showMoreCount]);

  const getHeroText = () => {
    if (activeCategory === 'all') {
      return (
        <>
          The 9413 Sophia Avenue Project is a{' '}
          <span className="choreographed-animation">choreographed deconstruction</span>
          {' '}of the built environment
        </>
      );
    }
    
    const texts = {
      publication: 'The publication shows the dedication to the project and its content',
      film: 'A film about the performance is being made',
      archive: 'The archive of the choreographed deconstruction is living'
    };
    return texts[activeCategory];
  };

  const getAllBlocks = () => {
    const allBlocks = [];
    Object.keys(blocks).forEach(category => {
      blocks[category].forEach(block => {
        allBlocks.push({ ...block, category });
      });
    });
    return allBlocks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  };

  const getCurrentBlocks = () => {
    if (activeCategory === 'all') {
      return getAllBlocks();
    }
    const categoryBlocks = blocks[activeCategory]?.map(block => ({ ...block, category: activeCategory })) || [];
    return [...categoryBlocks].reverse();
  };

  const getFirstPerCategory = () => {
    return Object.keys(blocks)
      .map(category => {
        const categoryBlocks = blocks[category];
        if (!categoryBlocks || !categoryBlocks.length) return null;
        return { ...categoryBlocks[0], category };
      })
      .filter(Boolean);
  };

  const getFirstBlock = () => {
    if (activeCategory === 'all') return null;
    return blocks[activeCategory]?.[0] || null;
  };

  const displayedBlocks = getCurrentBlocks();
  const visibleBlocks = activeCategory === 'all' ? displayedBlocks.slice(0, showMoreCount) : displayedBlocks;
  
  // NEW: Returns ALL blocks for gallery navigation (including ones without titles)
  const getAllBlocksForGallery = () => {
    if (activeCategory !== 'all') {
      // Include ALL blocks for gallery navigation
      return visibleBlocks;
    }

    const displayBlocks = getFirstPerCategory();
    const filmBlock = displayBlocks.find(b => b.category === 'film');
    const publicationBlock = displayBlocks.find(b => b.category === 'publication');
    const archiveBlock = displayBlocks.find(b => b.category === 'archive');
    
    const displayBlockIds = new Set(displayBlocks.map(b => b.id));
    const regularBlocks = visibleBlocks.filter(block => 
      !displayBlockIds.has(block.id) && (block.title || block.description)
    );

    const ordered = [];
    regularBlocks.forEach((block, idx) => {
      ordered.push(block);
      
      if (idx === 1 && filmBlock) {
        ordered.push({ ...filmBlock, isDisplay: true });
      }
      if (idx === 5 && publicationBlock) {
        ordered.push({ ...publicationBlock, isDisplay: true });
      }
      if (idx === 7 && archiveBlock) {
        ordered.push({ ...archiveBlock, isDisplay: true });
      }
    });

    return ordered;
  };

  // NEW: Separate function for blocks to display in main view (only with titles)
  const getOrderedBlocks = () => {
    if (activeCategory !== 'all') {
      return visibleBlocks.filter(block => block.title || block.description);
    }

    const displayBlocks = getFirstPerCategory();
    const filmBlock = displayBlocks.find(b => b.category === 'film');
    const publicationBlock = displayBlocks.find(b => b.category === 'publication');
    const archiveBlock = displayBlocks.find(b => b.category === 'archive');
    
    const displayBlockIds = new Set(displayBlocks.map(b => b.id));
    const regularBlocks = visibleBlocks.filter(block => 
      !displayBlockIds.has(block.id) && (block.title || block.description)
    );

    const ordered = [];
    regularBlocks.forEach((block, idx) => {
      ordered.push(block);
      
      if (idx === 1 && filmBlock) {
        ordered.push({ ...filmBlock, isDisplay: true });
      }
      if (idx === 5 && publicationBlock) {
        ordered.push({ ...publicationBlock, isDisplay: true });
      }
      if (idx === 7 && archiveBlock) {
        ordered.push({ ...archiveBlock, isDisplay: true });
      }
    });

    return ordered;
  };

  const blocksWithTitles = getOrderedBlocks();
  const allGalleryBlocks = getAllBlocksForGallery(); // NEW: All blocks for gallery
  const blocksWithoutTitles = visibleBlocks.filter(block => !block.title && !block.description);
  const firstBlock = getFirstBlock();

  // Keyboard navigation for gallery and modals
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Escape key - close any open modal
      if (e.key === 'Escape') {
        handleCloseModals();
      }
      
      // Arrow keys - only work when gallery is open
      if (expandedImageIndex !== null) {
        if (e.key === 'ArrowRight') {
          e.preventDefault();
          handleNextImage();
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault();
          handlePrevImage();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [expandedImageIndex, contactOpen, infoOpen, allGalleryBlocks.length]);
  
  const getImageUrl = (block) => {
    if (block.image?.display?.url) return block.image.display.url;
    if (block.image?.original?.url) return block.image.original.url;
    return null;
  };

  const getFungalStyle = (key) => {
    const position = scrollPositions[key];
    
    let grow = 1000; // Default to max fungal
    let thick = 1000;
    
    if (position) {
      grow = position.grow;
      thick = position.thick;
    }
    
    return {
      fontFamily: 'FungalVF, Times, serif',
      fontVariationSettings: `"grow" ${grow}, "THCK" ${thick}`,
      '--fungal-grow': grow,
      '--fungal-thick': thick,
      transition: 'font-variation-settings 0.15s ease-out'
    };
  };

  const handleNextImage = () => {
    if (expandedImageIndex < allGalleryBlocks.length - 1) {
      setExpandedImageIndex(expandedImageIndex + 1);
    }
  };

  const handlePrevImage = () => {
    if (expandedImageIndex > 0) {
      setExpandedImageIndex(expandedImageIndex - 1);
    }
  };

  const handleCloseModals = () => {
    setContactOpen(false);
    setInfoOpen(false);
    setExpandedImageIndex(null);
  };

  const handleTouchStart = (blockId, idx) => {
    const timer = setTimeout(() => {
      setHoldBlock(`${blockId}-${idx}`);
    }, 1500);
    setHoldTimer(timer);
  };

  const handleTouchEnd = () => {
    if (holdTimer) {
      clearTimeout(holdTimer);
      setHoldTimer(null);
    }
    setHoldBlock(null);
  };

  // Source - https://stackoverflow.com/a
  // Posted by Ido Cohen, modified by community. See post 'Timeline' for change history
  // Retrieved 2026-01-27, License - CC BY-SA 4.0
  const addLineBreak = (str) =>
  str.split('\n').map((subStr, index) => {
    return (
      <React.Fragment key={index}>
        {subStr}
        <br />
        <br />
      </React.Fragment>
    );
  });

  const currentExpandedBlock = expandedImageIndex !== null ? allGalleryBlocks[expandedImageIndex] : null;

  return (
    <div className="serif">
      <div className="hero-section">
        <p className="hero-text">{getHeroText()}</p>
        <div
          className="hero-bg"
          style={
            activeCategory !== 'all' && firstBlock
              ? { backgroundImage: `url(${getImageUrl(firstBlock)})` }
              : undefined
          }
        />
      </div>

      <nav className="sticky-nav">
        {['all', 'publication', 'film', 'archive'].map(cat => (
          <p
            key={cat}
            className={`navigation-text ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => {
              setActiveCategory(cat);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </p>
        ))}
        <div className="nav-spacer"></div>
      </nav>

      {!contactOpen && !infoOpen && expandedImageIndex === null && (
        <>
          <button 
            onClick={() => {
              setInfoOpen(true);
              setTimeout(() => {
                const infoContent = document.querySelector('.info-content');
                if (infoContent) {
                  infoContent.scrollTop = 0;
                }
              }, 100);
            }} 
            className="info-button"
          >
            Info
          </button>
          <button onClick={() => setContactOpen(true)} className="contact-button">
            Contact
          </button>
        </>
      )}

      {(contactOpen || infoOpen || expandedImageIndex !== null) && (
        <button onClick={handleCloseModals} className="contact-button">
          Exit
        </button>
      )}

      {infoOpen && (
        <div className="contact-modal">
          <div className="info-content" onClick={(e) => e.stopPropagation()}>
            <p className="info-text">
              {addLineBreak
                ("9413 Sophia Ave is both a Cleveland address and the title of a durational performance (Sept 2024–Sept 2025). The social practice work choreographically dismantled and biocycled a condemned house acquired through the Cuyahoga County Land Bank, turning maintenance of the built environment into art. The project culminated in a participatorily designed installation on the site.\n The performance engaged the structure life cycle as an experiment in collective maintenance and intentional neighborhood turnover, shaped through ongoing exchange with residents concerns for their community. \n Biocycling: remediating demolition waste by inoculating it with mycelium and using the resulting material to build new work"
                  )
                  }
            </p>
          </div>
        </div>
      )}

      {contactOpen && (
        <div className="contact-modal" onClick={(e) => e.stopPropagation()}>
          <div className="contact-content">
           <div className="contact-table">
             <h2 className="contact-table-heading">Contact the Project Team</h2>
             <a href="https://malenagrigoli.com/9413sophia.html" className="contact-row">
               <span className="contact-role">Project Lead</span>
               <span className="contact-name">Malena Grigoli</span>
             </a>
             <a href="https://colinmartinez.xyz/9413-sophia-avenue-gallery" className="contact-row">
               <span className="contact-role">Photographer</span>
               <span className="contact-name">Colin Martinez</span>
             </a>
             <a href="https://cjcontractorsco.com/" className="contact-row">
               <span className="contact-role">Demolition</span>
               <span className="contact-name">C&J Contractors</span>
             </a>
             <a href="https://www.redhousearchitecture.org/" className="contact-row">
               <span className="contact-role">Institutional Partner</span>
               <span className="contact-name">redhouse studio</span>
             </a>
             <a href="https://blurry-pictures.com/work" className="contact-row">
               <span className="contact-role">Videography</span>
               <span className="contact-name">Blurry Pictures</span>
             </a>
             <a href="https://www.facebook.com/groups/90189049894/" className="contact-row">
               <span className="contact-role">Lead Contamination Consulting</span>
               <span className="contact-name">Robin Brown</span>
             </a>
             <a href="https://mygrowconnect.org/" className="contact-row">
               <span className="contact-role">Lead Field Agronomist</span>
               <span className="contact-name">Jennifer Lumpkin</span>
             </a>
             <a href="https://www.instagram.com/indigo.bishop/" className="contact-row">
               <span className="contact-role">Community Organizing</span>
               <span className="contact-name">Indigo Bishop</span>
             </a>
             <a href="https://cuyahogalandbank.org/" className="contact-row">
               <span className="contact-role">Project Partner</span>
               <span className="contact-name">Cuyahoga Land Bank</span>
             </a>
             <a href="https://www.clevelandohio.gov/city-hall/office-mayor/taf" className="contact-row">
               <span className="contact-role">Funding</span>
               <span className="contact-name">Cleveland Transformative Arts Fund</span>
             </a>
             <a href="https://harperdaniel.com" className="contact-row">
               <span className="contact-role">Branding and Website</span>
               <span className="contact-name">Harper Daniel</span>
             </a>
           </div>
           <div className="contact-email-links">
             {[
               { heading: 'Interested in carrying the book?', img: contact2 },
               { heading: 'Showing the film?', img: contact1 },
               { heading: 'Scheduling a talk?', img: contact3 }
             ].map((block, idx) => (
               <a 
                 key={idx}
                 href="mailto:contact@9413sophia.com"
                 className="contact-email-link"
               >
                 <p>{block.heading}</p>
                 <img src={block.img} alt={block.heading} />
               </a>
             ))}
           </div>
           </div>
        </div>
      )}

      {expandedImageIndex !== null && currentExpandedBlock && (
        <div className="contact-modal">
          <div className="image-popup-wrapper">
            <div className="image-popup" onClick={(e) => e.stopPropagation()}>
              <img 
                src={getImageUrl(currentExpandedBlock)} 
                alt={currentExpandedBlock.title || 'Expanded'} 
                className="popup-image"
              />
            </div>
              <div className="popup-text-wrapper">
                <div className="popup-nav-container">
                   <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePrevImage();
                      }}
                      disabled={expandedImageIndex === 0}
                      className="popup-nav-button popup-nav-left"
                    >
                      Last
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNextImage();
                      }}
                      disabled={expandedImageIndex === allGalleryBlocks.length - 1}
                      className="popup-nav-button popup-nav-right"
                    >
                      Next
                    </button>
                  </div>
                <div className="popup-text-container">
                  {/* Only show title and description if they exist */}
                  {(currentExpandedBlock.title || currentExpandedBlock.description) && (
                    <>
                      <h1 className="item-title">
                        {currentExpandedBlock.title || 'Untitled'}
                      </h1>
                      {currentExpandedBlock.description && (
                        <p className="popup-description">
                          {currentExpandedBlock.description}
                        </p>
                      )}
                    </>
                  )}
                  <p className="item-category">
                    {currentExpandedBlock.category.charAt(0).toUpperCase() + currentExpandedBlock.category.slice(1)}
                  </p>
                </div>
                </div>
             </div>
           </div>
      )}

      {blocksWithTitles.map((block, idx) => {
        const imageUrl = getImageUrl(block);
        if (!imageUrl) return null;

        if (block.isDisplay) {
          const displayKey = `display-${block.id}`;
          return (
            <div 
              key={displayKey} 
              ref={el => itemRefs.current[displayKey] = el}
              className="display-block"
              onClick={() => {
                setActiveCategory(block.category);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              <img src={imageUrl} alt={block.title || 'Display'} />
              <div className="display-overlay">
                <div className="display-text-wrap">
                   <h1 
                     className="display-text" 
                     style={getFungalStyle(displayKey)}
                   >
                     {block.title || 'Untitled'}
                   </h1>
                   <h2>{block.description}</h2>
                   <p className="navigation-text">
                     {block.category.charAt(0).toUpperCase() + block.category.slice(1)}
                   </p>
                </div>
              </div>
            </div>
          );
        }

        const blockKey = `${block.id}-${idx}`;
        // Find the index in allGalleryBlocks for proper gallery navigation
        const galleryIndex = allGalleryBlocks.findIndex(b => b.id === block.id);

        return (
          <div 
            key={blockKey} 
            ref={el => itemRefs.current[blockKey] = el}
            className="item-row"
          >
            <img
              src={imageUrl}
              alt={block.title || 'Block'}
              className="item-image"
              onClick={() => setExpandedImageIndex(galleryIndex)}
            />
            <div 
              className="item-content"
              onTouchStart={() => handleTouchStart(block.id, idx)}
              onTouchEnd={handleTouchEnd}
              onClick={() => setExpandedImageIndex(galleryIndex)}
            >
              <h1 className="item-title" style={getFungalStyle(blockKey)}>
                {block.title || 'Untitled'}
              </h1>
              {block.description && (
                <p className="item-description" style={getFungalStyle(blockKey)}>
                  {block.description}
                </p>
              )}
              {block.source?.url && (
                <a
                  href={block.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="show-more-button"
                  onClick={(e) => e.stopPropagation()}
                >
                  Link
                </a>
              )}
              <p className="item-category" style={getFungalStyle(blockKey)}>
                {block.category.charAt(0).toUpperCase() + block.category.slice(1)}
              </p>
            </div>
          </div>
        );
      })}

      {activeCategory !== 'all' && blocksWithoutTitles.length > 0 && (
        <div className="grid-3col">
          {blocksWithoutTitles.map((block, idx) => {
            const imageUrl = getImageUrl(block);
            if (!imageUrl) return null;
            // Find the index in allGalleryBlocks for proper gallery navigation
            const galleryIndex = allGalleryBlocks.findIndex(b => b.id === block.id);
            
            return (
              <img 
                key={`grid-${idx}`}
                src={imageUrl}
                alt={`Grid item ${idx}`}
                onClick={() => setExpandedImageIndex(galleryIndex)}
                style={{ cursor: 'pointer' }}
              />
            );
          })}
        </div>
      )}

      {activeCategory === 'all' && displayedBlocks.length > 20 && showMoreCount < displayedBlocks.length && (
        <div className="show-more-section">
          <button 
            className="show-more-button"
            onClick={() => setShowMoreCount(showMoreCount + 20)}
          >
            See {displayedBlocks.length - showMoreCount} more
          </button>
        </div>
      )}

      <div className="footer-hero">
        <p className="hero-text">
          Thank you for caring for this house with us.
        </p>
      </div>

      <div className="footer-display">
        <div className="display-overlay-inverted">
          <img src={footerImage} alt="Footer display" />
        </div>
      </div>

      {loading && (
        <div className="loading">
          Loading...
        </div>
      )}
    </div>
  );
};

export default SophiaAvenue;
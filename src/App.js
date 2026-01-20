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
  film: '9413-sophia-ave-film'
};

const SophiaAvenue = () => {
  const [activeCategory, setActiveCategory] = useState('all');
  const [contactOpen, setContactOpen] = useState(false);
  const [blocks, setBlocks] = useState({ publication: [], archive: [], film: [] });
  const [loading, setLoading] = useState(true);
  const [showMoreCount, setShowMoreCount] = useState(20);
  const [expandedImage, setExpandedImage] = useState(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const fetchChannel = async (category, slug) => {
      try {
        const channel = await arena.channel(slug).get({ page: 1, per: 100 });
        console.log(`Fetched ${category}:`, channel);
        return { category, blocks: channel.contents || [] };
      } catch (error) {
        console.error(`Error fetching ${category} (${slug}):`, error);
        return { category, blocks: [] };
      }
    };

    const fetchAllChannels = async () => {
      setLoading(true);
      const results = await Promise.all([
        fetchChannel('publication', CHANNEL_SLUGS.publication),
        fetchChannel('archive', CHANNEL_SLUGS.archive),
        fetchChannel('film', CHANNEL_SLUGS.film)
      ]);

      const newBlocks = {};
      results.forEach(({ category, blocks }) => {
        newBlocks[category] = blocks;
      });
      console.log('All blocks loaded:', newBlocks);
      setBlocks(newBlocks);
      setLoading(false);
    };

    fetchAllChannels();
  }, []);

  useEffect(() => {
    if (contactOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [contactOpen]);

  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const progress = Math.min(scrolled / maxScroll, 1);
      setScrollProgress(progress);
      
      document.documentElement.style.setProperty('--scroll-progress', progress);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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
      film: 'The film trailer is ready',
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
    return blocks[activeCategory]?.map(block => ({ ...block, category: activeCategory })) || [];
  };

  const getMostRecentPerCategory = () => {
    return Object.keys(blocks)
      .map(category => {
        const categoryBlocks = blocks[category];
        if (!categoryBlocks || !categoryBlocks.length) return null;
        const sorted = [...categoryBlocks].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        return { ...sorted[0], category };
      })
      .filter(Boolean);
  };

  const getMostRecentBlock = () => {
    const source = activeCategory === 'all' ? getAllBlocks() : blocks[activeCategory] || [];
    if (!source.length) return null;
    return [...source].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0];
  };

  const displayedBlocks = getCurrentBlocks();
  const visibleBlocks = activeCategory === 'all' ? displayedBlocks.slice(0, showMoreCount) : displayedBlocks;
  
  
  // Insert display blocks at specific positions for 'all' view
  const getOrderedBlocks = () => {
    if (activeCategory !== 'all') {
      return visibleBlocks.filter(block => block.title || block.description);
    }

    const displayBlocks = getMostRecentPerCategory();
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
      
      // Insert film at position 2 (after index 1)
      if (idx === 1 && filmBlock) {
        ordered.push({ ...filmBlock, isDisplay: true });
      }
      // Insert publication at position 6 (after index 5)
      if (idx === 5 && publicationBlock) {
        ordered.push({ ...publicationBlock, isDisplay: true });
      }
      // Insert archive at position 8 (after index 7)
      if (idx === 7 && archiveBlock) {
        ordered.push({ ...archiveBlock, isDisplay: true });
      }
    });

    return ordered;
  };

  const blocksWithTitles = getOrderedBlocks();
  const blocksWithoutTitles = visibleBlocks.filter(block => !block.title && !block.description);
  const mostRecentBlock = getMostRecentBlock();

  const getImageUrl = (block) => {
    if (block.image?.display?.url) return block.image.display.url;
    if (block.image?.original?.url) return block.image.original.url;
    return null;
  };

  const getFungalStyle = (category) => {
    if (category === 'publication' || category === 'film') {
      const grow = 100 + scrollProgress * 900;
      const thick = scrollProgress * 100;
      
      return {
        fontFamily: 'FungalVF, Times, serif',
        fontVariationSettings: `"grow" ${grow}, "THCK" ${thick}`
      };
    }
    if (category === 'archive') {
      const grow = 100 + scrollProgress * 900;
      const thick = scrollProgress * 100;
      
      return {
        fontFamily: 'FungalVF, Times, serif',
        fontVariationSettings: `"grow" ${grow}, "THCK" ${thick}`
      };
    }
    return {};
  };

  return (

    <div className="serif">
  {/* Hero Section */}
  <div className="hero-section">
     <p className="hero-text">{getHeroText()}</p>
    <div
      className="hero-bg"
      style={
        activeCategory === 'all' || !mostRecentBlock
          ? undefined
          : { backgroundImage: `url(${getImageUrl(mostRecentBlock)})` }
      }
    />
  </div>


      {/* Navigation */}
      <nav className="sticky-nav">
        {['all', 'publication', 'film', 'archive'].map(cat => (
          <p
            key={cat}
            className={`navigation-text ${activeCategory === cat ? 'active' : ''}`}
            onClick={() => setActiveCategory(cat)}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </p>
        ))}
        <div className="nav-spacer"></div>
      </nav>

      {/* Contact Button */}
      <button
        onClick={() => setContactOpen(!contactOpen)}
        className="contact-button"
      >
        {contactOpen ? 'Exit' : 'Contact'}
      </button>

      {/* Contact Modal */}
      {contactOpen && (
        <div className="contact-modal">
          
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
            <a href="https://www.redhousearchitecture.org/" className="contact-row">
              <span className="contact-role">Institutional Partner</span>
              <span className="contact-name">redhouse studio</span>
            </a>
            <a href="https://www.https://blurry-pictures.com/work.org/" className="contact-row">
              <span className="contact-role">Videography</span>
              <span className="contact-name">Blurry Pictures</span>
            </a>
            <a href="https://www.facebook.com/groups/90189049894/" className="contact-row">
              <span className="contact-role">Lead Contamination Consulting</span>
              <span className="contact-name">Robin Brown</span>
            </a>
            <a href="https://cjcontractorsco.com/" className="contact-row">
              <span className="contact-role">Demolition</span>
              <span className="contact-name">C&J Contractors</span>
            </a>
             <a href="https://www.instagram.com/indigo.bishop/" className="contact-row">
              <span className="contact-role">Community Organizing</span>
              <span className="contact-name">Indigo Bishop</span>
            </a>
             <a href="https://www.clevelandohio.gov/city-hall/office-mayor/taf" className="contact-row">
              <span className="contact-role">Funding</span>
              <span className="contact-name">Cleveland Transformative Arts Fund</span>
            </a> <a href="https://harperdaniel.com" className="contact-row">
              <span className="contact-role">Branding and Website</span>
              <span className="contact-name">Harper Daniel</span>
            </a>
          </div>

          <div className="contact-email-links">
            {[
              { heading: 'Interested in carrying the book?', img: contact1},
              { heading: 'Showing the film?', img: contact2 },
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
      )}

      {/* Item Rows with Display Blocks */}
      {blocksWithTitles.map((block, idx) => {
        const imageUrl = getImageUrl(block);
        if (!imageUrl) return null;

        // Render as display block if marked
        if (block.isDisplay) {
          return (
            <div key={`display-${block.id}`} 
              className="display-block"
              onClick={() => {
                  setActiveCategory(block.category);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
              style={{ cursor: 'pointer' }} // shows it’s clickable
            >
              <img src={imageUrl} alt={block.title || 'Display'} />
              <div className="display-overlay">
                <h2 className="display-text">{block.title || 'Untitled'}</h2>
                <p className="navigation-text display-category">{block.description}</p>
                <p className="navigation-text display-category">{block.category}</p>
              </div>
            </div>
          );
        }

        // Normal item row
        const isExpanded = expandedImage === `${block.category}-${idx}`;
        const fungalStyle = getFungalStyle(block.category);

        return (
          <div key={`${block.category}-${idx}`} className={`item-row ${isExpanded ? 'expanded' : ''}`}>
            <img
              src={imageUrl}
              alt={block.title || 'Block'}
              className="item-image"
              onClick={() => setExpandedImage(isExpanded ? null : `${block.category}-${idx}`)}
            />
            <div className="item-content">
              <h1
                className={`item-title ${block.category === 'archive' ? 'sofia-nav-scroll archive' : ''}`}
                style={block.category === 'archive' ? fungalStyle : {}}
              >
                {block.title || 'Untitled'}
              </h1>
              <p
                className={`item-description ${
                  block.category === 'publication' || block.category === 'film' ? 'sofia-nav-scroll' : ''
                }`}
                style={
                  block.category === 'publication' || block.category === 'film' ? fungalStyle : {}
                }
              >
                {block.description || ''}
              </p>
              {block.source?.url && (
                <a
                  href={block.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="show-more-button"
                >
                  Link
                </a>
              )}
              <p
                className={` item-category sofia-nav-scroll ${block.category}`}
                style={block.category === 'archive' ? fungalStyle : {}}
              >
                {block.category}
              </p>
            </div>
          </div>
        );
      })}

      {/* Grid for blocks without titles */}
      {activeCategory !== 'all' && blocksWithoutTitles.length > 0 && (
        <div className="grid-3col">
          {blocksWithoutTitles.map((block, idx) => {
            const imageUrl = getImageUrl(block);
            if (!imageUrl) return null;
            return (
              <img 
                key={`grid-${idx}`}
                src={imageUrl}
                alt={`Grid item ${idx}`}
              />
            );
          })}
        </div>
      )}

      {/* Show More Button - only shows when there are more than 20 blocks */}
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

      {/* Footer Hero */}
      <div className="footer-hero">
        <p className="hero-text">
          Thank you for caring for this house with us.
        </p>
      </div>

      {/* Inverted Display Block */}
      {mostRecentBlock && getImageUrl(mostRecentBlock) && (
        <div className="footer-display">
          <div className="display-overlay-inverted">
            <img src={footerImage} alt="Footer display" />
          </div>
        </div>
      )}

      {loading && (
        <div className="loading">
          Loading...
        </div>
      )}
    </div>
  );
};

export default SophiaAvenue;
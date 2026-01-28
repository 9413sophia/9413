# 9413 Sophia Avenue Project

A React-based website showcasing the choreographed deconstruction of the built environment through curated Are.na channels featuring publication, film, and archive content.

## Project Overview

This project presents three interconnected Are.na channels in an elegant, scroll-responsive interface with dynamic typography animations using the Fungal VF variable font.

**Live Channels:**

- **Publication**: Documentation and context of the project
- **Film**: Streaming teaser content
- **Archive**: Living documentation of the choreographed deconstruction

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Are.na account with access to the channels

### Installation

1. Clone the repository:

```bash
git clone [your-repo-url]
cd sophia-avenue
```

2. Install dependencies:

```bash
npm install
```

3. Add the Fungal VF font:

   - Place `FungalVF.woff` in `/src/fonts/`
   - Download from: https://velvetyne.fr/fonts/fungal/

4. Add footer image:

   - Place `footer-inverted.jpg` in `/src/images/`

5. Start the development server:

```bash
npm start
```

6. Open [http://localhost:3000](http://localhost:3000)

### Running on Network

To access on other devices (external monitor, phone, etc.):

```bash
npm start -- --host 0.0.0.0
```

Then access via:

- **IPv4**: `http://192.168.x.x:3000` (find your IP with `ipconfig` or `ifconfig`)
- **IPv6**: `http://[2600:1702:6631:730:19e4:5fa3:a112:3c2f]:3000`

## 📁 Project Structure

```
sophia-avenue/
├── src/
│   ├── fonts/
│   │   └── FungalVF.woff          # Variable font file
│   ├── images/
│   │   └── footer-inverted.jpg    # Footer background image
│   ├── App.js                     # Main React component
│   ├── index.css                  # All styling and animations
│   └── index.js                   # Entry point
├── public/
├── package.json
└── README.md
```

## 🎭 Features

### Navigation States

- **All**: Displays all content from all three channels in chronological order
- **Publication**: Shows publication-specific content
- **Film**: Shows film-specific content
- **Archive**: Shows archive-specific content

### Typography Animations

#### 1. Hero Animation (Page Load)

The phrase "choreographed deconstruction" animates on page load using Fungal VF.

**To Edit:** See `index.css` line ~280

```css
.choreographed-animation {
  animation: choreographedGrow 8s ease-in-out forwards;
}

@keyframes choreographedGrow {
  /* Edit grow (100-1000) and THCK (0-100) values */
  0% {
    font-variation-settings: "grow" 100, "THCK" 10;
  }
  /* ... */
}
```

#### 2. Scroll-Tied Animations

Navigation text and category labels animate as you scroll.

**To Edit:** See `index.css` line ~295

```css
.sofia-nav-scroll {
  /* Currently: grow 100→1000, THCK 0→100 */
  font-variation-settings: "grow" calc(100 + var(--scroll-progress) * 900), "THCK"
      calc(var(--scroll-progress) * 100);
}
```

**Customization Examples:**

- Change grow range to 500→1000: `500 + var(--scroll-progress) * 500`
- Change THCK range to 50→100: `50 + var(--scroll-progress) * 50`

### Display Blocks

In the "All" view, the most recent item from each category appears as a full-width "display block" at specific positions:

- **Film**: Position 2 (after 1st regular item)
- **Publication**: Position 6 (after 5th regular item)
- **Archive**: Position 8 (after 7th regular item)

In individual category views (Publication/Film/Archive), the most recent item appears as the hero background.

### Interactive Features

- **Image Expansion**: Click any item row image to expand to full screen
- **Contact Modal**: Click "Contact" to reveal team information with clickable email links
- **Show More**: Loads 20 items at a time, button appears when more content is available
- **Responsive Grid**: Blocks without titles display in a 3-column grid (2 on tablet, 1 on mobile)

## 🔧 Configuration

### Are.na Channel Setup

Update channel slugs in `App.js`:

```javascript
const CHANNEL_SLUGS = {
  publication: "sophia-publication",
  archive: "sofia-archive",
  film: "sofia-film",
};
```

### Contact Information

Update contact details in `App.js` (~line 180):

```javascript
<a href="mailto:malena@9413sophia.com" className="contact-row">
  <span className="contact-role">Project Lead</span>
  <span className="contact-name">Malena Grigoli</span>
</a>
```

## Styling Customization

All styles are in `index.css` with clear section comments:

- **Line ~1-25**: Font definitions and base typography
- **Line ~50-75**: Navigation styling
- **Line ~100-150**: Item row layouts
- **Line ~175-225**: Display blocks
- **Line ~250-280**: Contact modal
- **Line ~280-320**: Typography animations (EDIT HERE)
- **Line ~350+**: Responsive breakpoints

### Color Scheme

Current: Black borders on white background with light blue accents

To change:

```css
/* Search and replace in index.css */
border: 1px solid black; /* Change border color */
background: white; /* Change background color */
background: lightblue; /* Change accent color */
```

## Responsive Breakpoints

- **Desktop**: 992px and up
- **Tablet**: 768px - 991px
- **Mobile**: Below 768px

## Are.na API Updates

The Are.na API provides real-time data, but channels only update when users add/modify content. The site does not auto-refresh - users must reload the page to see new blocks.

**To implement auto-refresh** (optional):

```javascript
// Add to useEffect in App.js
setInterval(() => {
  fetchAllChannels();
}, 300000); // Refresh every 5 minutes
```

## Troubleshooting

### Font Not Loading

- Ensure `FungalVF.woff` is in `/src/fonts/`
- Check browser console for 404 errors
- Clear browser cache

### Are.na Blocks Not Appearing

- Check browser console for API errors
- Verify channel slugs are correct
- Ensure channels are public or you have access

### Animations Not Working

- Verify `--scroll-progress` CSS variable is being set
- Check that Fungal VF font is loaded
- Ensure browser supports variable fonts

### Footer Image Missing

- Place `footer-inverted.jpg` in `/src/images/`
- Update import path if needed

## Dependencies

```json
{
  "react": "^18.x",
  "react-dom": "^18.x",
  "are.na": "^2.x"
}
```

## Deployment

### Build for Production

```bash
npm run build
```

This creates an optimized production build in the `build/` folder.

### Deployment Options

- **Vercel**: Connect GitHub repo for automatic deployments
- **Netlify**: Drag and drop `build/` folder or connect repo
- **GitHub Pages**: Use `gh-pages` packag

## Team

- **Project Lead**: Malena Grigoli
- **Photographer**: Colin Martinez
- **Website design and dev**: Harper Daniel

## Acknowledgments

- Typography: [Fungal VF by Velvetyne Type Foundry](https://velvetyne.fr/fonts/fungal/)
- Content Platform: [Are.na](https://are.na)

---

**Contact**: contact@9413sophia.com

**Last Updated**: January 2026

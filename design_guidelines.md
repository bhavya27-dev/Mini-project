# Design Guidelines: Rural Entrepreneurship Scheme Platform

## Design Approach

**Hybrid Approach**: Drawing from accessibility-focused government portals (India.gov.in, MyGov) combined with simplified e-commerce patterns (Flipkart's vernacular interface) and visual-first design principles for low-literacy users.

**Core Principle**: Visual communication over text. Every feature must be understandable through icons, colors, and illustrations before reading any text.

## Typography System

**Primary Font**: Noto Sans (via Google Fonts CDN) - excellent multilingual support for Kannada, Hindi, and English
**Font Hierarchy**:
- Hero/Page Titles: 3xl to 4xl (48-56px), font-bold
- Section Headers: 2xl (32px), font-semibold  
- Card Titles: xl (24px), font-medium
- Body Text: lg (20px), font-normal - LARGER than typical for readability
- Labels/Metadata: base (16px), font-medium
- Minimum text size: 16px (never smaller)

## Layout & Spacing System

**Tailwind Spacing Units**: Use 4, 6, 8, 12, 16 for consistency
- Component padding: p-6 or p-8
- Section spacing: py-12 or py-16
- Card gaps: gap-6 or gap-8
- Margins: m-4, m-6, m-8

**Container System**:
- Max width: max-w-7xl for main content
- Full-width sections with inner containers
- Mobile-first: Always stack to single column on mobile

## Visual Language

**Color Coding Strategy** (specific colors to be defined later):
- Agriculture/Farming schemes: One color family
- Business/Entrepreneurship: Different color family  
- Women empowerment: Another color family
- Education/Training: Distinct color family
- Status indicators: Success, Warning, Error, Pending states
- High contrast throughout for visibility

**Icon System**: Use Font Awesome (via CDN)
- Every scheme category gets a large icon (4xl size)
- Application status with icon indicators
- Navigation with icon + text combinations
- Form steps with numbered icons
- Document types with representative icons

## Component Library

### Navigation
- **Top Bar**: Large logo, language switcher (flags + text), user menu with avatar
- **Language Switcher**: Prominent placement, flags for Kannada/Hindi/English with text labels
- **Mobile**: Hamburger menu with full-screen overlay, large touch targets (min 48px)

### Dashboard Layout
**Grid-based Cards** (not tables):
- Applied Schemes: Large cards with scheme icon, title, status badge, progress bar, "View Details" button
- Recommended Schemes: Visual cards with hero image, category icon, scheme name, 2-3 key benefits with icons, "Apply Now" CTA
- Draft Applications: Cards with completion percentage ring, resume button
- Profile Section: Avatar with edit button, key info with icons

### Scheme Catalog
**Filtering Sidebar** (desktop) / **Filter Sheet** (mobile):
- Category chips with icons (Agriculture, Business, Women, Education, etc.)
- Location dropdown with state/district
- Eligibility checkboxes with icons
- Income range slider with visual indicator
- "Clear All" and "Apply Filters" buttons

**Scheme Cards**:
- Large category icon at top
- Scheme title (2xl, bold)
- 3-4 key benefits with checkmark icons
- Eligibility tags (colored chips)
- Deadline with calendar icon
- Large "Learn More" button

### Scheme Detail Page
**Hero Section**: 
- Large scheme category illustration/icon
- Scheme name (4xl heading)
- Category badge
- Application deadline with countdown if urgent

**Content Sections** (each with icon header):
1. **Eligibility Checklist**: Large checkboxes with icons, visual yes/no indicators
2. **Benefits**: Icon + text cards in grid (3 columns desktop, 1 mobile)
3. **Required Documents**: Document cards with document icon, name, sample image preview
4. **How to Apply**: Numbered step cards with illustrations
5. **Important Dates**: Timeline visualization
6. **FAQs**: Expandable accordion with large touch targets

**Sticky CTA Bar**: "Start Application" button fixed at bottom on mobile

### Application Forms
**Multi-Step Progress**:
- Visual progress bar with icons for each step
- Current step highlighted, completed steps with checkmarks
- Step titles in large text

**Form Design**:
- One question per screen on mobile (for simplicity)
- Large input fields with clear labels above
- Helper text with examples
- Icon indicators for field type (phone, email, number)
- Document upload with drag-drop area, preview thumbnails
- "Save Draft" button on every step
- "Previous" and "Next" buttons, large and clear

### Chatbot Interface
**Floating Button**: Bottom-right corner, large (64px), pulsing animation, chat icon + "Help" text

**Chat Window**:
- Full-screen on mobile, 400px wide panel on desktop
- Language selector at top
- Message bubbles with user/bot avatars
- Suggested questions as chip buttons
- Voice input button for low-literacy support
- Quick actions: "Check Eligibility", "Find Schemes", "Application Status"

### Status & Feedback
**Application Status Timeline**:
- Vertical timeline with icons
- Color-coded status points
- Date stamps
- Current status highlighted and animated

**Success/Error Messages**:
- Toast notifications with icons
- Large, clear text
- Green/red color coding
- Action buttons when needed

### Admin Panel
**Simplified Layout**:
- Side navigation with icons + labels
- Data tables with action buttons (Edit, Delete, View)
- Scheme management forms similar to user application forms
- Application review interface with approve/reject buttons
- Status update dropdowns with color indicators

## Responsive Breakpoints
- Mobile: base (< 768px) - Single column, full-width cards
- Tablet: md (768px - 1024px) - 2-column grids
- Desktop: lg (> 1024px) - 3-column grids, sidebar layouts

## Images

**Hero Images**: 
- Dashboard: Illustration of Indian farmers/entrepreneurs using technology (warm, optimistic tone)
- Scheme catalog: No hero image, focus on filter + cards
- Individual scheme pages: Category-specific illustrations (farming equipment, business setup, education, etc.)

**Card Images**:
- Scheme cards: Category icons or simple illustrations representing the scheme type
- Profile avatars: Default avatar icons with upload option
- Document previews: Thumbnail representations of uploaded documents

**Placement**:
- Dashboard hero: Top section, 40% viewport height on desktop
- Scheme detail hero: Top section with overlaid title and badge
- Inline illustrations: Between major sections to break up text
- Empty states: Center-aligned illustrations when no data exists

All images should feature diverse representation of Indian rural communities, warm color tones, and optimistic messaging.
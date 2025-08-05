# BidFlow Personal Edition

This repository contains the General Contracting Price Proposal Template used by Elite SD Construction's BidFlow (Personal Edition). It is provided as-is for internal use and future development.

## 🏗️ Architecture Overview

### Current Template (Legacy)
This repository contains the original General Contracting Price Proposal Template - a foundational document that has been used for manual proposal generation.

### New BidFlow System (In Development)
AI-powered field estimating tool for construction contractors. Transform your site measurements and voice descriptions into professional proposals in minutes.

## 🎯 Core Features

- **📱 Mobile Field Capture**: Quick LF/SF/CF measurements with photos
- **🎤 Voice-to-Scope**: AI converts voice descriptions to organized scope of work  
- **🧠 Smart Pricing**: AI research for materials and labor costs
- **⚡ Instant Estimates**: Complete estimates in minutes, not hours
- **📄 Professional Proposals**: Branded PDF proposals ready to send
- **🔄 Follow-up Automation**: Automated client communication sequences

## 🚀 Workflow

```
Site Visit → Measure (LF/SF/CF) → Voice Description → AI Processing → Complete Estimate → Professional Proposal → Follow-up
```

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 + TypeScript + Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 + Vision API
- **Email**: Resend
- **Mobile**: PWA (Progressive Web App)

## 📱 Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- OpenAI API key

### Setup

1. **Clone the repository**
```bash
git clone https://github.com/YOUR_USERNAME/bidflow-personal.git
cd bidflow-personal
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment setup**
```bash
cp .env.example .env.local
# Add your API keys to .env.local
```

4. **Database setup**
```bash
# Set up Supabase tables (instructions in docs/database.md)
```

5. **Run development server**
```bash
npm run dev
```

Visit `http://localhost:3000` to see the app.

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # Run TypeScript check
```

### Project Structure

```
src/
├── app/                 # Next.js app router
├── components/
│   ├── ui/             # shadcn/ui components
│   ├── measurement/    # Field measurement tools
│   ├── ai/            # AI processing components
│   └── estimate/      # Estimate generation
├── lib/               # Utilities and configurations
├── types/             # TypeScript type definitions
└── utils/             # Helper functions
```

## 📊 Features Roadmap

### Phase 1: Core Field Tool ✅
- [x] Mobile measurement capture
- [x] Voice recording and transcription
- [x] Basic AI scope organization
- [x] Simple pricing calculations

### Phase 2: AI Enhancement 🚧
- [ ] Advanced pricing research
- [ ] Labor classification engine
- [ ] Complete estimate compilation
- [ ] Professional proposal generation

### Phase 3: Automation 📋
- [ ] Follow-up automation
- [ ] Client portal
- [ ] Performance analytics
- [ ] Mobile app optimization

## 🤝 Contributing

This is a personal project for Elite SD Construction. Internal development only.

## 📄 License

MIT License - see LICENSE file for details.

## 🆘 Support

For questions or issues, contact the development team or create an issue in this repository.

---

**Built for contractors, by contractors. Make bidding fast, accurate, and profitable.**
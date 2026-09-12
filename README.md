# Liquidity Intelligence DApp

Real-time liquidity hunting and monitoring dashboard for decentralized finance.

## 🚀 Features

- **Multi-Platform Integration**: Pump.fun, Flap.sh, DexScreener, GeckoTerminal
- **Real-time Monitoring**: Live price tracking and liquidity pools
- **Hunter System**: Automated trading strategy execution
- **Dashboard**: Comprehensive analytics and performance metrics
- **API Integration**: RESTful backend with WebSocket support

## 📋 Project Structure

```
apps/
├── web/              # Next.js frontend dashboard
│   ├── src/
│   │   ├── app/     # Next.js app directory
│   │   ├── components/  # React components
│   │   ├── services/    # API integration services
│   │   ├── types/       # TypeScript type definitions
│   │   ├── hooks/       # Custom React hooks
│   │   └── lib/         # Utility functions
│   └── package.json
└── api/              # Fastify backend server
    ├── src/
    │   └── server.ts
    └── package.json
```

## 🛠 Tech Stack

### Frontend
- **Framework**: Next.js 16.3.5
- **UI Library**: React 19
- **Charts**: Recharts
- **Styling**: Tailwind CSS
- **Language**: TypeScript

### Backend
- **Framework**: Fastify
- **Language**: TypeScript
- **Database**: PostgreSQL (pg)
- **Cache**: Redis (ioredis)
- **WebSocket**: ws

## 📦 Installation

### Prerequisites
- Node.js 24.18.0
- Bun 1.2.15
- npm or yarn

### Setup

1. **Clone and Install**
```bash
git clone <repository>
cd liquidity-intelligence-dapp
npm install
```

2. **Configure Environment**
```bash
cp apps/web/.env.local.example apps/web/.env.local
# Edit .env.local with your API endpoints
```

3. **Install Dependencies**
```bash
cd apps/web
npm install --legacy-peer-deps
cd ../api
npm install
cd ../..
```

## 🚀 Development

### Start Frontend
```bash
cd apps/web
npm run dev
# Open http://localhost:3000
```

### Start Backend
```bash
cd apps/api
npm run dev
# Server runs on http://localhost:8080
```

## 🏗 Building

### Production Build
```bash
npm run build
```

### Type Checking
```bash
cd apps/web && npm run type-check
cd ../api && npm run type-check
```

## 📊 API Routes

### Dashboard
- `GET /api/dashboard` - Get dashboard data (portfolio, trades, hunters)

### Tokens
- `GET /api/tokens` - List all tokens
- `GET /api/tokens/:address` - Get token details
- `GET /api/tokens/:address/chart` - Get price chart

### Hunters
- `GET /api/hunters` - List active hunters
- `POST /api/hunters` - Create new hunter
- `PUT /api/hunters/:id` - Update hunter
- `DELETE /api/hunters/:id` - Delete hunter

## 🔗 Integrated Platforms

### Pump.fun
- Token discovery and monitoring
- Price tracking
- Volume analysis

### Flap.sh
- Hot token alerts
- Trading signals
- Market analysis

### DexScreener
- DEX pair data
- Liquidity pools
- Trading pairs

### GeckoTerminal
- Multi-chain support
- Trending pools
- Token performance

## 🔒 Security

- TypeScript strict mode enabled
- Input validation on all endpoints
- Rate limiting (to be implemented)
- CORS configuration
- Environment variable protection

## 📝 Environment Variables

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8080

# Platform APIs
NEXT_PUBLIC_PUMP_FUN_API=https://api.pump.fun
NEXT_PUBLIC_FLAP_SH_API=https://api.flap.sh
NEXT_PUBLIC_DEX_SCREENER_API=https://api.dexscreener.com
NEXT_PUBLIC_GECKO_TERMINAL_API=https://www.geckoterminal.com/api

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/liquidity_db
REDIS_URL=redis://localhost:6379
```

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## 📄 License

MIT

## 💬 Support

For support, open an issue or contact the development team.

---

**Last Updated**: 2026-09-12
**Build Status**: ✅ TypeScript strict mode | ✅ All dependencies fixed | ✅ Dashboard complete

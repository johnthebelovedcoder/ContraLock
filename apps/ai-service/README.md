# ContraLock AI Service

This service handles all AI-powered features for the ContraLock platform as described in the PRD.

## Features
- Smart milestone generation based on project descriptions
- Intelligent deliverable matching against acceptance criteria
- Predictive dispute prevention
- AI-assisted dispute resolution
- Smart contract recommendations
- Market rate analysis

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file with the following variables:
```env
PORT=3002
OPENAI_API_KEY=your-openai-api-key-here
FRONTEND_URL=http://localhost:3000
```

3. Run the development server:
```bash
npm run dev
```

## API Endpoints

### Versioned API (Recommended)
All API endpoints are available under the `/api/v1/` prefix for versioning:

- `POST /api/v1/ai/milestone-suggestions` - Get AI suggestions for project milestones
- `POST /api/v1/ai/verify-deliverable` - Check if deliverable meets acceptance criteria
- `POST /api/v1/ai/dispute-analysis` - AI analysis of disputes

### Legacy API (For backward compatibility)
All API endpoints are also available without versioning for backward compatibility:

- `POST /api/ai/milestone-suggestions` - Get AI suggestions for project milestones
- `POST /api/ai/verify-deliverable` - Check if deliverable meets acceptance criteria
- `POST /api/ai/dispute-analysis` - AI analysis of disputes
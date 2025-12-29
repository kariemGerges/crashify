# Crashify

**AI-Assisted Vehicle Damage Assessment Platform**

Crashify is an enterprise-level vehicle damage assessment platform designed for insurance companies, fleet managers, and assessing firms across Australia. The platform streamlines the assessment process with AI automation, professional coordination, and delivers comprehensive reports within 48 hours.

## Features

### Core Services

-   **Accident Damage Assessment** - Desktop (photo-based) and on-site physical inspections
-   **Post-Repair Inspection** - Quality verification and cost analysis
-   **Third-Party Repair Cost Analysis** - Line-by-line quote review
-   **Total Loss Evaluation** - Market valuation and WOVR management
-   **Heavy Machinery Assessment** - Agricultural, construction, and commercial vehicles
-   **End-of-Lease Inspections** - Comprehensive vehicle condition reports

### Key Capabilities

-  **48-hour average turnaround** (vs. 7-10 days industry standard)
-  **20-40% average cost savings** on inflated repair costs
-  **AI-powered damage analysis** with human assessor verification
-  **Automated email processing** for assessment requests
-  **AI chatbot** (Google Gemini) for customer support
-  **Comprehensive admin dashboard** for managing assessments and claims
-  **Role-based access control** (Admin, Super Admin, Assessor, etc.)
-  **Stripe payment integration** for secure transactions
-  **Responsive design** with modern UI/UX

## 🛠️ Tech Stack

### Frontend

-   **Next.js 16** - React framework with App Router
-   **React 19** - UI library
-   **TypeScript** - Type safety
-   **Tailwind CSS 4** - Styling
-   **Framer Motion** - Animations
-   **Lucide React** - Icons
-   **Recharts** - Data visualization

### Backend

-   **Next.js API Routes** - Serverless API endpoints
-   **Prisma** - Database ORM
-   **Supabase** - Backend-as-a-Service (PostgreSQL, Auth, Storage)
-   **PostgreSQL** - Primary database

### AI & Services

-   **Google Gemini AI** - Chatbot and AI analysis
-   **Anthropic Claude** - Photo analysis
-   **Resend** - Email delivery
-   **Brevo** - Email marketing
-   **Stripe** - Payment processing
-   **Twilio** - SMS notifications

### Development Tools

-   **Turbopack** - Fast bundler
-   **ESLint** - Code linting
-   **Prettier** - Code formatting
-   **TypeScript** - Type checking

## 📋 Prerequisites

-   **Node.js** 18+ (recommended: 20+)
-   **pnpm** (package manager)
-   **PostgreSQL** database (via Supabase or self-hosted)
-   **Supabase** account and project

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd crashify
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory with the following variables:

#### Required Variables

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### Optional (but recommended) Variables

```env
# Email Services
RESEND_API_KEY=your_resend_api_key
IMAP_HOST=imap.secureserver.net
IMAP_PORT=993
IMAP_USER=your_email@domain.com
IMAP_PASSWORD=your_email_password
EMAIL_PROCESSOR_TOKEN=your_secure_token_for_cron_jobs

# Payment Processing
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

# AI Services
GEMINI_API_KEY=your_google_gemini_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# SMS (Optional)
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

### 4. Database Setup

#### Using Supabase (Recommended)

1. Create a new Supabase project
2. Run migrations from `supabase/migrations/` directory
3. Update your `.env.local` with Supabase credentials

#### Using Prisma

```bash
# Generate Prisma Client
pnpm prisma generate

# Run migrations
pnpm prisma migrate dev

# (Optional) Open Prisma Studio
pnpm prisma studio
```

### 5. Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

##  Project Structure

```
crashify/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── admin/        # Admin endpoints
│   │   │   ├── assessments/  # Assessment management
│   │   │   ├── claims/       # Claims processing
│   │   │   ├── chatbot/      # AI chatbot API
│   │   │   ├── email/        # Email processing
│   │   │   └── payments/     # Stripe integration
│   │   ├── components/       # React components
│   │   │   ├── Admin/        # Admin dashboard components
│   │   │   ├── HomePage/     # Landing page sections
│   │   │   └── ...
│   │   ├── pages/            # Public pages
│   │   │   ├── (main)/      # Main layout pages
│   │   │   └── (minimal)/   # Minimal layout pages
│   │   └── ...
│   ├── server/               # Server-side code
│   │   ├── lib/             # Shared libraries
│   │   │   ├── config/      # Configuration
│   │   │   ├── services/    # Business logic services
│   │   │   └── supabase/    # Supabase clients
│   │   ├── models/          # Data models
│   │   └── types/           # TypeScript types
│   └── generated/           # Generated code (Prisma, etc.)
├── prisma/
│   ├── schema.prisma        # Database schema
│   └── migrations/          # Database migrations
├── supabase/
│   └── migrations/          # Supabase migrations
├── public/                  # Static assets
├── scripts/                 # Utility scripts
└── ...
```

##  Available Scripts

```bash
# Development
pnpm dev              # Start development server with Turbopack

# Production
pnpm build            # Build for production with Turbopack
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint

# Database
pnpm prisma generate  # Generate Prisma Client
pnpm prisma migrate  # Run database migrations
pnpm prisma studio   # Open Prisma Studio GUI
```

##  Deployment

### Vercel (Recommended)

The project is configured for Vercel deployment with:

-   Automatic builds on push
-   Cron jobs for email processing (configured in `vercel.json`)
-   Environment variable management

1. Connect your repository to Vercel
2. Add all required environment variables in Vercel dashboard
3. Deploy!

### Cron Jobs

The following cron jobs are configured (see `vercel.json`):

-   **Email Processing**: Runs daily at 8:00 AM UTC (`/api/cron/email-process`)
-   **Overdue Check**: Runs daily at 9:00 AM UTC (`/api/cron/check-overdue`)

##  Authentication & Authorization

The application uses Supabase Auth with role-based access control:

-   **Admin** - Full system access
-   **Super Admin** - Extended admin privileges
-   **Assessor** - Assessment creation and review
-   **User** - Standard user access

## Email Processing

The platform includes automated email processing with support for both modern OAuth2 and legacy IMAP:

-   **Microsoft Graph API (OAuth2)** - Recommended for Microsoft 365/Outlook accounts
-   **IMAP (Legacy)** - For non-Microsoft email providers
-   Automatic assessment request extraction
-   Email-to-assessment conversion
-   Support for multiple email providers (GoDaddy, Outlook, etc.)

### Microsoft Graph API OAuth2 Setup

For Microsoft 365 accounts, OAuth2 authentication is recommended. See [OAUTH2_SETUP.md](./OAUTH2_SETUP.md) for detailed step-by-step instructions.

**Quick Setup:**

1. Register an app in [Azure Portal](https://portal.azure.com/)
2. Create a client secret
3. Add API permissions: `Mail.Read`, `Mail.ReadWrite`
4. Grant admin consent
5. Add to `.env.local`:
   ```env
   MICROSOFT_CLIENT_ID=your-client-id
   MICROSOFT_CLIENT_SECRET=your-client-secret
   MICROSOFT_TENANT_ID=your-tenant-id  # Optional
   MICROSOFT_USER_EMAIL=info@crashify.com.au
   ```

The system automatically uses Graph API if OAuth2 credentials are configured, otherwise falls back to IMAP.

## AI Features

-   **Chatbot**: Google Gemini-powered customer support chatbot
-   **Photo Analysis**: AI-assisted damage detection (with human verification)
-   **Document Processing**: PDF and image analysis for assessments

## Key Features

### Admin Dashboard

-   Comprehensive assessment management
-   Claims processing and tracking
-   User management
-   Analytics and reporting
-   Review queue management

### Claims System

-   Token-based claim submission
-   Secure claim access
-   Multi-step assessment workflow
-   Document upload and management

### Assessment Workflow

1. Request submission (via web form or email)
2. AI-powered initial analysis
3. Professional assessor review
4. Report generation
5. Delivery within 48 hours

## 🛡️ Security

-   Environment variable validation at startup
-   CSRF protection
-   Secure token-based authentication
-   Role-based access control
-   Input validation and sanitization
-   Secure API endpoints with authentication

## License

Private - All rights reserved

## Contact

-   **Phone**: 1300 655 106
-   **Email**: info@crashify.com.au
-   **Address**: 81-83 Campbell St, Surry Hills NSW 2010
-   **Website**: https://crashify.com.au

## Contributing

This is a private project. For contributions or questions, please contact the development team.

---

**Built with ❤️ for the Australian insurance and fleet management industry by Kariem Gerges**

# 🧭 SchemeNavigator — Your Guide to Government Schemes, Simplified

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live_Demo-Visit_App-0F766E?style=for-the-badge&logo=google-chrome&logoColor=white)](https://aidivi265.github.io/Scheme-Navigator-App/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Scheme--Navigator--App-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/aidivi265/Scheme-Navigator-App)
[![React 19](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS v4](https://img.shields.io/badge/Tailwind_CSS_v4-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Django REST](https://img.shields.io/badge/Django_REST-092E20?style=for-the-badge&logo=django&logoColor=white)](https://www.django-rest-framework.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

**DISCOVER → UNDERSTAND → APPLY**  
*A personalized, transparent, and privacy-first government scheme discovery and guidance platform for citizens in India.*

[🌐 **Explore Live Application**](https://aidivi265.github.io/Scheme-Navigator-App/) • [🚀 **Quick Start**](#-quick-start) • [✨ **Key Features**](#-key-features) • [🏛️ **Architecture**](#️-system-architecture) • [📜 **Disclaimer**](#-official-disclaimer)

</div>

---

## 📖 About SchemeNavigator

Navigating government welfare schemes can often feel like an overwhelming maze of fragmented information, complex gazettes, and unclear eligibility requirements.

**SchemeNavigator** acts as an intelligent navigational compass connecting citizens to authentic central and state public welfare programs:

- **Zero Scheme Knowledge Needed**: Start simply with *"Tell us about yourself"*.
- **100% Privacy-First**: No Aadhaar number, PAN card, or sensitive credentials required.
- **Explainable Match Scoring**: Deterministic rule-based compatibility engine (0–100%) with step-by-step criteria breakdown.
- **Plain Language & Checklists**: Plain-language summaries, exact financial benefit estimates, required document checklists, and application milestones.
- **Authentic Redirection**: Safe pre-flight verification before routing to official `.gov.in` and `.nic.in` portals.

---

## ✨ Key Features

### 1. 🌟 First-Time User Welcome & Animated Tour
- **Welcome Modal**: Floating welcome card on first launch with instant options to take a guided tour, start the eligibility survey, or explore independently.
- **Interactive Tour (`react-joyride`)**: A 5-step floating spotlight walkthrough covering:
  $$\text{Survey} \longrightarrow \text{Recommendations} \longrightarrow \text{Save} \longrightarrow \text{Track} \longrightarrow \text{AI Advisor}$$
- **Replay Anytime**: Quick **"Tour ✨"** button accessible in the desktop header, mobile menu, and footer.

### 2. 📋 6-Step Citizen Eligibility Survey (`/survey`)
- **Personal Details**: Age, Gender, Marital Status.
- **Location**: State/UT and District dynamic mapping.
- **Social Background**: Caste category (General/OBC/SC/ST/Minority), Divyangjan (Disability) status, and BPL/EWS economic status.
- **Occupation & Employment**: Farmer, Student, MSME Entrepreneur, Daily Wage Worker, Unemployed, etc.
- **Household Income**: Annual income bracket calibration.
- **Live Review & Validation**: Instant editability of responses before calculation.

### 3. 🎯 Smart Match Engine & Transparent Fit Scores
- Deterministic compatibility engine scoring across 100+ Central and State welfare programs.
- Real-time explainability breakdown showing which eligibility criteria matched and why.

### 4. 🧭 National Scheme Catalog (`/explore`)
- Search across 100+ schemes by keyword, ministry, target demographic, or benefit type.
- Category filters: Agriculture, Education & Scholarships, MSME & Business, Healthcare, Women & Child Welfare, Housing, Pensions & Social Security.

### 5. 📄 Comprehensive Scheme Details (`/schemes/:id`)
- Summary of benefits and grant amounts formatted in Indian currency.
- Required documents checklist (Income Certificate, Domicile, Land records, etc.).
- Step-by-step application roadmap.
- Safe external link pre-flight modal verifying official government domain origins.

### 6. 📌 Citizen Locker & Application Tracker (`/dashboard`)
- Save and bookmark schemes to your personal locker with 1 click.
- Application status tracker with milestones: *Exploring*, *Documents Needed*, *Ready to Apply*, *Applied Externally*, *Completed*.

### 7. 🤖 Multilingual AI Scheme Advisor (`/assistant`)
- Grounded conversational assistant answering natural language questions about eligibility, deadlines, and required certificates.
- Floating advisor button (`ChatbotFAB`) available across the app.

### 8. 🇮🇳 Multilingual Translation
- Instant localization across major Indian languages: English, Hindi (हिंदी), Bengali (বাংলা), Telugu (తెలుగు), Marathi (मराठी), Tamil (தமிழ்), Gujarati (ગુજરાતી), Urdu (اردو), Kannada (ಕನ್ನಡ), Odia (ଓଡ଼ିଆ), Malayalam (മലയാളം), and Punjabi (ਪੰਜਾਬੀ).

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 + TypeScript + Vite 8
- **Styling**: Tailwind CSS v4 + Custom Theme Design Tokens
- **Icons**: Lucide React
- **Animations & Tour**: Framer Motion + Canvas Confetti + React-Joyride
- **Routing**: React Router v7 (`HashRouter` for zero-configuration static deployment)
- **State & Storage**: React Context + Storage Service (`localStorage` browser persistence)

### Backend & AI Agents
- **Framework**: Django 5 + Django REST Framework
- **Database**: PostgreSQL / SQLite with JSONB schema flexibility
- **Cache & Queue**: Redis
- **AI Orchestration**: LiteLLM (Gemini / OpenAI / Anthropic / Local Ollama)
- **Agent Architecture**:
  - `profile_agent.py`: Extracts user parameters from unstructured conversational input
  - `recommendation_agent.py`: Multi-criteria scoring and personalized reasoning
  - `assistant_agent.py`: Multilingual citizen support chatbot

---

## 📁 Project Structure

```
Frontend-SN-NEW-main/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automated GitHub Pages CI/CD workflow
├── Frontend-Scheme-Navigator-main/ # React Frontend Application
│   ├── public/                     # Static assets & favicons
│   ├── src/
│   │   ├── components/
│   │   │   ├── assistant/          # AI chat components
│   │   │   ├── common/             # Navbar, Footer, OnboardingTour, FAB, LanguageSelector
│   │   │   ├── dashboard/          # Tracker & Saved schemes components
│   │   │   ├── home/               # Hero, HowItWorks, Stats, FAQs, Personas
│   │   │   ├── schemes/            # Scheme cards, filters, detail modals
│   │   │   └── survey/             # 6-step survey wizard & voice input modal
│   │   ├── constants/              # Categories, steps, language lists
│   │   ├── data/                   # 100+ curated schemes seed data
│   │   ├── hooks/                  # Translation & voice recognition hooks
│   │   ├── layouts/                # RootLayout wrapper
│   │   ├── pages/                  # All top-level page views
│   │   ├── services/               # API clients & deterministic matching engine
│   │   ├── store/                  # Global AppStore provider
│   │   └── types/                  # TypeScript domain models
│   ├── package.json
│   ├── vite.config.ts
│   └── vercel.json
│
├── backend/                        # Django REST API & Multi-Agent Backend
│   ├── config/                     # Settings, URL routing, health checks
│   ├── schemes/                    # Scheme catalog, models, and CSV/API loaders
│   ├── sessions_app/               # Anonymous session management & survey endpoints
│   ├── tracker/                    # Saved schemes and milestone tracker
│   ├── assistant/                  # AI chat conversation endpoints
│   ├── agents/                     # Profile, Recommendation & Chat AI agents
│   ├── manage.py
│   ├── requirements.txt
│   └── Dockerfile
│
├── scripts/
│   └── export_frontend_schemes_to_csv.py
├── docker-compose.yml
└── README.md
```

---

## 🚀 Quick Start

### Frontend (React + Vite)

1. **Navigate to the frontend folder**:
   ```bash
   cd Frontend-Scheme-Navigator-main
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the local development server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. **Build for production**:
   ```bash
   npm run build
   ```

---

### Backend (Django REST Framework)

1. **Navigate to the backend folder**:
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # macOS / Linux:
   source .venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Setup environment variables**:
   ```bash
   cp .env.example .env
   # Set your database credentials and LITELLM_API_KEY / LITELLM_MODEL
   ```

5. **Run database migrations and seed data**:
   ```bash
   python manage.py migrate
   python manage.py import_schemes --source csv --file ../schemes_seed.csv
   ```

6. **Start the development server**:
   ```bash
   python manage.py runserver
   ```
   Backend API will be accessible at [http://localhost:8000/api/](http://localhost:8000/api/).

---

### Docker Setup (Fullstack)

Run the entire stack with PostgreSQL and Redis in one command:

```bash
cp backend/.env.example backend/.env
docker-compose up --build
```

---

## 🌐 Live Deployment (CI/CD)

The frontend is continuously built and deployed to **GitHub Pages** on every push to the `master` branch via [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml).

- **Live URL**: [https://aidivi265.github.io/Scheme-Navigator-App/](https://aidivi265.github.io/Scheme-Navigator-App/)

---

## 📜 Official Disclaimer

> **Transparency Notice:**  
> SchemeNavigator is an independent, open informational discovery and guidance platform created to assist Indian citizens in discovering public welfare programs.  
> SchemeNavigator is **not affiliated with, endorsed by, or an official department of any Government of India ministry or state administration**. SchemeNavigator does not collect official government applications, process approvals, or disburse funds. All final applications and verifications occur exclusively on designated official government portals (`.gov.in` / `.nic.in`).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">
Made with ❤️ to empower citizens across India with transparent, accessible welfare information.
</div>

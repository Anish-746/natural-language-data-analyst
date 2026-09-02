# Autonomous SQL Analytics Engine 

An AI-powered, full-stack web application that allows users to explore an e-commerce database using plain English.

## The Problem It Solves

Business stakeholders often need data insights but lack the SQL expertise to query databases directly. Traditional dashboards are inflexible, requiring engineering time for every new request. The **Autonomous SQL Analytics Engine** acts as a virtual data scientist, translating plain English questions into secure, optimized, and read-only SQL queries, executing them instantly, and dynamically visualizing the results.

## Tech Stack

- **Frontend:** React 19, Vite, TailwindCSS (v4), Recharts
- **Backend:** Node.js, Express
- **Real-Time Communication:** Socket.io
- **Database:** PostgreSQL
- **AI & Agents:** Google Gemini (via `@langchain/google-genai`), LangChain (ReAct Agent Architecture)
- **Security:** `pgsql-ast-parser` (AST-based SQL validation)

## Key Features

- **Agentic AI Architecture:** Uses LangChain to power a ReAct agent that intelligently reads database schemas, generates SQL, and self-corrects if execution fails.
- **Real-Time Terminal Streaming:** Socket.io streams the agent's thought process, tool invocations, and execution status to the frontend in real time, creating an engaging UX.
- **Robust AST Security Validation:** Prevents SQL injections and destructive queries by parsing the AST of AI-generated SQL to ensure it is strictly a `SELECT` statement targeting authorized tables, enforcing hard row limits.
- **Dynamic Visualizations:** Automatically infers the shape of the SQL result set to render the most appropriate Recharts component (Bar, Line, or Data Table).
- **Strict Role Isolation:** Backend accesses the database using an explicit `readonly` role to physically prevent any `INSERT`, `UPDATE`, or `DELETE` operations at the DB level.

## Folder Structure

```text
.
├── backend/
│   ├── index.js            # Express & Socket.io entry point
│   ├── src/
│   │   ├── agents/         # LangChain Agent definitions and tools
│   │   ├── config/         # DB Connection configuration
│   │   ├── routes/         # API Routes (e.g., /api/query)
│   │   ├── tools/          # SQL execution and Schema Lookup tools
│   │   └── utils/          # AST SQL safety validator & Logger
│   └── tests/              # Vitest test suite for security validation
└── frontend/
    ├── src/
    │   ├── components/     # React Components (ChatInput, Terminal, Visualizer)
    │   ├── hooks/          # Custom hooks (e.g., useSocket)
    │   ├── services/       # API abstraction
    │   ├── App.jsx         # Main Application Layout
    │   └── index.css       # Global styles and Tailwind configuration
    └── package.json
```

## Setup Instructions

### 1. Prerequisites
- Node.js (v18+)
- A PostgreSQL database (e.g., Supabase, local Postgres)
- Google Gemini API Key

### 2. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables:
   Copy `.env.example` to `.env` and fill in your Gemini API key and Postgres URLs.
   ```bash
   cp .env.example .env
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite dev server:
   ```bash
   npm run dev
   ```

### 4. Running Tests
The backend uses Vitest to enforce the security of the AST-based SQL validator.
```bash
cd backend
npm run test
```

# RentShield CC: Rental Electronics & Damage Settlement System

RentShield CC is a premium, high-contrast, theme-resilient web application designed for electronic device rental management, automated damage triage, and secure deposit reconciliation.

---

## 🛠️ Project Stack & Technologies

- **Frontend**: React 18, Vite (for rapid build cycles), Vanilla CSS (premium high-contrast, custom glassmorphism design system).
- **Backend**: Node.js, Express.js (REST APIs, transactional controllers).
- **Database**: Dual-driver architecture supporting high-performance **PostgreSQL** in production with an automatic self-healing **SQLite** fallback for local offline operations.
- **Tools**: jsPDF (for client/technician receipt rendering).

---

## 📁 Repository & Folder Structure

The repository is organized to separate concerns between frontend interface components, backend API engines, and systems documentation:

```text
├── /src                    # Frontend Codebase
│   ├── /assets             # Theme-resilient images & styles
│   ├── /components         # Reusable UI elements (Navbar, StatusBadge, SummaryCard)
│   ├── /views              # Operational Views (Dashboard, ReturnForm, Settlement, etc.)
│   ├── App.jsx             # React Application root and router
│   ├── main.jsx            # DOM bootstrapper
│   └── index.css           # Global typography & design token library
├── /server                 # Backend API Engine
│   ├── /config             # Database connection managers (dual-driver engine)
│   ├── /controllers        # Transactional logic (Intake, claims, audit, reset)
│   ├── /middleware         # CORS, JSON parsers, and errors
│   ├── /routes             # REST API routing endpoints
│   ├── db.js               # SQLite database initializer and seed files
│   └── server.js           # Express application listener port 5000
├── /docs                   # Project Specifications & Diagrams
│   └── system_analysis.md  # Data lifecycle and system flow documents
├── database.sqlite         # Local SQLite database instance (self-generated)
├── package.json            # Node dependency configuration
└── README.md               # Master documentation (this file)
```

---

## 👥 Team Roles & Access Controls

The system implements role-based views at the navigation level:

1. **Manager**: Full system access. Can view the Dashboard, log new device intakes, review customer details, manage monitored deposits, check active incidents, inspect overdue listings, and perform settlement clearances.
2. **Service Technician**: Focused return logging workflow. Locked into the **Return Desk** view to process customer device handovers, capture photo evidence, run AI diagnostics, and log damage assessments.
3. **Accounts Staff**: Focused financial workflow. Restricted to the **Settlement Desk** and **Open Audits** views to authorize deposit captures, issue refunds, download transaction receipts, and finalize claims.

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+)
- npm

### Installation
1. Clone the repository to your local machine.
2. Install dependencies:
   ```bash
   npm install
   ```

### Running the Application
To run the full stack concurrently:
1. Start the backend server and frontend development server:
   ```bash
   npm run dev
   ```
2. The frontend will launch at `http://localhost:5173` and the backend listener will boot at `http://localhost:5000`.

### Building for Production
To build the static assets:
   ```bash
   npm run build
   ```

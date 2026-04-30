# Project Requirements Document (PRD): Technical Management Tool for CONSTRUCTORA WM/M&S

## 1. Project Overview
**Product Name:** CONSTRUCTORA WM/M&S Platform
**Slogan:** Edificando el Futuro
**Target Audience:** Architects, Project Managers, and Administrative Personnel in Guatemala.
**Objective:** A high-fidelity, integrated tool for client management, advanced APU (Unit Price Analysis) calculation, real-time project tracking, and automated professional reporting.

---

## 2. Key Modules & Features

### 2.1 Identity & Access
*   **Corporate Branding:** Professional logo integration (architectural compass + skyline) with navy blue and white primary palette.
*   **Login System:** Secure, branded access point to establish trust and professional first impressions.

### 2.2 Dashboard (The "Command Center")
*   **KPI Visualization:** High-level metrics (Power BI style) showing financial and physical health of projects.
*   **Interactive Calendar:** Synced with APU timelines for activity scheduling and deadline tracking.
*   **Critical Alerts:** Automatic notification banners for project delays (e.g., "Critical Delay: +2 days in Foundation") with visual indicators in the calendar.

### 2.3 Advanced APU Engine (Guatemala Standard)
*   **Chronological Rows:** Minimum of 40 standard rows organized by construction phases (Preliminaries, Foundation, Structure, etc.).
*   **Typology Filters:** Quick selection for Residential, Commercial, Industrial, Civil, and Public projects, each with its own pre-configured yield factors.
*   **Accordion (Concertina) UI:** Expanding rows for detailed editing of materials, labor, and equipment.
*   **Dynamic Labor Logic:** Ability to adjust the number of workers/crews per row, which automatically recalculates the duration of that task and the overall project.
*   **AIU Integration:** Automated calculation of Indirect Costs (Administration 12%, Contingencies 3%, Profit 10%).

### 2.4 Client & Project Management
*   **CRM:** Registration of client data, specific project requirements, and lead status.
*   **Conversion Flow:** "One-click" conversion from client requirements to a technical APU budget using AI-assisted analysis and typology validation.
*   **Project Directory:** Linked view of clients, their active projects, total costs, and execution times.

### 2.5 Financial & Operational Control
*   **Expenditure Management:** Categorized tracking for project expenses (Materials, Labor, etc.) and personal expenses (Health, Education, Savings, Entertainment).
*   **Visual Analytics:** Pie/Donut charts for financial breakdown and physical-financial progress bars (Target vs. Actual).
*   **Payroll Control:** Module for administrative and site labor payment management.

### 2.6 Reporting & Export
*   **Formal APU Export:** Detailed technical breakdown including yields and unit costs for internal/engineering use.
*   **Client Summary Export:** Simplified professional report showing only row summaries, total cost, and execution time (hiding technical yields).
*   **Multichannel Delivery:** Direct export to PDF/CSV and "Send via WhatsApp" functionality.

---

## 3. Design Principles
*   **System:** "Architectural Excellence" Design System.
*   **Typography:** Inter (Modern, Clean, High Legibility).
*   **Color Palette:** #1A2B44 (Navy Blue), Slate (Neutral support), Amber (Status alerts), Red (Critical alerts).
*   **Responsiveness:** Full desktop experience for office engineering and optimized mobile view for site supervisors.
*   **Language:** All production UI text must be Spanish.
*   **Currency:** All financial values must use Guatemalan quetzal format (`Q 0.00`).
*   **Logo:** Every branded screen must use the PNG logo stored in `modern_minimalist_logo_for_an_architecture_and_construction_company_named/REDISEÑO LOGO CONSTRUCTORA WM.png`.
*   **Unified Shell:** Screens are mounted by the root app shell (`index.html` + `assets/js/app.js`) so navigation, language normalization, currency normalization, logo replacement, and common actions stay consistent.

---

## 4. Technical Integration
*   **Time Tracking:** Every modification in the APU engine updates the project duration and syncs with the main dashboard calendar.
*   **Alerting System:** Multichannel alerts (Email, WhatsApp, Push) for critical milestones and reporting schedules (e.g., Weekly Summary on Fridays at 5 PM).

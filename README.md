# 🕵️ UniFind - Campus Lost & Found Portal

UniFind is a premium, high-fidelity web platform designed to streamline the process of finding and returning lost items within university campuses. Featuring a modern glassmorphic design, smooth Framed Motion animations, and an interactive detective mascot, UniFind makes campus security and item recovery engaging and efficient.

## ✨ Key Features

- **Interactive Branding**: A custom-animated "Investigator" mascot that scans the landing page for lost items.
- **Role-Based Access**: Specialized dashboards for Students, Campus Admins, and Super Admins.
- **Real-time Tracking**: Dynamic item status management (Lost, Found, Claimed, Returned).
- **Premium UI/UX**:
  - Glassmorphic login portals with interactive character reactions.
  - Staggered typography animations.
  - Responsive layouts for mobile and desktop.
- **Secure Authentication**: Integrated with Google OAuth and JWT-based secure sessions.
- **Accessibility Ready**: Built with ARIA standards and keyboard-friendly interactions.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: Prisma with SQLite/LibSQL
- **Authentication**: JWT & Google OAuth 2.0

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/2420090149-klh/UniFind.git
   cd UniFind
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up Environment Variables**:
   Create a `.env` file in the root directory and add:
   ```env
   DATABASE_URL="file:./dev.db"
   JWT_SECRET="your_secret_key"
   NEXT_PUBLIC_GOOGLE_CLIENT_ID="your_google_client_id"
   ```

4. **Initialize the Database**:
   ```bash
   npx prisma generate
   npx prisma db push
   npm run seed
   ```

5. **Run the Development Server**:
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to view the application.

## 📂 Project Structure

- `/app`: Next.js App Router (Pages & API Routes)
- `/components`: Reusable UI components
- `/prisma`: Database schema and seed scripts
- `/public`: Static assets (Logos, Campus imagery)
- `/lib`: Shared utilities and authentication logic

## 📄 License

This project is developed for campus community support.

---
*Developed with ❤️ for KLHB Campus.*

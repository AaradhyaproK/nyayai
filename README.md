# ⚖️ NyayaAI - AI-Powered Legal Assistance System

**NyayaAI** (formerly Nyaya Mitra) is a comprehensive legal technology platform designed to bridge the gap between citizens and the Indian legal system. By leveraging advanced Artificial Intelligence, it provides accessible, affordable, and understandable legal assistance to common citizens, lawyers, and judges.

![NyayaAI Hero](https://rockybhai.lovable.app/assets/hero-illustration-DgrLGejo.png)

## 🚀 Key Features

### 🤖 AI-Powered Tools
- **Case Outcome Simulation:** Predicts potential case outcomes and winning probabilities based on case details.
- **Judgment Recommendation:** Suggests relevant past precedents and similar cases with citations.
- **Bail Predictor:** Analyzes the likelihood of bail being granted based on offense details.
- **Legal Document Summarizer:** Extracts facts, issues, arguments, and laws from complex PDF judgments.
- **PIL & RTI Assistance:** AI guidance for filing Public Interest Litigations and RTI applications.
- **Judge's AI Assistant:** Provides real-time analysis, strengths, weaknesses, and suggested outcomes for judges.

### 🏛️ Core Functionality
- **Zero FIR Generator:** Instantly generate and download a Zero FIR PDF to be filed at any police station.
- **Know Your Rights:** A searchable database of fundamental rights, women's rights, and more.
- **Multilingual Support:** Full support for English, Hindi, and Marathi to ensure accessibility.
- **Secure Chat System:** Private and broadcast messaging between Clients, Lawyers, and Judges.
- **Case Management:** Digital case timeline, next hearing tracking, and secure document storage.

## 🛠️ Tech Stack

- **Framework:** [Next.js 15](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/) & [Shadcn UI](https://ui.shadcn.com/)
- **Backend & Auth:** [Firebase](https://firebase.google.com/) (Firestore, Authentication)
- **AI Engine:** [Google Genkit](https://firebase.google.com/docs/genkit) & Gemini Models
- **PDF Processing:** `pdfjs-dist`, `jspdf`, `html2canvas`
- **Visualization:** `recharts`

## 🏁 Getting Started

Follow these steps to set up the project locally.

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- A Firebase project
- An ImgBB API Key (for image uploads)
- Google Gemini API Key

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/AaradhyaproK/AI-In-judiciary-Updated.git
    cd AI-In-judiciary-Updated
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```

3.  **Configure Environment Variables:**
    Create a `.env.local` file in the root directory and add your keys:

    ```env
    # Firebase Configuration
    NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
    NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
    NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
    NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

    # AI & Services
    GOOGLE_GENAI_API_KEY=your_gemini_api_key
    NEXT_PUBLIC_IMGBB_API_KEY=your_imgbb_api_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open http://localhost:3000 in your browser.

## 📂 Project Structure

```
src/
├── ai/                 # Genkit flows and prompts (Case analysis, PIL, etc.)
├── app/                # Next.js App Router pages
│   ├── (dashboard)/    # Protected routes (My Cases, Summarize, etc.)
│   ├── login/          # Authentication pages
│   └── page.tsx        # Main Landing Page
├── components/         # Reusable UI components (Shadcn)
├── firebase/           # Firebase configuration and hooks
├── hooks/              # Custom React hooks (useLanguage, useToast)
└── lib/                # Utility functions
```

## 👥 Contributors

This project was developed with ❤️ by:

- **Aaradhya Pathak** - Portfolio
- **Sanket Jadhav**
- **Yash Jonshale**
- **Prachi Gaykwad**
- **Sakshi Aagle**

## 📄 License

This project is licensed under the MIT License.

---

> **Disclaimer:** NyayaAI is an AI-assisted tool for informational purposes only. It does not constitute professional legal advice. Users should consult qualified lawyers for legal representation.

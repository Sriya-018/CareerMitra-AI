# CareerMitra AI

> AI-powered career counselor for rural youth, powered by IBM watsonx.ai Granite models.

---

## Project Structure

```
CareerMitra AI/
├── frontend/          # React + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── components/   # Navbar, Footer
│   │   ├── context/      # ThemeContext (dark/light mode)
│   │   ├── pages/        # Home, Assessment, Results, About
│   │   ├── services/     # API service (axios)
│   │   └── types/        # TypeScript interfaces
│   └── ...
└── backend/           # Node.js + Express REST API
    └── server.js
```

---

## Getting Started

### 1. Start the Backend

```bash
cd backend
npm start
# Server runs at http://localhost:5000
```

### 2. Start the Frontend

```bash
cd frontend
npm run dev
# App runs at http://localhost:3000
```

---

## Features

- **AI Career Assessment** — 5-step form collecting personal, educational, and interest data
- **Personalised Career Recommendations** — Matched careers with percentage scores
- **Career Roadmap** — Phased action plan (0–36 months)
- **Skill Gap Analysis** — Table of skills to develop with priority levels
- **Government Schemes** — Relevant central and state schemes for the user
- **Free Learning Resources** — Curated free courses from SWAYAM, NSDC, Google, etc.
- **Dark / Light Mode** — Persistent theme preference
- **Responsive Design** — Works on mobile, tablet, and desktop
- **Multi-language Support** — 13+ regional language options

---

## API

### `POST /api/career`

**Request Body:**
```json
{
  "fullName": "Ramesh Patel",
  "age": "19",
  "gender": "Male",
  "education": "Class 11-12 (Intermediate)",
  "state": "Madhya Pradesh",
  "district": "Vidisha",
  "preferredLanguage": "Hindi",
  "favoriteSubjects": ["Mathematics", "Biology"],
  "interests": ["Agriculture", "Technology"],
  "skills": "Basic farming, mobile phone usage",
  "careerGoal": "I want to improve farming in my village",
  "familyIncome": "Below ₹1,00,000"
}
```

**Response:** Career recommendations, roadmap, skill gaps, government schemes, and learning resources.

---

## Tech Stack

| Layer     | Technology                          |
|-----------|-------------------------------------|
| Frontend  | React 18, TypeScript, Vite          |
| Styling   | Tailwind CSS 3                      |
| Routing   | React Router DOM v6                 |
| HTTP      | Axios                               |
| Icons     | Lucide React                        |
| Backend   | Node.js, Express                    |
| AI (Soon) | IBM watsonx.ai (Granite models)     |

---

## IBM watsonx.ai Integration (Coming Next)

The backend is structured to accept IBM Granite model integration. Replace the `generateCareerAdvice()` mock function in `backend/server.js` with actual IBM watsonx.ai API calls using the `@ibm-cloud/watsonx-ai` SDK.

---

Made with ❤️ for India's rural youth.

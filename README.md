# Lingofy 🎧📘  
*A Human–Computer Interaction (HCI) Research Project*

Lingofy is a **music-integrated language learning research prototype** designed to study how **music-driven interaction, personalization, and engagement** influence learning outcomes.  
This project is developed as part of an **HCI-focused academic research study**, where the application acts as an **experimental tool**, not a commercial product.

---

## 🎯 Project Objective

The primary goal of Lingofy is to explore:

- How music-based interfaces affect **user engagement**
- Whether emotional engagement through music supports or hinders **learning and memory**
- The impact of **personalization and interaction design** on cognitive load and learning behavior

---

## 🧠 Research Focus (HCI Perspective)

- User Engagement vs Learning Effectiveness  
- Cognitive Load in Multimodal Interfaces (music + text + interaction)  
- Ethical and behavioral implications of gamified learning  
- User experience in personalized learning systems  

---

## 🛠 Tech Stack

### Frontend
- React
- TypeScript
- Vite
- HTML / CSS

### Backend
- Node.js
- Express.js
- TypeScript


## 📁 Project Structure

```text
lingofy/
│
├── frontend/                  # React + TypeScript frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/         # Reusable UI components
│   │   │   └── learning/       # Learning-specific components
│   │   ├── pages/              # Experiment flow pages
│   │   ├── services/           # API & analytics helpers
│   │   ├── types/              # TypeScript types
│   │   ├── utils/              # Utility functions
│   │   ├── App.tsx
│   │   └── main.tsx
│   └── package.json
│
├── backend/                   # Node + Express backend
│   ├── src/
│   │   ├── controllers/        # Request handling logic
│   │   ├── routes/             # API routes
│   │   ├── models/             # Data models
│   │   ├── services/           # Analytics & anonymization
│   │   ├── app.ts
│   │   └── server.ts
│   └── package.json
│
├── docs/                      # Research documentation
│   ├── problem_statement.md
│   ├── research_questions.md
│   ├── hypotheses.md
│   └── methodology.md
│
├── study/                     # User study materials
│   ├── task_instructions.md
│   ├── questionnaire.md
│   └── evaluation_metrics.md
│
├── data/                      # Collected experiment data
├── README.md
└── .gitignore
```

---

## 🏗️ System Architecture

![System Architecture](system-archietecture/architecture1.png)



---

## ▶️ How to Run the Project

### Backend
```bash
cd backend
npm install
npm run dev

Server runs on: http://localhost:5000

Frontend
cd frontend
npm install
npm run dev

Frontend runs on: http://localhost:5173

.env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/lingofy
ADMIN_EMAIL=admin123@gmail.com
ADMIN_PASSWORD=admin@123
GROQ_API_KEY=
---


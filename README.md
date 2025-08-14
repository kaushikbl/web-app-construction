# 🏠 House Construction Expense Tracker 🏠

A 3-tier web application to track **house construction progress and expenses** — including borewell, floor plan, contractors, floors, materials, bills, and more.  
Built with **React** (frontend), **Node.js/Express** (backend), and **MongoDB** (database), containerized with **Docker Compose**.

---

## 📌 Features

- **Track Expenses** – Manage and view expenses for various construction activities.
- **Bill Image Uploads** – Store and view uploaded bill images.
- **MongoDB Integration** – Persistent storage for expenses and related data.
- **Responsive Frontend** – Built with React for desktop & mobile viewing.
- **Containerized Setup** – Easy deployment using Docker Compose.

---

## 🛠 Tech Stack

- **Frontend:** React
- **Backend:** Node.js + Express
- **Database:** MongoDB
- **Containerization:** Docker, Docker Compose

---

## 📂 Project Structure

├── backend/ # Node.js + Express API
│ ├── uploads/ # Uploaded bill images (mounted volume)
│ ├── package.json
│ └── Dockerfile
├── frontend/ # React frontend
│ ├── src/
│ ├── public/
│ ├── package.json
│ └── Dockerfile
├── docker-compose.yml # Multi-container setup
└── README.md

2️⃣ **Clone Repository**

```bash
git clone https://github.com/kaushikbl/web-app-construction.git
cd web-app-construction

3️⃣ **Environment Variables**

MONGO_URI=mongodb://mongo:27017/house_expenses
PORT=5000

4️⃣ **Build & Run with Docker Compose**

docker-compose build
docker-compose up -d

5️⃣ **Access the App**

Frontend: http://localhost:3000

Backend API: http://localhost:5000

MongoDB: localhost:27017 (inside container name: mongo)

🤝 Contributing
Pull requests are welcome. Please fork the repo and open a PR with clear descriptions.
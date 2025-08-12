1.Install and run MongoDB locally (or use Atlas). Example (on Linux/macOS using mongod):

mongod --dbpath ./data/db

2.Backend:
cd backend
npm install
cp .env.example .env   # edit if needed
npm run start
# or for dev with auto reload:
# npm run dev

3.Backend:
cd frontend
npm install
npm start
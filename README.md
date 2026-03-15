# Fuliza Agent Desk Setup Instructions

## Backend Setup

1. Navigate to the `backend` directory:
   ```powershell
   cd backend
   ```
2. Install dependencies:
   ```powershell
   npm install
   ```
3. Copy `.env.example` to `.env` and fill in your Safaricom Daraja sandbox credentials:
   ```powershell
   copy .env.example .env
   # Edit .env and add your keys
   ```
4. Start the backend server:
   ```powershell
   npm run dev
   ```

## Frontend Setup

1. Navigate to the `frontend` directory:
   ```powershell
   cd ../frontend
   ```
2. Open `index.html` in your browser to view the UI.

## Daraja Sandbox Integration

- The backend is pre-configured to use Safaricom Daraja sandbox endpoints.
- Update `.env` with your sandbox keys and shortcode.
- API endpoints:
  - `POST /api/withdraw` (expects `customerPhone`, `amount`, `idNumber`, `agentPin`)
  - `GET /api/balance`
  - `GET /api/transactions`

## Notes
- For production, update `.env` with live credentials and switch URLs.
- Ensure CORS is enabled for frontend-backend communication.
- For full integration, implement Daraja API calls in backend routes.

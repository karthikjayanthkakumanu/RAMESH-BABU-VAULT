# Kakumanu Family Digital Document Vault

A premium, secure, and beautiful MERN (MongoDB, Express, React, Node.js) family document management application inspired by Apple, Notion, Google Drive, and Dropbox design systems.

---

## Key Features

- **Premium Glassmorphic UI**: High-fidelity dark/light mode toggle with theme memory, smooth framer-motion transitions, lists/grids views, and rounded dashboard widgets.
- **Robust Role-Based Control**:
  - **Admin**: Full access to upload files, rename display names, move folders, soft delete (Trash Bin), permanently purge, and manage user credentials.
  - **Viewer**: Read-only access to view files in-browser, search files globally, and download documents.
- **Automatic Folder Structures**: Pre-seeded profile categories and nested subfolders for:
  - Kakumanu Ramesh Babu (Boss)
  - Kakumanu Lalitha Karuna (Home Minister)
  - Kakumanu Devi Kala Niharika (Queen of the House)
  - Kakumanu Karthik Jayanth (Chief Secretary)
  - Unstructured categories (House Documents, Bank Documents, Family Documents, Others).
- **Fast Global Search**: Searches across folder names, display names, and original file names instantly.
- **Embedded Document Preview**: Direct in-browser viewing for PDFs, images, text logs, video, and audio players. Gracefully falls back to information cards with download buttons for docx, xlsx, pptx, and zip files.
- **Multi-Select Bulk Operations**: Select multiple documents to delete (trash), restore, move, or sequentially download in batches.
- **Audit Trails & Security**: Strict JWT validations, bcrypt password hashing, CORS filters, Helmet HTTP protections, rate limiters, and physical file upload checks (preventing filename overrides).
- **Bonus Extras**: Keyboard shortcuts (press `?` for overlay menu) and real-time dashboard notifications linked to activity logs.

---

## Directory Hierarchy

```text
RAMESH BABU VAULT/
├── backend/
│   ├── config/             # DB settings
│   ├── controllers/        # Auth and File logics
│   ├── middlewares/        # JWT/Role validations & Multer
│   ├── models/             # Mongoose schemas
│   ├── routes/             # Express API routers
│   ├── uploads/            # Server-disk storage directory
│   ├── utils/              # Seeder and type categorizer helpers
│   ├── .env                # Server configuration
│   ├── package.json
│   └── server.js           # Server runner
└── frontend/
    ├── src/
    │   ├── components/     # Modals, Sidebar, ContextMenu
    │   ├── context/        # Auth and Theme States
    │   ├── layouts/        # Layout shells
    │   ├── pages/          # Dashboard, Folders, Trash, etc.
    │   ├── services/       # Axios API client
    │   ├── App.jsx
    │   ├── index.css       # Core styling & transitions
    │   └── main.jsx
    ├── package.json
    └── tailwind.config.js
```

---

## Quick Setup Instructions

### Prerequisites
- Node.js (v16+) installed.
- MongoDB Server running locally on port `27017` (e.g. `mongodb://127.0.0.1:27017`).

### 1. Startup the API Backend
1. Go to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Setup environment variables:
   A standard `.env` configuration file has been automatically created for you:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/kakumanu-vault
   JWT_SECRET=kakumanu_vault_super_secret_key_2026_family_secure
   JWT_EXPIRE=7d
   ```
3. Run the development server (automatically seeds users and folder schemas):
   ```bash
   npm run start
   ```

### 2. Startup the Frontend Client
1. Go to the `frontend/` directory:
   ```bash
   cd ../frontend
   ```
2. Start the Vite React client:
   ```bash
   npm run dev
   ```
3. Open your browser and navigate to: `http://localhost:5173`.

---

## Default Access Credentials

On startup, the system database automatically seeds two initial accounts if they do not exist:

| Role | Email | Password |
|---|---|---|
| **Admin** | `admin@kakumanuvault.com` | `VaultAdmin2026!` |
| **Viewer** | `viewer@kakumanuvault.com` | `VaultViewer2026!` |

> [!IMPORTANT]
> The admin can immediately log in, create custom categories or subdirectories, register additional family members with roles, upload files, and trace access history from the admin console.

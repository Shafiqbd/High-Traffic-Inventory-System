# Real-Time High-Traffic Inventory System

A sneaker drop platform designed to handle high-concurrency scenarios with real-time stock updates, reservation-based purchasing, and automatic stock recovery.

## 🚀 Features Implemented

### Core Features
- **Atomic Reservation System** - Users can reserve items with a 60-second hold window
- **Real-Time Stock Updates** - Live stock synchronization across all connected clients via WebSockets
- **Automatic Stock Recovery** - Expired reservations automatically return stock to inventory
- **Purchase Flow** - Complete purchases from reserved items with permanent stock deduction
- **Activity Feed** - See the 3 most recent purchasers for each drop in real-time
- **Drop Management** - Create and manage sneaker drops with scheduled activation times

### UI/UX Features
- **Loading States** - Visual feedback on all async operations (Reserve, Purchase buttons)
- **Toast Notifications** - Real-time error and success messages
- **Stock Visualization** - Color-coded progress bars showing available stock
- **Countdown Timer** - 60-second countdown for reservation expiration
- **Responsive Design** - Clean, professional UI built with Tailwind CSS

## 🛠 Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | React 19, TypeScript, Vite, Redux Toolkit, Tailwind CSS |
| **Backend** | Node.js, Express, TypeScript |
| **Database** | PostgreSQL with Prisma ORM |
| **Real-Time** | Socket.io (WebSockets) |
| **State Management** | Redux Toolkit with RTK Query |

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v18 or higher)
- **PostgreSQL** (v14 or higher)
- **npm** or **yarn** package manager

## 🏗 Installation & Setup

### 1. Clone the Repository

```bash
git clone git@github.com:Shafiqbd/High-Traffic-Inventory-System.git
cd High-Traffic-Inventory-System
```

### There is two part in same directory backend and frontend

### 2. Database Setup

**No need to setup any database you just follow the .env.example file and move into .env file

### 3. Backend Setup
```bash
cd backend

# Install dependencies
npm install

# The backend is configured to http://localhost:3000/api
# No additional configuration needed
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# The frontend is configured to use the backend API at http://localhost:3000/api
# No additional configuration needed
```

## 🎬 How to Run

### Option 1: Run Both Frontend & Backend

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Backend runs on http://localhost:3000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
# Frontend runs on http://localhost:5173
```

### Option 2: Development with Auto-Reload

Both frontend and backend support hot-reload during development. Changes will automatically refresh.

## 🧪 Testing the Application

### 1. Open the Application
Navigate to `http://localhost:5173` in your browserd

### 2. There is five test user in database you can use:
- Use any email and name to login
- Password is pre-configured (demo mode)
1. shafiq@gmail.com - 123456
2. admin@gmail.com - 123456
3. rasel@gmail.com - 123456

### 3. Test Real-Time Updates
**Open two browser windows side-by-side:**
1. Reserve an item in Window 1
2. Watch the stock bar update instantly in Window 2
3. Complete a purchase in Window 1
4. Watch the Activity Feed update in Window 2

### 4. Test Stock Recovery
1. Reserve an item
2. Wait 60 seconds without purchasing
3. Watch the stock automatically return to available pool

### 5. Test Concurrency Prevention
**Open multiple browsers and try simultaneously:**
1. Reserve the last available item (stock = 1)
2. Only ONE browser should succeed
3. Others will receive "No stock available" error


## 🏗 Architecture & Key Design Decisions

### Q1: How did you handle the 60-second expiration logic?

**Answer:** Using a combination of database-level expiration tracking and background job processing.

#### Implementation Details:

1. **Expiration Tracking** (`backend/src/services/reservation.service.ts`)
   ```typescript
   const expiresAt = new Date();
   expiresAt.setSeconds(expiresAt.getSeconds() + 60);
   // Stored in Reservation.expiresAt
   ```

2. **Background Recovery Job** (`backend/src/jobs/stockRecovery.ts`)
   - Runs every 2 seconds (configurable via `stockRecoveryIntervalMs`)
   - Finds all ACTIVE reservations where `expiresAt < now()`
   - Processes up to 100 expired reservations per batch
   - Each expired reservation:
     - Locks the associated drop row
     - Increments `availableStock`
     - Deletes the reservation
     - Emits real-time socket event

3. **Real-Time Notifications**
   - Socket event: `reservation:expired` 
   - Socket event: `stock:updated`
   - All connected clients see stock return instantly

#### Why This Approach?

- **Database-centric**: Expiration logic lives in the database (single source of truth)
- **Near real-time**: 2-second job interval ensures quick recovery
- **Scalable**: Batch processing handles high volumes efficiently
- **Fault-tolerant**: Even if job misses, next run catches expired reservations

### Q2: How did you prevent multiple users from claiming the same last item?

**Answer:** Using PostgreSQL's row-level locking with atomic transactions.

#### Implementation Details:

1. **Row-Level Locking** (`backend/src/services/reservation.service.ts`)
   ```typescript
   await prisma.$transaction(async (tx) => {
     // SELECT ... FOR UPDATE locks this row
     const drop = await tx.drop.findUnique({
       where: { id: dropId },
     });

     // Check stock AFTER lock is acquired
     if (drop.availableStock <= 0) {
       throw new Error('No stock available');
     }

     // Create reservation AND decrement stock atomically
     await tx.reservation.create({
       data: { dropId, userId, expiresAt }
     });
     
     await tx.drop.update({
       where: { id: dropId },
       data: { availableStock: { decrement: 1 } }
     });
   });
   ```

2. **Transaction Isolation**
   - All operations within `$transaction` are atomic
   - If any step fails, entire transaction rolls back
   - PostgreSQL guarantees serialization

3. **Database-Level Guarantees**
   - `SELECT ... FOR UPDATE` prevents concurrent writes
   - Other transactions wait until lock is released
   - First transaction to commit wins

#### Why This Approach?

- **Database-native**: Leverages PostgreSQL's built-in concurrency control
- **No race conditions**: Lock ensures serialized access
- **Scalable**: Database handles locking efficiently
- **Reliable**: No application-level complexity that could fail

#### Concurrency Scenario Example:

```
Time | User A (Last Item) | User B (Last Item) | User C (Last Item)
-----|--------------------|--------------------|--------------------
T1   | BEGIN TRANSACTION  |                    |
T2   | LOCK drop row      | BEGIN TRANSACTION  |
T3   | Check stock: 1     | WAIT for lock...   |
T4   | Create reservation | WAIT for lock...   |
T5   | Decrement stock    | WAIT for lock...   |
T6   | COMMIT             | WAIT for lock...   |
T7   | Success!           | Gets lock          |
T8   |                    | Check stock: 0     |
T9   |                    | Error: No stock!   |
T10  |                    | ROLLBACK           | BEGIN TRANSACTION
T11  |                                        | WAIT for lock...
T12  |                                        | Gets lock
T13  |                                        | Check stock: 0
T14  |                                        | Error: No stock!
T15  |                                        | ROLLBACK
```

**Result:** Only User A succeeds. Users B and C receive proper error messages.

## 📁 Project Structure

```
High-Traffic-Inventory-System/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── src/
│   │   ├── config/                # Configuration files
│   │   ├── controllers/           # Request handlers
│   │   ├── jobs/                  # Background tasks
│   │   │   ├── stockRecovery.ts   # Expired reservation cleanup
│   │   │   └── dropStatusTransition.ts  # Drop status automation
│   │   ├── routes/                # API routes
│   │   ├── services/              # Business logic
│   │   │   ├── reservation.service.ts
│   │   │   ├── purchase.service.ts
│   │   │   └── socket.ts          # WebSocket service
│   │   └── types/                 # TypeScript definitions
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DropCard.tsx       # Main product card
│   │   │   ├── ActivityFeed.tsx   # Recent purchasers
│   │   │   ├── StockBar.tsx       # Stock visualization
│   │   │   └── ui/                # Reusable UI components
│   │   ├── services/
│   │   │   └── socket.ts          # Socket.io client
│   │   ├── store/                 # Redux state management
│   │   ├── pages/                 # Page components
│   │   └── main.tsx
│   ├── package.json
│   └── vite.config.ts
├── docs/
│   └── Technical Assessment.pdf   # Requirements document
└── README.md                      # This file
```

## 🚀 Deployment

I have deployed on live server you can check here:

1. **Database** - 194.238.18.90:10000
2. **Backend** - https://api.shafiq.info.bd/api
3. **Frontend** - https://demo.shafiq.info.bd
4. **WebSocket** - Configure for production CORS

## 📝 License

This project is part of a technical assessment for demonstrating high-concurrency inventory management skills.

## 🤝 Contributing

This is a demonstration project. For improvements or questions, please refer to the technical assessment documentation.

---

**Built with ❤️ using React, Node.js, PostgreSQL, and Socket.io**

# Reservation Transaction Flow & Overselling Prevention

## The Problem

在高流量场景下，多个用户同时尝试预订同一商品会导致 "超卖" (overselling)。

**Scenario without protection:**
```
Initial stock: 1

User A checks stock: 1 available ✓
User B checks stock: 1 available ✓
User A reserves: stock becomes 0
User B reserves: stock becomes -1 ❌ (oversold!)
```

---

## The Solution: Database Transactions + Row-Level Locking

### `SELECT ... FOR UPDATE`

PostgreSQL's row-level locking ensures that even with 1000 concurrent requests,
each request waits for the previous one to complete before reading the stock value.

```sql
BEGIN;
SELECT * FROM "Drop" WHERE id = 'drop_123' FOR UPDATE;
-- This row is now locked - other transactions wait
-- Check stock, create reservation, update stock
COMMIT;
-- Lock released
```

---

## Flow 1: Create Reservation

```
┌─────────────────────────────────────────────────────────────────────┐
│                    POST /api/reservations                           │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Start Transaction  │
                    │  (prisma.$transaction) │
                    └─────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │  SELECT * FROM Drop                          │
        │  WHERE id = $1                               │
        │  FOR UPDATE                                  │
        │                                              │
        │  🔒 Row locked - other requests wait         │
        └─────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Check availableStock > 0 │
                    └─────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
        ┌─────────────┐                 ┌─────────────┐
        │    Yes      │                 │    No       │
        └─────────────┘                 └─────────────┘
              │                               │
              ▼                               ▼
    ┌─────────────────────┐         ┌─────────────────────┐
    │ Check if user       │         │ ROLLBACK            │
    │ already reserved    │         │ Return 400:         │
    │ (UNIQUE constraint) │         │ "No items available"│
    └─────────────────────┘         └─────────────────────┘
              │
      ┌───────┴────────┐
      ▼                ▼
┌──────────┐    ┌──────────┐
│   No     │    │   Yes    │
└──────────┘    └──────────┘
      │                │
      ▼                ▼
┌──────────────┐  ┌──────────────┐
│ CREATE       │  │ ROLLBACK     │
│ Reservation  │  │ Return 400:   │
│ expiresAt =  │  │ "Already     │
│ now() + 60s  │  │ reserved"    │
└──────────────┘  └──────────────┘
      │
      ▼
┌──────────────┐
│ UPDATE Drop  │
│ SET          │
│ availableStock = │
│ availableStock - 1 │
└──────────────┘
      │
      ▼
┌──────────────┐
│ COMMIT       │
│ 🔒 Lock released │
└──────────────┘
      │
      ▼
┌──────────────┐
│ Emit socket: │
│ stock:updated │
└──────────────┘
      │
      ▼
┌──────────────┐
│ Return 201: │
│ Reservation  │
│ object       │
└──────────────┘
```

---

## Flow 2: Complete Purchase

```
┌─────────────────────────────────────────────────────────────────────┐
│                      POST /api/purchases                            │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Start Transaction  │
                    └─────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │  SELECT * FROM Reservation                   │
        │  WHERE id = $1                               │
        │  FOR UPDATE                                  │
        │                                              │
        │  🔒 Reservation row locked                   │
        └─────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │  Check:             │
                    │  - Reservation exists? │
                    │  - expiresAt > now()? │
                    │  - userId matches?  │
                    └─────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
        ┌─────────────┐                 ┌─────────────┐
        │   All OK    │                 │  Failed     │
        └─────────────┘                 └─────────────┘
              │                               │
              ▼                               ▼
    ┌─────────────────────┐         ┌─────────────────────┐
    │ DELETE Reservation  │         │ ROLLBACK            │
    │ CREATE Purchase     │         │ Return 400/404     │
    │ COMMIT              │         │ (appropriate error) │
    └─────────────────────┘         └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Emit socket events: │
    │ - stock:updated     │
    │ - purchase:completed │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │ Return 201:         │
    │ Purchase object     │
    └─────────────────────┘
```

**Note:** Stock doesn't change on purchase - it was already decreased
when the reservation was created.

---

## Flow 3: Stock Recovery (Background Job)

Runs every 10 seconds to clean up expired reservations.

```
┌─────────────────────────────────────────────────────────────────────┐
│              Background Job (every 10s)                             │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
        ┌─────────────────────────────────────────────┐
        │  SELECT * FROM Reservation                  │
        │  WHERE expiresAt < now()                    │
        │  LIMIT 100                                  │
        │                                              │
        │  Get expired reservations (batch)           │
        └─────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  For each expired reservation: │
              └───────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
    ┌─────────────────────┐         ┌─────────────────────┐
    │  Start Transaction  │         │  (Process next)     │
    └─────────────────────┘         └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  SELECT * FROM Drop │
    │  WHERE id = $1      │
    │  FOR UPDATE         │
    │  🔒 Row locked      │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  UPDATE Drop        │
    │  SET availableStock = │
    │  availableStock + 1 │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  DELETE Reservation │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  COMMIT             │
    │  🔒 Lock released    │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  Emit socket:       │
    │  stock:updated      │
    └─────────────────────┘
              │
              ▼
    ┌─────────────────────┐
    │  Emit socket:       │
    │  reservation:expired │
    └─────────────────────┘
```

---

## Timeline: 100 Concurrent Users

```
Time │ Request │ State
─────┼─────────┼─────────────────────────────────────────────────────
0ms  │ User 1  │ 🔒 Lock acquired, checking stock
1ms  │ User 2  │ ⏳ Waiting for lock...
2ms  │ User 3  │ ⏳ Waiting for lock...
     │ ...     │ ⏳ (97 more requests waiting)
10ms │ User 1  │ ✓ Reserved! Stock: 99, COMMIT, Lock released
11ms │ User 2  │ 🔒 Lock acquired, checking stock
12ms │ User 3  │ ⏳ Waiting for lock...
     │ ...     │ ⏳ (98 more requests waiting)
20ms │ User 2  │ ✓ Reserved! Stock: 98, COMMIT, Lock released
21ms │ User 3  │ 🔒 Lock acquired, checking stock
...  │ ...     │ ...
```

**Key Insight:** Each transaction is serialized at the database level.
The order is guaranteed by PostgreSQL's locking mechanism.

---

## Alternative Approaches Considered

### ❌ Version-based Optimistic Locking
```prisma
model Drop {
  availableStock Int
  version        Int @default(0)
}

// Check and update version
WHERE availableStock > 0 AND version = $oldVersion
UPDATE SET availableStock = availableStock - 1, version = version + 1
```
**Problem:** High contention leads to many retries. Not suitable for sneaker drops.

### ❌ Queue-based System
**Problem:** Adds complexity (Redis/RabbitMQ). Overkill for this assessment.

### ❌ Separate "reserved" count field
```prisma
model Drop {
  availableStock Int
  reservedCount  Int @default(0)
}
// Real stock = availableStock - reservedCount
```
**Problem:** Race conditions still possible. More complex to reason about.

---

## Summary: Why This Works

1. **Row-level locking (`FOR UPDATE`)** ensures serialization
2. **Transaction boundaries** ensure all-or-nothing
3. **Database guarantees** - PostgreSQL handles concurrency correctly
4. **Unique constraint** prevents double reservations
5. **Atomic operations** - check-then-act is safe within transaction

**The key insight:** We're not fighting the database - we're using its
concurrency control features to do the heavy lifting.

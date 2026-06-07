# Socket.io Events Design

## Connection
```
Server: http://localhost:3000
```

---

## Server → Client Events (Broadcasts)

### 1. `stock:updated`
Emitted when stock changes for any reason (reservation, purchase, expiry).

**Payload:**
```typescript
{
  dropId: string;
  availableStock: number;
}
```

**Example:**
```json
{
  "dropId": "clxabc123def",
  "availableStock": 42
}
```

**When Emitted:**
- User creates a reservation (stock -1)
- User completes a purchase (stock already decreased, but emits for consistency)
- Reservation expires (stock +1)
- Admin cancels a reservation (stock +1)

**Broadcast Target:**
- Room: `drop:{dropId}` (only clients watching this drop)

---

### 2. `drop:created`
Emitted when a new drop is created.

**Payload:**
```typescript
{
  id: string;
  name: string;
  price: string;
  initialStock: number;
  availableStock: number;
  startsAt: string; // ISO 8601
  createdAt: string; // ISO 8601
}
```

**Example:**
```json
{
  "id": "clxabc123def",
  "name": "Air Jordan 1 Retro High",
  "price": "180.00",
  "initialStock": 100,
  "availableStock": 100,
  "startsAt": "2024-01-15T10:00:00Z",
  "createdAt": "2024-01-10T08:00:00Z"
}
```

**When Emitted:**
- Admin creates a new drop via POST /api/drops

**Broadcast Target:**
- Global (all connected clients) - because dashboard shows all drops

---

### 3. `purchase:completed`
Emitted when a purchase is completed.

**Payload:**
```typescript
{
  dropId: string;
  recentPurchases: Array<{
    id: string;
    userId: string;
    createdAt: string;
  }>;
}
```

**Example:**
```json
{
  "dropId": "clxabc123def",
  "recentPurchases": [
    {
      "id": "clxpur001",
      "userId": "user_123",
      "createdAt": "2024-01-15T10:05:30Z"
    },
    {
      "id": "clxpur002",
      "userId": "user_456",
      "createdAt": "2024-01-15T10:05:15Z"
    },
    {
      "id": "clxpur003",
      "userId": "user_789",
      "createdAt": "2024-01-15T10:04:45Z"
    }
  ]
}
```

**When Emitted:**
- User completes a purchase via POST /api/purchases

**Broadcast Target:**
- Room: `drop:{dropId}` - only clients watching this drop

---

### 4. `reservation:expired`
Emitted when stock is recovered from an expired reservation.

**Payload:**
```typescript
{
  dropId: string;
  availableStock: number;
}
```

**Example:**
```json
{
  "dropId": "clxabc123def",
  "availableStock": 43
}
```

**When Emitted:**
- Background job processes expired reservations

**Broadcast Target:**
- Room: `drop:{dropId}` - only clients watching this drop

**Note:** This is redundant with `stock:updated` (same payload), but provides
semantic clarity. Could be merged if desired.

---

## Client → Server Events (Subscriptions)

### 1. `join:drop`
Client requests to receive updates for a specific drop.

**Payload:**
```typescript
{
  dropId: string;
}
```

**Example:**
```json
{
  "dropId": "clxabc123def"
}
```

**Server Action:**
- Joins socket to room: `drop:{dropId}`
- Sends current stock as immediate confirmation

**Server Response (immediate):**
```json
{
  "dropId": "clxabc123def",
  "availableStock": 45
}
```

---

### 2. `leave:drop`
Client requests to stop receiving updates for a specific drop.

**Payload:**
```typescript
{
  dropId: string;
}
```

**Example:**
```json
{
  "dropId": "clxabc123def"
}
```

**Server Action:**
- Leaves socket from room: `drop:{dropId}`
- No response needed

---

## Socket.io Rooms Architecture

### Room Naming Convention
```
drop:{dropId}
```

**Examples:**
- `drop:clxabc123def`
- `drop:clxxyz789ghi`

### Why Rooms?
- **Efficiency**: Only interested clients receive updates
- **Scalability**: Broadcasts don't go to everyone
- **User Experience**: Dashboard can show multiple drops, each in its own "card"

### Room Lifecycle
```
1. Client connects
2. Client emits 'join:drop' for each drop visible on their dashboard
3. Server adds client to each drop's room
4. When stock changes, server broadcasts to that room only
5. When client navigates away, emit 'leave:drop'
6. Server removes client from room
```

---

## Event Flow Examples

### Example 1: User Reserves an Item
```
1. Client: HTTP POST /api/reservations { dropId, userId }
2. Server: Creates reservation, decreases stock
3. Server: socket.to(`drop:${dropId}`).emit('stock:updated', { dropId, availableStock })
4. All clients watching this drop: Receive stock update
5. Frontend: Updates stock counter in real-time
```

### Example 2: User Purchases
```
1. Client: HTTP POST /api/purchases { reservationId, userId }
2. Server: Deletes reservation, creates purchase
3. Server: socket.to(`drop:${dropId}`).emit('stock:updated', ...)
4. Server: socket.to(`drop:${dropId}`).emit('purchase:completed', { dropId, recentPurchases })
5. All clients watching this drop: Receive stock update + activity feed update
6. Frontend: Updates stock counter AND "Latest 3 buyers" section
```

### Example 3: Reservation Expires (Background Job)
```
1. Background Job: Finds expired reservations
2. For each expired:
   - Increment stock
   - Delete reservation
   - socket.to(`drop:${dropId}`).emit('stock:updated', ...)
   - socket.to(`drop:${dropId}`).emit('reservation:expired', ...)
3. Clients watching: Stock increases (someone timed out!)
```

---

## Frontend Integration Example

```typescript
// On dashboard mount, join all visible drops
drops.forEach(drop => {
  socket.emit('join:drop', { dropId: drop.id });
});

// Listen for stock updates
socket.on('stock:updated', ({ dropId, availableStock }) => {
  updateStockCounter(dropId, availableStock);
});

// Listen for purchases (activity feed)
socket.on('purchase:completed', ({ dropId, recentPurchases }) => {
  updateActivityFeed(dropId, recentPurchases);
});

// On component unmount
drops.forEach(drop => {
  socket.emit('leave:drop', { dropId: drop.id });
});
```

---

## Why Socket.io Instead of Polling?

| Aspect | Polling | Socket.io |
|--------|---------|-----------|
| Server load | High (repeated requests) | Low (push-based) |
| Latency | 1-5 seconds (poll interval) | < 100ms |
| Updates | Delayed until next poll | Instant |
| Scalability | Degrades fast with users | Handles concurrent well |
| Complexity | Simple to implement | Slightly more complex |

For a sneaker drop with thousands of users refreshing simultaneously,
Socket.io is the clear choice.

# REST API Design

## Base URL
```
http://localhost:3000/api
```

---

## Drop Endpoints

### POST /api/drops
Create a new drop (admin endpoint).

**Request Body:**
```json
{
  "name": "Air Jordan 1 Retro High",
  "price": "180.00",
  "initialStock": 100,
  "startsAt": "2024-01-15T10:00:00Z"
}
```

**Response (201 Created):**
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

**Validation:**
- `name`: required, string, max 255 chars
- `price`: required, decimal, must be >= 0
- `initialStock`: required, integer, must be >= 0
- `startsAt`: required, ISO 8601 datetime

---

### GET /api/drops
Get all active drops.

**Query Params:**
- `active` (optional): `true` to only show drops that have started

**Response (200 OK):**
```json
[
  {
    "id": "clxabc123def",
    "name": "Air Jordan 1 Retro High",
    "price": "180.00",
    "initialStock": 100,
    "availableStock": 45,
    "startsAt": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-10T08:00:00Z"
  },
  {
    "id": "clxxyz789ghi",
    "name": "Yeezy Boost 350",
    "price": "230.00",
    "initialStock": 50,
    "availableStock": 12,
    "startsAt": "2024-01-16T12:00:00Z",
    "createdAt": "2024-01-11T09:00:00Z"
  }
]
```

---

### GET /api/drops/:id
Get a single drop with latest 3 purchases (activity feed).

**Response (200 OK):**
```json
{
  "drop": {
    "id": "clxabc123def",
    "name": "Air Jordan 1 Retro High",
    "price": "180.00",
    "initialStock": 100,
    "availableStock": 45,
    "startsAt": "2024-01-15T10:00:00Z",
    "createdAt": "2024-01-10T08:00:00Z"
  },
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

**Response (404 Not Found):**
```json
{
  "error": "Drop not found"
}
```

---

## Reservation Endpoints

### POST /api/reservations
Reserve an item (stock decreases immediately).

**Request Body:**
```json
{
  "dropId": "clxabc123def",
  "userId": "user_123"
}
```

**Response (201 Created):**
```json
{
  "id": "clxres456xyz",
  "dropId": "clxabc123def",
  "userId": "user_123",
  "expiresAt": "2024-01-15T10:06:30Z",
  "createdAt": "2024-01-15T10:05:30Z"
}
```

**Response (400 Bad Request) - No stock:**
```json
{
  "error": "No items available"
}
```

**Response (400 Bad Request) - Already reserved:**
```json
{
  "error": "You already have an active reservation for this drop"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Drop not found"
}
```

---

### GET /api/reservations/:id
Check reservation status.

**Response (200 OK):**
```json
{
  "id": "clxres456xyz",
  "dropId": "clxabc123def",
  "userId": "user_123",
  "expiresAt": "2024-01-15T10:06:30Z",
  "createdAt": "2024-01-15T10:05:30Z",
  "status": "active"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Reservation not found"
}
```

---

### DELETE /api/reservations/:id
Cancel a reservation (stock is restored).

**Request Body:**
```json
{
  "userId": "user_123"
}
```

**Response (200 OK):**
```json
{
  "message": "Reservation cancelled"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Reservation not found"
}
```

---

## Purchase Endpoints

### POST /api/purchases
Complete a purchase (only with an active reservation).

**Request Body:**
```json
{
  "reservationId": "clxres456xyz",
  "userId": "user_123"
}
```

**Response (201 Created):**
```json
{
  "id": "clxpur001",
  "dropId": "clxabc123def",
  "userId": "user_123",
  "createdAt": "2024-01-15T10:05:30Z"
}
```

**Response (400 Bad Request) - Reservation expired:**
```json
{
  "error": "Reservation has expired"
}
```

**Response (400 Bad Request) - Wrong user:**
```json
{
  "error": "This reservation belongs to another user"
}
```

**Response (404 Not Found):**
```json
{
  "error": "Reservation not found"
}
```

---

## Error Response Format (Standard)

All errors follow this format:

```json
{
  "error": "Human-readable error message"
}
```

**Common HTTP Status Codes:**
- `200 OK` - Successful GET
- `201 Created` - Successful POST
- `400 Bad Request` - Validation error, business logic error
- `404 Not Found` - Resource doesn't exist
- `500 Internal Server Error` - Server error

---

## API Design Notes

### Why POST for reservation instead of PUT?
- Reservation is a *new* resource being created, not updating an existing one
- POST is semantically correct for creation

### Why userId in request body instead of header?
- Simplifies authentication for the assessment
- In production, this would come from an auth token/JWT

### Why separate `/api/reservations/:id` GET endpoint?
- Allows users to check their reservation status
- Useful for "reserved until" countdown on frontend

### Why DELETE instead of POST for cancel?
- DELETE is semantically correct for removing a resource
- RESTful convention for cancellation = deletion

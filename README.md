# 🎬 CineRed - Movie Ticket Booking System

A modern, containerized solution for seamless movie ticket bookings with real-time management.

---

## 📜 System Architecture Diagram

![System Architecture Diagram](https://github.com/user-attachments/assets/8c4686bf-0fd3-4bf5-a2be-d15c334beea5)

---

## 🔍 Overview

The **CineRed Movie Ticket Booking System** provides an intuitive platform for users to:
- Browse movies and showtimes
- Book tickets with real-time seat availability
- View booking history via email notifications

Admins can:
- Manage movies, theaters, and showtimes
- Monitor bookings via a secure REST API
- Handle asynchronous processing with RabbitMQ

---

## 🏗️ Architecture

### Frontend
- **Vanilla JavaScript**: Interactive UI with modern design
- **CSS Grid/Flexbox**: Responsive layouts
- **Font Awesome**: Icons for better user experience

### Backend
- **Node.js & Express**: REST API with secure transaction handling
- **PostgreSQL**: Persistent storage for movies, showtimes, and bookings
- **RabbitMQ**: Asynchronous message queue for booking processing and notifications

### Infrastructure
- **Docker**: Containerized services for portability
- **Docker Compose**: Orchestration for development and deployment
- **NGINX**: Hosting for the frontend application (Dockerized)

---

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/RushilAlagh/CineRed.git
   cd CineRed
   ```

2. Start all services:
   ```bash
   docker-compose up --build
   ```

3. Access the application:
   - **Frontend**: [http://localhost:8080](http://localhost:8080)
   - **Backend API**: [http://localhost:3000](http://localhost:3000)
   - **RabbitMQ Management**: [http://localhost:15672](http://localhost:15672)  
     (Default Credentials: `User: mq_user | Password: mq_password`)

---

## 📚 API Endpoints

| Endpoint                        | Method | Description                                      |
|---------------------------------|--------|--------------------------------------------------|
| `/api/movies`                   | GET    | Retrieve all movies                              |
| `/api/movies/:id`               | GET    | Retrieve a specific movie by ID                 |
| `/api/movies/:id`               | PUT    | Update a specific movie                         |
| `/api/movies/:id`               | DELETE | Delete a specific movie                         |
| `/api/theaters`                 | POST   | Create a new theatre                            |
| `/api/theaters`                 | GET    | Retrieve all theatres                           |
| `/api/showtimes`                | POST   | Create a new showtime                           |
| `/api/showtimes/movie/:movie_id`| GET    | Retrieves showtimes for a specific movie by ID  |
| `/api/bookings`                 | POST   | Book a ticket for a specific showtime           |
| `/api/bookings?email=:email`    | GET    | Retrieve all bookings by customer email         |

### Example Requests

### 🎬 Retrieve All Movies

**Request:**
```bash
curl http://localhost:3000/api/movies
```

**Sample Response:**
```json
[
  {
    "movie_id": 1,
    "title": "Inception",
    "description": "A mind-bending thriller...",
    "duration_minutes": 148,
    "genre": "Sci-Fi"
  },
  {
    "movie_id": 2,
    "title": "The Matrix",
    "description": "A hacker discovers reality is an illusion.",
    "duration_minutes": 136,
    "genre": "Sci-Fi"
  }
]
```

---

### 🎬 Retrieve a Specific Movie by ID

**Request:**
```bash
curl http://localhost:3000/api/movies/1
```

**Sample Response:**
```json
{
  "movie_id": 1,
  "title": "Inception",
  "description": "A mind-bending thriller...",
  "duration_minutes": 148,
  "genre": "Sci-Fi"
}
```

---

### ✏️ Update a Specific Movie

**Request:**
```bash
curl -X PUT -H "Content-Type: application/json" \
-d '{
  "title": "Inception (Updated)",
  "description": "An updated description...",
  "duration_minutes": 150,
  "genre": "Thriller"
}' http://localhost:3000/api/movies/1
```

**Sample Response:**
```json
{
  "message": "Movie updated successfully."
}
```

---

### 🗑️ Delete a Specific Movie

**Request:**
```bash
curl -X DELETE http://localhost:3000/api/movies/1
```

**Sample Response:**
```json
{
  "message": "Movie deleted successfully."
}
```

---

### 🏛️ Create a New Theatre

**Request:**
```bash
curl -X POST -H "Content-Type: application/json" \
-d '{
  "name": "PVR Cinemas",
  "location": "Downtown City Center"
}' http://localhost:3000/api/theaters
```

**Sample Response:**
```json
{
  "theater_id": 3,
  "name": "PVR Cinemas",
  "location": "Downtown City Center"
}
```

---

### 🏛️ Retrieve All Theatres

**Request:**
```bash
curl http://localhost:3000/api/theaters
```

**Sample Response:**
```json
[
  {
    "theater_id": 1,
    "name": "IMAX Theatre",
    "location": "City Mall"
  },
  {
    "theater_id": 2,
    "name": "Cineplex",
    "location": "Uptown Street"
  }
]
```

---

### ⏰ Create a New Showtime

**Request:**
```bash
curl -X POST -H "Content-Type: application/json" \
-d '{
  "movie_id": 1,
  "theater_id": 3,
  "start_time": "2025-04-26T18:00:00"
}' http://localhost:3000/api/showtimes
```

**Sample Response:**
```json
{
  "showtime_id": 7,
  "movie_id": 1,
  "theater_id": 3,
  "start_time": "2025-04-26T18:00:00"
}
```

---

### ⏳ Retrieve Showtimes for a Specific Movie

**Request:**
```bash
curl http://localhost:3000/api/showtimes/movie/1
```

**Sample Response:**
```json
[
  {
    "showtime_id": 7,
    "theater_name": "PVR Cinemas",
    "start_time": "2025-04-26T18:00:00"
  }
]
```

---

### 🎟️ Book a Ticket for a Specific Showtime

**Request:**
```bash
curl -X POST -H "Content-Type: application/json" \
-d '{
  "showtime_id": 1,
  "customer_name": "John Doe",
  "customer_email": "john@example.com",
  "number_of_tickets": 2
}' http://localhost:3000/api/bookings
```

**Sample Response:**
```json
{
  "booking_id": 5,
  "total_amount": 20.00,
  "status": "confirmed"
}
```

---

### 📩 Retrieve All Bookings by Customer Email

**Request:**
```bash
curl http://localhost:3000/api/bookings?email=john@example.com
```

**Sample Response:**
```json
[
  {
    "booking_id": 5,
    "showtime_id": 1,
    "customer_name": "John Doe",
    "number_of_tickets": 2,
    "total_amount": 20.00,
    "status": "confirmed"
  }
]
```


## ✨ Key Features

- 🎥 **Responsive Design**: Mobile-friendly layouts with horizontal movie cards
- 🔒 **Secure Transactions**: Booking system with rollback safety
- 📧 **Email Notifications**: RabbitMQ-powered notifications for bookings
- 🎭 **Modern UI**: Dark theme with black and red accents
- 📅 **Showtime Management**: Schedule mapping with theaters
- 📱 **Real-Time Availability**: Seat availability updates during selection

---

## 🛠️ Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Node.js, Express, PostgreSQL
- **Messaging**: RabbitMQ
- **Infrastructure**: Docker, Docker Compose
- **Styling**: Font Awesome, CSS Grid/Flexbox

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch:
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes:
   ```bash
   git commit -m 'Add some amazing feature'
   ```
4. Push to your branch:
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

---

## 📄 License

**MIT** © [Rushil Alagh]


# 🎬 CineRed - Movie Ticket Booking System

A modern, containerized solution for seamless movie ticket bookings with real-time management.

---

## 📜 System Architecture Diagram

![System Architecture Diagram](https://github.com/user-attachments/assets/fdf26cea-e6d2-4c5e-9f7f-c93a25ee1cd0)

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

| Endpoint                      | Method | Description                     |
|-------------------------------|--------|---------------------------------|
| `/api/movies`                 | GET    | List all movies                |
| `/api/movies/:id`             | GET    | Get movie details              |
| `/api/showtimes/movie/:id`    | GET    | Get showtimes for a movie      |
| `/api/bookings`               | POST   | Create new booking             |
| `/api/bookings?email=:email`  | GET    | Get bookings by email          |

### Example Requests

#### Fetch movies
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
  }
]
```

#### Create a new booking
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

---

![CineRed Demo](https://via.placeholder.com/800x400?text=CineRed+Interface+Preview)

--- 

Let me know if further adjustments are needed!

require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const cors = require('cors');
const amqp = require('amqplib');

const app = express();
const port = process.env.PORT || 3000;

// Database connection
const pool = new Pool({
    user: process.env.DB_USER || 'movie_admin',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'movie_booking_system',
    password: process.env.DB_PASSWORD || 'securepass123',
    port: process.env.DB_PORT || 5432,
});

// RabbitMQ connection
let rabbitMQConnection;
let channel;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';
const QUEUES = {
    BOOKINGS: 'booking_queue',
    NOTIFICATIONS: 'notification_queue',
    INVENTORY: 'inventory_updates'
};

// Retry config
const RETRY_LIMIT = 5;
const RETRY_DELAY_MS = 3000;

// Delay helper
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Initialize RabbitMQ connection with retry
const initRabbitMQ = async () => {
    let attempt = 0;

    while (attempt < RETRY_LIMIT) {
        try {
            rabbitMQConnection = await amqp.connect(RABBITMQ_URL);
            channel = await rabbitMQConnection.createChannel();

            // Assert queues
            await channel.assertQueue(QUEUES.BOOKINGS, { durable: true });
            await channel.assertQueue(QUEUES.NOTIFICATIONS, { durable: true });
            await channel.assertQueue(QUEUES.INVENTORY, { durable: true });

            console.log('✅ Connected to RabbitMQ successfully');

            // Start consumers
            startBookingConsumer();
            startNotificationConsumer();
            startInventoryConsumer();

            break; // Exit retry loop on success

        } catch (err) {
            attempt++;
            console.error(`❌ Attempt ${attempt} - Failed to connect to RabbitMQ:`, err.message);

            if (attempt >= RETRY_LIMIT) {
                console.error('❌ Max retry limit reached. Could not connect to RabbitMQ.');
                process.exit(1); // Optional: exit process or continue in degraded mode
            }

            const retryDelay = RETRY_DELAY_MS * attempt; // Exponential backoff
            console.log(`🔁 Retrying in ${retryDelay / 1000} seconds...`);
            await delay(retryDelay);
        }
    }
};

// RabbitMQ Consumers
const startBookingConsumer = () => {
    channel.consume(QUEUES.BOOKINGS, async (msg) => {
        if (msg !== null) {
            try {
                const bookingData = JSON.parse(msg.content.toString());
                console.log('🎟️ Processing booking:', bookingData);

                channel.sendToQueue(
                    QUEUES.NOTIFICATIONS,
                    Buffer.from(JSON.stringify({
                        type: 'BOOKING_CONFIRMATION',
                        data: bookingData
                    })),
                    { persistent: true }
                );

                channel.ack(msg);
            } catch (err) {
                console.error('⚠️ Error processing booking:', err);
            }
        }
    });
};

const startNotificationConsumer = () => {
    channel.consume(QUEUES.NOTIFICATIONS, async (msg) => {
        if (msg !== null) {
            try {
                const notification = JSON.parse(msg.content.toString());
                console.log('📨 Processing notification:', notification);

                if (notification.type === 'BOOKING_CONFIRMATION') {
                    console.log(`📧 Sending booking confirmation to ${notification.data.customer_email}`);
                    // await sendEmail(notification.data.customer_email, 'Booking Confirmation', ...);
                }

                channel.ack(msg);
            } catch (err) {
                console.error('⚠️ Error processing notification:', err);
            }
        }
    });
};

const startInventoryConsumer = () => {
    channel.consume(QUEUES.INVENTORY, async (msg) => {
        if (msg !== null) {
            try {
                const update = JSON.parse(msg.content.toString());
                console.log('📦 Processing inventory update:', update);

                // Update inventory system here

                channel.ack(msg);
            } catch (err) {
                console.error('⚠️ Error processing inventory update:', err);
            }
        }
    });
};
// Retry logic for PostgreSQL
const connectWithRetry = (retries = 5, delay = 3000) => {
    pool.connect()
        .then(client => {
            console.log('✅ Connected to PostgreSQL database successfully');
            client.release();
            // Initialize RabbitMQ after DB connection is established
            initRabbitMQ();
        })
        .catch(err => {
            console.error(`❌ Failed to connect to the PostgreSQL database. Attempting retry...`);
            if (retries > 0) {
                console.log(`⏳ Retrying in ${delay / 1000} seconds...`);
                setTimeout(() => connectWithRetry(retries - 1, delay * 2), delay);
            } else {
                console.error('❌ Max retries reached. Could not connect to the database:', err.message);
            }
        });
};

// Start the connection attempt
connectWithRetry();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// Movies CRUD
// Create a new movie
app.post('/api/bookings', async (req, res) => {
    try {
        const { showtime_id, customer_name, customer_email, number_of_tickets } = req.body;
        
        // Check if showtime exists and has enough seats
        const showtimeCheck = await pool.query('SELECT * FROM showtimes WHERE showtime_id = $1', [showtime_id]);
        if (showtimeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Showtime not found' });
        }
        
        const showtime = showtimeCheck.rows[0];
        if (showtime.available_seats < number_of_tickets) {
            return res.status(400).json({ error: 'Not enough seats available' });
        }
        
        // Calculate total amount
        const total_amount = showtime.price * number_of_tickets;
        
        // Start transaction
        await pool.query('BEGIN');
        
        try {
            // Create booking
            const bookingQuery = `
                INSERT INTO bookings (showtime_id, customer_name, customer_email, number_of_tickets, total_amount)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            const bookingValues = [showtime_id, customer_name, customer_email, number_of_tickets, total_amount];
            const bookingResult = await pool.query(bookingQuery, bookingValues);
            const booking = bookingResult.rows[0];
            
            // Update available seats
            const updateQuery = `
                UPDATE showtimes
                SET available_seats = available_seats - $1
                WHERE showtime_id = $2;
            `;
            await pool.query(updateQuery, [number_of_tickets, showtime_id]);
            
            // Commit transaction
            await pool.query('COMMIT');
            
            // Send to RabbitMQ queues
            if (channel) {
                // Send to booking queue for processing
                channel.sendToQueue(
                    QUEUES.BOOKINGS,
                    Buffer.from(JSON.stringify(booking)),
                    { persistent: true }
                );
                
                // Send to inventory queue
                channel.sendToQueue(
                    QUEUES.INVENTORY,
                    Buffer.from(JSON.stringify({
                        type: 'SEATS_BOOKED',
                        showtime_id,
                        seats_booked: number_of_tickets,
                        remaining_seats: showtime.available_seats - number_of_tickets
                    })),
                    { persistent: true }
                );
            }
            
            res.status(201).json(booking);
        } catch (err) {
            // Rollback transaction on error
            await pool.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all movies
app.get('/api/movies', async (req, res) => {
    try {
        const query = 'SELECT * FROM movies ORDER BY title;';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get a single movie
app.get('/api/movies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'SELECT * FROM movies WHERE movie_id = $1;';
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Update a movie
app.put('/api/movies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, duration_minutes, release_date, genre, director, cast, poster_url } = req.body;
        const query = `
            UPDATE movies
            SET title = $1, description = $2, duration_minutes = $3, release_date = $4, 
                genre = $5, director = $6, cast = $7, poster_url = $8, updated_at = CURRENT_TIMESTAMP
            WHERE movie_id = $9
            RETURNING *;
        `;
        const values = [title, description, duration_minutes, release_date, genre, director, cast, poster_url, id];
        const result = await pool.query(query, values);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Delete a movie
app.delete('/api/movies/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = 'DELETE FROM movies WHERE movie_id = $1 RETURNING *;';
        const result = await pool.query(query, [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        res.json({ message: 'Movie deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Theaters CRUD
// Create a new theater
app.post('/api/theaters', async (req, res) => {
    try {
        const { name, location, seating_capacity } = req.body;
        const query = `
            INSERT INTO theaters (name, location, seating_capacity)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const values = [name, location, seating_capacity];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get all theaters
app.get('/api/theaters', async (req, res) => {
    try {
        const query = 'SELECT * FROM theaters ORDER BY name;';
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Showtimes CRUD
// Create a new showtime
app.post('/api/showtimes', async (req, res) => {
    try {
        const { movie_id, theater_id, start_time, end_time, price, available_seats } = req.body;
        
        // Check if movie exists
        const movieCheck = await pool.query('SELECT 1 FROM movies WHERE movie_id = $1', [movie_id]);
        if (movieCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        
        // Check if theater exists
        const theaterCheck = await pool.query('SELECT 1 FROM theaters WHERE theater_id = $1', [theater_id]);
        if (theaterCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Theater not found' });
        }
        
        const query = `
            INSERT INTO showtimes (movie_id, theater_id, start_time, end_time, price, available_seats)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING *;
        `;
        const values = [movie_id, theater_id, start_time, end_time, price, available_seats];
        const result = await pool.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get showtimes for a movie
app.get('/api/showtimes/movie/:movie_id', async (req, res) => {
    try {
        const { movie_id } = req.params;
        const query = `
            SELECT s.*, m.title as movie_title, m.poster_url, t.name as theater_name, t.location
            FROM showtimes s
            JOIN movies m ON s.movie_id = m.movie_id
            JOIN theaters t ON s.theater_id = t.theater_id
            WHERE s.movie_id = $1 AND s.start_time > CURRENT_TIMESTAMP
            ORDER BY s.start_time;
        `;
        const result = await pool.query(query, [movie_id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Bookings CRUD
// Create a new booking
app.post('/api/bookings', async (req, res) => {
    try {
        const { showtime_id, customer_name, customer_email, number_of_tickets } = req.body;
        
        // Check if showtime exists and has enough seats
        const showtimeCheck = await pool.query('SELECT * FROM showtimes WHERE showtime_id = $1', [showtime_id]);
        if (showtimeCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Showtime not found' });
        }
        
        const showtime = showtimeCheck.rows[0];
        if (showtime.available_seats < number_of_tickets) {
            return res.status(400).json({ error: 'Not enough seats available' });
        }
        
        // Calculate total amount
        const total_amount = showtime.price * number_of_tickets;
        
        // Start transaction
        await pool.query('BEGIN');
        
        try {
            // Create booking
            const bookingQuery = `
                INSERT INTO bookings (showtime_id, customer_name, customer_email, number_of_tickets, total_amount)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING *;
            `;
            const bookingValues = [showtime_id, customer_name, customer_email, number_of_tickets, total_amount];
            const bookingResult = await pool.query(bookingQuery, bookingValues);
            
            // Update available seats
            const updateQuery = `
                UPDATE showtimes
                SET available_seats = available_seats - $1
                WHERE showtime_id = $2;
            `;
            await pool.query(updateQuery, [number_of_tickets, showtime_id]);
            
            // Commit transaction
            await pool.query('COMMIT');
            
            res.status(201).json(bookingResult.rows[0]);
        } catch (err) {
            // Rollback transaction on error
            await pool.query('ROLLBACK');
            throw err;
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get bookings by email
app.get('/api/bookings', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            return res.status(400).json({ error: 'Email parameter is required' });
        }
        
        const query = `
            SELECT b.*, m.title as movie_title, s.start_time, t.name as theater_name
            FROM bookings b
            JOIN showtimes s ON b.showtime_id = s.showtime_id
            JOIN movies m ON s.movie_id = m.movie_id
            JOIN theaters t ON s.theater_id = t.theater_id
            WHERE b.customer_email = $1
            ORDER BY b.booking_date DESC;
        `;
        const result = await pool.query(query, [email]);
        res.json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
process.on('SIGINT', async () => {
    console.log('Shutting down gracefully...');
    try {
        if (channel) await channel.close();
        if (rabbitMQConnection) await rabbitMQConnection.close();
        await pool.end();
        process.exit(0);
    } catch (err) {
        console.error('Error during shutdown:', err);
        process.exit(1);
    }
});


// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
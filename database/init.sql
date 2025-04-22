-- Create schema and sample data
-- Tables
CREATE TABLE movies (
    movie_id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_minutes INTEGER,
    release_date DATE,
    genre VARCHAR(100),
    director VARCHAR(255),
    "cast" TEXT,  
    poster_url VARCHAR(512),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


CREATE TABLE theaters (
    theater_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    location VARCHAR(512) NOT NULL,
    seating_capacity INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE showtimes (
    showtime_id SERIAL PRIMARY KEY,
    movie_id INTEGER REFERENCES movies(movie_id) ON DELETE CASCADE,
    theater_id INTEGER REFERENCES theaters(theater_id) ON DELETE CASCADE,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    available_seats INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    showtime_id INTEGER REFERENCES showtimes(showtime_id) ON DELETE CASCADE,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    number_of_tickets INTEGER NOT NULL,
    total_amount DECIMAL(10, 2) NOT NULL,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'confirmed'
);

-- Indexes
CREATE INDEX idx_showtimes_movie_id ON showtimes(movie_id);
CREATE INDEX idx_showtimes_theater_id ON showtimes(theater_id);
CREATE INDEX idx_bookings_showtime_id ON bookings(showtime_id);

-- Sample Data
INSERT INTO movies (title, description, duration_minutes, release_date, genre, director, "cast", poster_url)
VALUES 
('Inception', 'A mind-bending thriller where dream invasion is possible.', 148, '2010-07-16', 'Sci-Fi', 'Christopher Nolan', 'Leonardo DiCaprio, Joseph Gordon-Levitt, Ellen Page', 'https://m.media-amazon.com/images/M/MV5BMTM0MjUzNjkwMl5BMl5BanBnXkFtZTcwNjY0OTk1Mw@@._V1_.jpg'),
('The Dark Knight', 'Batman faces the Joker, a criminal mastermind.', 152, '2008-07-18', 'Action', 'Christopher Nolan', 'Christian Bale, Heath Ledger, Aaron Eckhart', 'https://resizing.flixster.com/xni2iHPzCDo8ysASOFoY4_WU0GE=/fit-in/705x460/v2/https://resizing.flixster.com/VNYWWAAYx5IKAFIEUpo8OWVIMR0=/ems.cHJkLWVtcy1hc3NldHMvbW92aWVzL2UzZjBiMzc2LWI0YWMtNDYxYS05OWJmLWFiZDU1OGJhZTU5ZC53ZWJw'),
('Interstellar', 'A team travels through a wormhole in space to ensure humanitys survival.', 169, '2014-11-07', 'Sci-Fi', 'Christopher Nolan', 'Matthew McConaughey, Anne Hathaway, Jessica Chastain', 'https://resizing.flixster.com/-XZAfHZM39UwaGJIFWKAE8fS0ak=/v3/t/assets/p10543523_p_v8_as.jpg'),
('Fight Club', 'An insomniac office worker and a devil-may-care soapmaker form an underground fight club that evolves into something much, much more.', 139, '1999-10-15', 'Drama/Thriller', 'David Fincher', 'Brad Pitt, Edward Norton, Helena Bonham Carter', 'https://m.media-amazon.com/images/M/MV5BOTgyOGQ1NDItNGU3Ny00MjU3LTg2YWEtNmEyYjBiMjI1Y2M5XkEyXkFqcGc@._V1_FMjpg_UX1000_.jpg'),
('The Shawshank Redemption', 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', 142, '1994-09-23', 'Drama', 'Frank Darabont', 'Tim Robbins, Morgan Freeman, Bob Gunton', 'https://m.media-amazon.com/images/M/MV5BNDE3ODcxYzMtY2YzZC00NmNlLWJiNDMtZDViZWM2MzIxZDYwXkEyXkFqcGdeQXVyNjAwNDUxODI@._V1_.jpg'),
('Whiplash', 'A promising young drummer enrolls at a cut-throat music conservatory where his dreams of greatness are mentored by an instructor who will stop at nothing to realize a student''s potential.', 106, '2014-10-10', 'Drama/Music', 'Damien Chazelle', 'Miles Teller, J.K. Simmons, Melissa Benoist', 'https://m.media-amazon.com/images/M/MV5BOTA5NDZlZGUtMjAxOS00YTRkLTkwYmMtYWQ0NWEwZDZiNjEzXkEyXkFqcGdeQXVyMTMxODk2OTU@._V1_FMjpg_UX1000_.jpg');


INSERT INTO theaters (name, location, seating_capacity)
VALUES 
('Cineplex Downtown', '123 Main Street, City Center', 150),
('Galaxy Cinemas', '45 Elm Avenue, Uptown', 200);

INSERT INTO showtimes (movie_id, theater_id, start_time, end_time, price, available_seats)
VALUES 
(1, 1, '2025-04-22 14:00:00', '2025-04-22 16:28:00', 10.00, 150),
(1, 2, '2025-04-22 18:00:00', '2025-04-22 20:28:00', 12.00, 200),
(2, 1, '2025-04-23 17:00:00', '2025-04-23 19:32:00', 11.00, 100),
(3, 2, '2025-04-23 20:00:00', '2025-04-23 22:49:00', 13.00, 190),
(4, 1, '2025-04-24 16:00:00', '2025-04-24 18:19:00', 9.50, 140),
(4, 2, '2025-04-24 20:30:00', '2025-04-24 22:49:00', 11.00, 180),
(5, 1, '2025-04-25 15:00:00', '2025-04-25 17:22:00', 10.50, 130),
(5, 2, '2025-04-25 19:00:00', '2025-04-25 21:22:00', 12.00, 195),
(6, 1, '2025-04-26 14:00:00', '2025-04-26 15:46:00', 8.00, 125),
(6, 2, '2025-04-26 17:30:00', '2025-04-26 19:16:00', 10.00, 190);

INSERT INTO bookings (showtime_id, customer_name, customer_email, number_of_tickets, total_amount)
VALUES 
(1, 'John Doe', 'john@example.com', 2, 20.00),
(2, 'Alice Smith', 'alice@example.com', 3, 36.00),
(3, 'Bob Johnson', 'bob@example.com', 1, 11.00),
(4, 'Emma Brown', 'emma@example.com', 4, 52.00);

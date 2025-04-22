// app.js
document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const moviesSection = document.getElementById('movies-section');
    const bookingsSection = document.getElementById('bookings-section');
    const moviesList = document.getElementById('movies-list');
    const bookingsList = document.getElementById('bookings-list');
    const searchBookingsBtn = document.getElementById('search-bookings');
    const emailInput = document.getElementById('email-input');
    const navLinks = document.querySelectorAll('nav a');
    
    // Modal Elements
    const movieModal = document.getElementById('movie-modal');
    const bookingModal = document.getElementById('booking-modal');
    const movieDetails = document.getElementById('movie-details');
    const bookingFormContainer = document.getElementById('booking-form-container');
    const closeButtons = document.querySelectorAll('.close');
    
    // Current selected showtime for booking
    let currentShowtime = null;
    
    // Event Listeners
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            
            // Update active nav link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding section
            if (section === 'movies') {
                moviesSection.style.display = 'block';
                bookingsSection.style.display = 'none';
                loadMovies();
            } else if (section === 'bookings') {
                moviesSection.style.display = 'none';
                bookingsSection.style.display = 'block';
            }
        });
    });
    
    searchBookingsBtn.addEventListener('click', function() {
        const email = emailInput.value.trim();
        if (email) {
            loadBookings(email);
        } else {
            alert('Please enter your email address');
        }
    });
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            movieModal.style.display = 'none';
            bookingModal.style.display = 'none';
        });
    });
    
    // Close modals when clicking outside
    window.addEventListener('click', function(e) {
        if (e.target === movieModal) {
            movieModal.style.display = 'none';
        }
        if (e.target === bookingModal) {
            bookingModal.style.display = 'none';
        }
    });
    
    // Load initial data
    loadMovies();
    
    // Functions
    async function loadMovies() {
        try {
            const response = await fetch('http://localhost:3000/api/movies');
            const movies = await response.json();
            
            moviesList.innerHTML = '';
            
            if (movies.length === 0) {
                moviesList.innerHTML = '<p>No movies available at the moment.</p>';
                return;
            }
            
            movies.forEach(movie => {
                const movieCard = document.createElement('div');
                movieCard.className = 'movie-card';
                movieCard.innerHTML = `
                    <img src="${movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Poster'}" alt="${movie.title}" class="movie-poster">
                    <div class="movie-info">
                        <h3 class="movie-title">${movie.title}</h3>
                        <div class="movie-meta">
                            <span>${movie.genre}</span>
                            <span>${movie.duration_minutes} min</span>
                        </div>
                        <button class="book-btn" data-id="${movie.movie_id}">View Details</button>
                    </div>
                `;
                moviesList.appendChild(movieCard);
            });
            
            // Add event listeners to movie cards
            document.querySelectorAll('.book-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const movieId = this.getAttribute('data-id');
                    showMovieDetails(movieId);
                });
            });
        } catch (error) {
            console.error('Error loading movies:', error);
            moviesList.innerHTML = '<p>Error loading movies. Please try again later.</p>';
        }
    }
    
    async function showMovieDetails(movieId) {
        try {
            // Fetch movie details
            const movieResponse = await fetch(`http://localhost:3000/api/movies/${movieId}`);
            const movie = await movieResponse.json();
            
            // Fetch showtimes for this movie
            const showtimesResponse = await fetch(`http://localhost:3000/api/showtimes/movie/${movieId}`);
            const showtimes = await showtimesResponse.json();
            
            // Display movie details in modal
            movieDetails.innerHTML = `
                <div class="movie-details">
                    <div class="movie-details-poster">
                        <img src="${movie.poster_url || 'https://via.placeholder.com/300x450?text=No+Poster'}" alt="${movie.title}">
                    </div>
                    <div class="movie-details-info">
                        <h2 class="movie-details-title">${movie.title}</h2>
                        <div class="movie-details-meta">
                            <span><i class="fas fa-clock"></i> ${movie.duration_minutes} min</span>
                            <span><i class="fas fa-calendar-alt"></i> ${new Date(movie.release_date).toLocaleDateString()}</span>
                            <span><i class="fas fa-tag"></i> ${movie.genre}</span>
                        </div>
                        <div class="movie-details-description">
                            <h4>Overview</h4>
                            <p>${movie.description || 'No description available.'}</p>
                        </div>
                        <div class="movie-details-meta">
                            <span><i class="fas fa-user"></i> Director: ${movie.director || 'Unknown'}</span>
                        </div>
                        <div class="movie-details-meta">
                            <span><i class="fas fa-users"></i> Cast: ${movie.cast || 'Unknown'}</span>
                        </div>
                    </div>
                </div>
                
                <div class="showtimes-list">
                    <h3>Showtimes</h3>
                    ${showtimes.length > 0 ? 
                        showtimes.map(showtime => `
                            <div class="showtime-item">
                                <div class="showtime-info">
                                    <div class="showtime-theater">${showtime.theater_name}</div>
                                    <div class="showtime-time">${new Date(showtime.start_time).toLocaleString()}</div>
                                    <div class="showtime-seats">${showtime.available_seats} seats available</div>
                                </div>
                                <div class="showtime-price">$${Number(showtime.price).toFixed(2)}</div>
                                <button class="book-showtime-btn" data-id="${showtime.showtime_id}">Book Now</button>
                            </div>
                        `).join('') : 
                        '<p>No showtimes available for this movie.</p>'}
                </div>
            `;
            
            // Add event listeners to book buttons
            document.querySelectorAll('.book-showtime-btn').forEach(button => {
                button.addEventListener('click', function() {
                    const showtimeId = this.getAttribute('data-id');
                    currentShowtime = showtimes.find(s => s.showtime_id == showtimeId);
                    showBookingForm(currentShowtime);
                });
            });
            
            // Show modal
            movieModal.style.display = 'block';
        } catch (error) {
            console.error('Error loading movie details:', error);
            movieDetails.innerHTML = '<p>Error loading movie details. Please try again later.</p>';
            movieModal.style.display = 'block';
        }
    }
    
    function showBookingForm(showtime) {
        bookingFormContainer.innerHTML = `
            <h3>Book Tickets for ${showtime.movie_title}</h3>
            <p><strong>Theater:</strong> ${showtime.theater_name}</p>
            <p><strong>Time:</strong> ${new Date(showtime.start_time).toLocaleString()}</p>
            <p><strong>Price per ticket:</strong> $${Number(showtime.price).toFixed(2)}</p>
            
            <form id="booking-form" class="booking-form">
                <input type="hidden" id="showtime-id" value="${showtime.showtime_id}">
                
                <div class="form-group">
                    <label for="customer-name">Full Name</label>
                    <input type="text" id="customer-name" required>
                </div>
                
                <div class="form-group">
                    <label for="customer-email">Email</label>
                    <input type="email" id="customer-email" required>
                </div>
                
                <div class="form-group">
                    <label for="number-of-tickets">Number of Tickets (Max ${showtime.available_seats})</label>
                    <input type="number" id="number-of-tickets" min="1" max="${showtime.available_seats}" required>
                </div>
                
                <button type="submit" class="submit-btn">Confirm Booking</button>
            </form>
        `;
        
        document.getElementById('booking-form').addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const bookingData = {
                showtime_id: showtime.showtime_id,
                customer_name: document.getElementById('customer-name').value,
                customer_email: document.getElementById('customer-email').value,
                number_of_tickets: parseInt(document.getElementById('number-of-tickets').value)
            };
            
            try {
                const response = await fetch('http://localhost:3000/api/bookings', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(bookingData)
                });
                
                if (response.ok) {
                    const booking = await response.json();
                    alert(`Booking confirmed! Total amount: $${Number(booking.total_amount).toFixed(2)}`);
                    bookingModal.style.display = 'none';
                    movieModal.style.display = 'none';
                } else {
                    const error = await response.json();
                    alert(`Error: ${error.error}`);
                }
            } catch (error) {
                console.error('Error creating booking:', error);
                alert('Error creating booking. Please try again later.');
            }
        });
        
        bookingModal.style.display = 'block';
    }
    
    async function loadBookings(email) {
        try {
            const response = await fetch(`http://localhost:3000/api/bookings?email=${encodeURIComponent(email)}`);
            const bookings = await response.json();
            
            bookingsList.innerHTML = '';
            
            if (bookings.length === 0) {
                bookingsList.innerHTML = '<p>No bookings found for this email address.</p>';
                return;
            }
            
            bookings.forEach(booking => {
                const bookingCard = document.createElement('div');
                bookingCard.className = 'booking-card';
                bookingCard.innerHTML = `
                    <div class="booking-header">
                        <div class="booking-movie">${booking.movie_title}</div>
                        <div class="booking-status status-confirmed">${booking.status}</div>
                    </div>
                    <div class="booking-theater">${booking.theater_name}</div>
                    <div class="booking-time">${new Date(booking.start_time).toLocaleString()}</div>
                    <div class="booking-details">
                        <div>
                            <div>Tickets: ${booking.number_of_tickets}</div>
                            <div>Total: $${Number(booking.total_amount).toFixed(2)}</div>
                        </div>
                        <div>
                            <div>Booked on: ${new Date(booking.booking_date).toLocaleDateString()}</div>
                        </div>
                    </div>
                `;
                bookingsList.appendChild(bookingCard);
            });
        } catch (error) {
            console.error('Error loading bookings:', error);
            bookingsList.innerHTML = '<p>Error loading bookings. Please try again later.</p>';
        }
    }
});
const bcrypt = require('bcryptjs');

const seedAdmin = {
  _id: '662b00000000000000000001',
  username: 'admin',
  email: 'admin@imovies.com',
  password: bcrypt.hashSync('Admin@123', 10),
  role: 'admin',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const seedUser = {
  _id: '662b00000000000000000002',
  username: 'primeuser',
  email: 'user@imovies.com',
  password: bcrypt.hashSync('User@123', 10),
  role: 'user',
  isVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

const seedMovies = [
  {
    _id: '662b00000000000000000011',
    movieName: 'Interstellar: Beyond Horizons',
    description: 'A team of explorers travels through a newly discovered wormhole near Saturn in an attempt to ensure humanity\'s survival beyond the dying Earth, confronting gravitational time dilation and cosmic singularities.',
    genres: ['Sci-Fi', 'Adventure', 'Drama'],
    releaseDate: '2024-04-12',
    language: 'English',
    duration: '2h 49m',
    certification: 'U/A 13+',
    posterUrl: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?w=600&h=900&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?w=1600&h=900&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=zSWdZVtXT7E',
    director: 'Christopher Nolan',
    cast: ['Matthew McConaughey', 'Anne Hathaway', 'Jessica Chastain', 'Michael Caine'],
    rating: 8.9,
    voteCount: 3840,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000012',
    movieName: 'CyberCity 2099',
    description: 'In a dystopian neo-Tokyo bathed in rain and neon holograms, a rogue cyber-detective uncovers an artificial intelligence consciousness plotting the digital transcendence of mankind.',
    genres: ['Action', 'Sci-Fi', 'Thriller'],
    releaseDate: '2024-05-18',
    language: 'English',
    duration: '2h 22m',
    certification: 'A (18+)',
    posterUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=600&h=900&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&h=900&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    director: 'Denis Villeneuve',
    cast: ['Ryan Gosling', 'Ana de Armas', 'Harrison Ford', 'Sylvia Hoeks'],
    rating: 8.7,
    voteCount: 2950,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000013',
    movieName: 'Echoes of Eternity',
    description: 'A spellbinding fantasy odyssey following an immortal warrior bound by an ancient oath to protect the sacred tree of life against cosmic darkness encroaching from forgotten dimensions.',
    genres: ['Fantasy', 'Action', 'Adventure'],
    releaseDate: '2024-06-01',
    language: 'English',
    duration: '2h 35m',
    certification: 'U/A 16+',
    posterUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=600&h=900&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&h=900&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    director: 'Guillermo del Toro',
    cast: ['Oscar Isaac', 'Cate Blanchett', 'Willem Dafoe', 'Mads Mikkelsen'],
    rating: 8.5,
    voteCount: 1820,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000014',
    movieName: 'Dune: The Prophecy',
    description: 'Paul Atreides unites with Chani and the Fremen while seeking revenge against the conspirators who destroyed his family. Facing a choice between the love of his life and the fate of the known universe.',
    genres: ['Sci-Fi', 'Adventure', 'Action'],
    releaseDate: '2024-03-01',
    language: 'English',
    duration: '2h 46m',
    certification: 'U/A 16+',
    posterUrl: 'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?w=600&h=900&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1600&h=900&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=Way9Dexny3w',
    director: 'Denis Villeneuve',
    cast: ['Timothée Chalamet', 'Zendaya', 'Rebecca Ferguson', 'Javier Bardem'],
    rating: 8.8,
    voteCount: 4200,
    featured: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000015',
    movieName: 'Dil Ki Dhadkan',
    description: 'A vibrant modern romantic drama about two ambitious musicians whose paths cross on the streets of Mumbai and Florence, creating unforgettable symphonies and navigating passionate love.',
    genres: ['Romance', 'Drama', 'Music'],
    releaseDate: '2024-04-05',
    language: 'Hindi',
    duration: '2h 25m',
    certification: 'U',
    posterUrl: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&h=900&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&h=900&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    director: 'Zoya Akhtar',
    cast: ['Ranbir Kapoor', 'Alia Bhatt', 'Ranveer Singh', 'Kalki Koechlin'],
    rating: 8.2,
    voteCount: 1540,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000016',
    movieName: 'Shadow Vanguard',
    description: 'An undercover intelligence operative is disavowed after uncovering a nuclear conspiracy deep inside European financial institutions. He has 48 hours to clear his name.',
    genres: ['Action', 'Thriller'],
    releaseDate: '2024-02-28',
    language: 'English',
    duration: '2h 10m',
    certification: 'A (18+)',
    posterUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=600&h=900&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&h=900&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    director: 'Chad Stahelski',
    cast: ['Keanu Reeves', 'Donnie Yen', 'Hiroyuki Sanada', 'Bill Skarsgård'],
    rating: 8.4,
    voteCount: 2600,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000017',
    movieName: 'The Haunting of Ravenwood',
    description: 'When an estranged family inherits an aristocratic estate isolated in the Scottish highlands, they discover ancestral secrets and supernatural entities trapped behind the mirrors.',
    genres: ['Horror', 'Mystery', 'Thriller'],
    releaseDate: '2024-05-10',
    language: 'English',
    duration: '1h 58m',
    certification: 'A (18+)',
    posterUrl: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?w=600&h=900&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=1600&h=900&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    director: 'James Wan',
    cast: ['Vera Farmiga', 'Patrick Wilson', 'Mia Goth', 'Bill Pullman'],
    rating: 7.9,
    voteCount: 1410,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000018',
    movieName: 'Leo: Bloodlines',
    description: 'A mild-mannered cafe owner in a quiet hill town is drawn into a brutal gang war when ruthless mobsters mistake him for an elusive underworld assassin with a bloody past.',
    genres: ['Action', 'Thriller', 'Drama'],
    releaseDate: '2024-01-20',
    language: 'Tamil',
    duration: '2h 44m',
    certification: 'U/A 16+',
    posterUrl: 'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?w=600&h=900&fit=crop',
    backdropUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=1600&h=900&fit=crop',
    trailerUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    director: 'Lokesh Kanagaraj',
    cast: ['Thalapathy Vijay', 'Sanjay Dutt', 'Trisha Krishnan', 'Arjun Sarja'],
    rating: 8.3,
    voteCount: 3100,
    featured: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const seedTheatres = [
  {
    _id: '662b00000000000000000021',
    theatreId: 'th_pvr_prime_01',
    theatreName: 'PVR Prime Cinema: Gold Luxe',
    location: 'Bandra West, Mumbai',
    adminEmail: 'admin@imovies.com',
    balconySeatPrice: 350,
    middleSeatPrice: 250,
    lowerSeatPrice: 150,
    balconySeats: { rows: 2, cols: 8 },
    middleSeats: { rows: 3, cols: 8 },
    lowerSeats: { rows: 2, cols: 8 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000022',
    theatreId: 'th_inox_megaplex_02',
    theatreName: 'INOX Prime Megaplex: IMAX Laser',
    location: 'Connaught Place, New Delhi',
    adminEmail: 'admin@imovies.com',
    balconySeatPrice: 380,
    middleSeatPrice: 280,
    lowerSeatPrice: 180,
    balconySeats: { rows: 2, cols: 8 },
    middleSeats: { rows: 3, cols: 8 },
    lowerSeats: { rows: 2, cols: 8 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000023',
    theatreId: 'th_cinepolis_vip_03',
    theatreName: 'Cinépolis VIP Theatre',
    location: 'Koramangala, Bengaluru',
    adminEmail: 'admin@imovies.com',
    balconySeatPrice: 320,
    middleSeatPrice: 220,
    lowerSeatPrice: 140,
    balconySeats: { rows: 2, cols: 8 },
    middleSeats: { rows: 3, cols: 8 },
    lowerSeats: { rows: 2, cols: 8 },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

/**
 * Generate standard tier-based seat layout for a show
 */
function generateTicketsMap(balconyPrice = 350, middlePrice = 250, lowerPrice = 150) {
  const tickets = {};
  // Balcony: Rows A, B (cols 1-8)
  ['A', 'B'].forEach((row) => {
    for (let c = 1; c <= 8; c++) {
      const id = `${row}${c}`;
      tickets[id] = {
        seatId: id,
        tier: 'Balcony',
        price: balconyPrice,
        status: 'available'
      };
    }
  });

  // Middle: Rows C, D, E (cols 1-8)
  ['C', 'D', 'E'].forEach((row) => {
    for (let c = 1; c <= 8; c++) {
      const id = `${row}${c}`;
      tickets[id] = {
        seatId: id,
        tier: 'Middle',
        price: middlePrice,
        status: 'available'
      };
    }
  });

  // Lower: Rows F, G (cols 1-8)
  ['F', 'G'].forEach((row) => {
    for (let c = 1; c <= 8; c++) {
      const id = `${row}${c}`;
      tickets[id] = {
        seatId: id,
        tier: 'Lower',
        price: lowerPrice,
        status: 'available'
      };
    }
  });

  return tickets;
}

const todayStr = new Date().toISOString().split('T')[0];
const tomorrow = new Date();
tomorrow.setDate(tomorrow.getDate() + 1);
const tomorrowStr = tomorrow.toISOString().split('T')[0];

const dayAfter = new Date();
dayAfter.setDate(dayAfter.getDate() + 2);
const dayAfterStr = dayAfter.toISOString().split('T')[0];

const seedShows = [
  // Interstellar shows
  {
    _id: '662b00000000000000000031',
    showId: 'show_interstellar_pvr_01',
    adminEmail: 'admin@imovies.com',
    movieId: '662b00000000000000000011',
    movieName: 'Interstellar: Beyond Horizons',
    theatreId: 'th_pvr_prime_01',
    theatreName: 'PVR Prime Cinema: Gold Luxe',
    screenName: 'Screen 1 (Laser 4K)',
    showDate: todayStr,
    showTime: '06:30 PM',
    tickets: generateTicketsMap(350, 250, 150),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000032',
    showId: 'show_interstellar_pvr_02',
    adminEmail: 'admin@imovies.com',
    movieId: '662b00000000000000000011',
    movieName: 'Interstellar: Beyond Horizons',
    theatreId: 'th_pvr_prime_01',
    screenName: 'Screen 1 (Laser 4K)',
    showDate: todayStr,
    showTime: '09:45 PM',
    tickets: generateTicketsMap(350, 250, 150),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000033',
    showId: 'show_interstellar_inox_01',
    adminEmail: 'admin@imovies.com',
    movieId: '662b00000000000000000011',
    movieName: 'Interstellar: Beyond Horizons',
    theatreId: 'th_inox_megaplex_02',
    theatreName: 'INOX Prime Megaplex: IMAX Laser',
    screenName: 'IMAX Audi 1',
    showDate: tomorrowStr,
    showTime: '07:15 PM',
    tickets: generateTicketsMap(380, 280, 180),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // CyberCity 2099 shows
  {
    _id: '662b00000000000000000034',
    showId: 'show_cybercity_pvr_01',
    adminEmail: 'admin@imovies.com',
    movieId: '662b00000000000000000012',
    movieName: 'CyberCity 2099',
    theatreId: 'th_pvr_prime_01',
    theatreName: 'PVR Prime Cinema: Gold Luxe',
    screenName: 'Screen 2 (Dolby Atmos)',
    showDate: todayStr,
    showTime: '08:00 PM',
    tickets: generateTicketsMap(350, 250, 150),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000035',
    showId: 'show_cybercity_cinepolis_01',
    adminEmail: 'admin@imovies.com',
    movieId: '662b00000000000000000012',
    movieName: 'CyberCity 2099',
    theatreId: 'th_cinepolis_vip_03',
    theatreName: 'Cinépolis VIP Theatre',
    screenName: 'Audi 3',
    showDate: tomorrowStr,
    showTime: '05:30 PM',
    tickets: generateTicketsMap(320, 220, 140),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },

  // Dune: The Prophecy shows
  {
    _id: '662b00000000000000000036',
    showId: 'show_dune_inox_01',
    adminEmail: 'admin@imovies.com',
    movieId: '662b00000000000000000014',
    movieName: 'Dune: The Prophecy',
    theatreId: 'th_inox_megaplex_02',
    theatreName: 'INOX Prime Megaplex: IMAX Laser',
    screenName: 'IMAX Audi 1',
    showDate: todayStr,
    showTime: '07:30 PM',
    tickets: generateTicketsMap(380, 280, 180),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000037',
    showId: 'show_dune_cinepolis_01',
    adminEmail: 'admin@imovies.com',
    movieId: '662b00000000000000000014',
    movieName: 'Dune: The Prophecy',
    theatreId: 'th_cinepolis_vip_03',
    theatreName: 'Cinépolis VIP Theatre',
    screenName: 'Audi 2',
    showDate: dayAfterStr,
    showTime: '08:45 PM',
    tickets: generateTicketsMap(320, 220, 140),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const seedReviews = [
  {
    _id: '662b00000000000000000041',
    movieId: '662b00000000000000000011',
    userEmail: 'user@imovies.com',
    username: 'primeuser',
    rating: 5,
    reviewText: 'An absolute masterpiece of cinematic grandeur! The Hans Zimmer score combined with Nolan\'s visuals in IMAX is life-changing.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000042',
    movieId: '662b00000000000000000014',
    userEmail: 'user@imovies.com',
    username: 'primeuser',
    rating: 5,
    reviewText: 'Visually stunning and narratively gripping from the very first frame. The sound design shook the entire theatre.',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const seedFavorites = [
  {
    _id: '662b00000000000000000051',
    userEmail: 'user@imovies.com',
    movieId: '662b00000000000000000011',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: '662b00000000000000000052',
    userEmail: 'user@imovies.com',
    movieId: '662b00000000000000000014',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

module.exports = {
  seedAdmin,
  seedUser,
  seedMovies,
  seedTheatres,
  seedShows,
  seedReviews,
  seedFavorites
};

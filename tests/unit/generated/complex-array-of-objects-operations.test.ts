// Auto-generated from docs/examples.md
// Category: Complex Array-of-Objects Operations
// Generated: 2025-12-02T23:50:16.313Z
// DO NOT EDIT MANUALLY - regenerate with: npm run generate:tests

import { describe, test, expect } from 'vitest';
import { executeTestRule, lenientDeepEqual } from '../../helpers/testRuleExecutor';

describe('Complex Array-of-Objects Operations', () => {

  test('Example 79: Add new movie to watchlist', () => {
    // Input YAML
    const input = {
  "title": "My Movie Notes",
  "watchlist": [
    {
      "title": "Inception",
      "director": "Christopher Nolan",
      "year": 2010,
      "rating": 8.8,
      "genres": [
        "sci-fi",
        "thriller"
      ],
      "watched": true
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "APPEND watchlist { \"title\": \"Interstellar\", \"director\": \"Christopher Nolan\", \"year\": 2014, \"rating\": 8.6, \"genres\": [\"sci-fi\", \"drama\"], \"watched\": false }";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "title": "My Movie Notes",
  "watchlist": [
    {
      "title": "Inception",
      "director": "Christopher Nolan",
      "year": 2010,
      "rating": 8.8,
      "genres": [
        "sci-fi",
        "thriller"
      ],
      "watched": true
    },
    {
      "title": "Interstellar",
      "director": "Christopher Nolan",
      "year": 2014,
      "rating": 8.6,
      "genres": [
        "sci-fi",
        "drama"
      ],
      "watched": false
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 80: Check if movie already exists before adding', () => {
    // Input YAML
    const input = {
  "watchlist": [
    {
      "title": "Inception",
      "director": "Christopher Nolan",
      "year": 2010
    }
  ]
};

    // Rule
    const condition = "NOT (ANY watchlist WHERE title = \"Inception\")";
    const action = "APPEND watchlist { \"title\": \"Inception\", \"director\": \"Christopher Nolan\", \"year\": 2010 }";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "Inception",
      "director": "Christopher Nolan",
      "year": 2010
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 81: Mark specific movie as watched', () => {
    // Input YAML
    const input = {
  "watchlist": [
    {
      "title": "Inception",
      "director": "Christopher Nolan",
      "year": 2010,
      "watched": false
    },
    {
      "title": "The Matrix",
      "director": "Wachowski Sisters",
      "year": 1999,
      "watched": false
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "UPDATE_WHERE watchlist WHERE title=\"Inception\" SET watched true, watchedDate \"2025-11-23\", rating 9.0";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "Inception",
      "director": "Christopher Nolan",
      "year": 2010,
      "watched": true,
      "watchedDate": "2025-11-23",
      "rating": 9
    },
    {
      "title": "The Matrix",
      "director": "Wachowski Sisters",
      "year": 1999,
      "watched": false
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 82: Mark all movies by director as watched', () => {
    // Input YAML
    const input = {
  "watchlist": [
    {
      "title": "Inception",
      "director": "Christopher Nolan",
      "watched": false
    },
    {
      "title": "Interstellar",
      "director": "Christopher Nolan",
      "watched": false
    },
    {
      "title": "The Matrix",
      "director": "Wachowski Sisters",
      "watched": false
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "UPDATE_WHERE watchlist WHERE director=\"Christopher Nolan\" SET watched true, bingeDate \"2025-11-23\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "Inception",
      "director": "Christopher Nolan",
      "watched": true,
      "bingeDate": "2025-11-23"
    },
    {
      "title": "Interstellar",
      "director": "Christopher Nolan",
      "watched": true,
      "bingeDate": "2025-11-23"
    },
    {
      "title": "The Matrix",
      "director": "Wachowski Sisters",
      "watched": false
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 83: Check if any movie is highly rated', () => {
    // Input YAML
    const input = {
  "watchlist": [
    {
      "title": "Inception",
      "rating": 8.8
    },
    {
      "title": "The Room",
      "rating": 3.7
    }
  ]
};

    // Rule
    const condition = "ANY watchlist WHERE rating >= 8.5";
    const action = "SET hasHighRatedMovies true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "Inception",
      "rating": 8.8
    },
    {
      "title": "The Room",
      "rating": 3.7
    }
  ],
  "hasHighRatedMovies": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 84: Check if all movies are watched', () => {
    // Input YAML
    const input = {
  "watchlist": [
    {
      "title": "Inception",
      "watched": true
    },
    {
      "title": "Interstellar",
      "watched": false
    }
  ]
};

    // Rule
    const condition = "ALL watchlist WHERE watched = true";
    const action = "SET allWatched true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "Inception",
      "watched": true
    },
    {
      "title": "Interstellar",
      "watched": false
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 85: Complex multi-condition check', () => {
    // Input YAML
    const input = {
  "watchlist": [
    {
      "title": "Inception",
      "director": "Christopher Nolan",
      "year": 2010,
      "rating": 8.8,
      "watched": true
    },
    {
      "title": "Interstellar",
      "director": "Christopher Nolan",
      "year": 2014,
      "rating": 8.6,
      "watched": false
    }
  ]
};

    // Rule
    const condition = "ANY watchlist WHERE director = \"Christopher Nolan\" AND rating >= 8.5 AND watched = true";
    const action = "SET hasWatchedNolanMasterpiece true";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "Inception",
      "director": "Christopher Nolan",
      "year": 2010,
      "rating": 8.8,
      "watched": true
    },
    {
      "title": "Interstellar",
      "director": "Christopher Nolan",
      "year": 2014,
      "rating": 8.6,
      "watched": false
    }
  ],
  "hasWatchedNolanMasterpiece": true
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 86: Sort by rating (highest first)', () => {
    // Input YAML
    const input = {
  "watchlist": [
    {
      "title": "The Room",
      "rating": 3.7
    },
    {
      "title": "Inception",
      "rating": 8.8
    },
    {
      "title": "Interstellar",
      "rating": 8.6
    },
    {
      "title": "The Dark Knight",
      "rating": 9
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "SORT_BY watchlist BY rating DESC";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "The Dark Knight",
      "rating": 9
    },
    {
      "title": "Inception",
      "rating": 8.8
    },
    {
      "title": "Interstellar",
      "rating": 8.6
    },
    {
      "title": "The Room",
      "rating": 3.7
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 87: Sort by year (oldest first)', () => {
    // Input YAML
    const input = {
  "watchlist": [
    {
      "title": "Interstellar",
      "year": 2014
    },
    {
      "title": "The Matrix",
      "year": 1999
    },
    {
      "title": "Inception",
      "year": 2010
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "SORT_BY watchlist BY year ASC";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "The Matrix",
      "year": 1999
    },
    {
      "title": "Inception",
      "year": 2010
    },
    {
      "title": "Interstellar",
      "year": 2014
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 88: Sort by title alphabetically', () => {
    // Input YAML
    const input = {
  "watchlist": [
    {
      "title": "Interstellar",
      "director": "Christopher Nolan"
    },
    {
      "title": "Arrival",
      "director": "Denis Villeneuve"
    },
    {
      "title": "Inception",
      "director": "Christopher Nolan"
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "SORT_BY watchlist BY title ASC";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "Arrival",
      "director": "Denis Villeneuve"
    },
    {
      "title": "Inception",
      "director": "Christopher Nolan"
    },
    {
      "title": "Interstellar",
      "director": "Christopher Nolan"
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 89: Move unwatched movies to top', () => {
    // Input YAML
    const input = {
  "watchlist": [
    {
      "title": "Inception",
      "watched": true
    },
    {
      "title": "Interstellar",
      "watched": false
    },
    {
      "title": "The Matrix",
      "watched": true
    },
    {
      "title": "Arrival",
      "watched": false
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "MOVE_WHERE watchlist WHERE watched = false TO 0";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "Interstellar",
      "watched": false
    },
    {
      "title": "Arrival",
      "watched": false
    },
    {
      "title": "Inception",
      "watched": true
    },
    {
      "title": "The Matrix",
      "watched": true
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 90: Move high-rated movies to top', () => {
    // Input YAML
    const input = {
  "watchlist": [
    {
      "title": "The Room",
      "rating": 3.7
    },
    {
      "title": "Inception",
      "rating": 8.8
    },
    {
      "title": "Some Movie",
      "rating": 6.5
    },
    {
      "title": "The Dark Knight",
      "rating": 9
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "MOVE_WHERE watchlist WHERE rating >= 8.5 TO START";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "Inception",
      "rating": 8.8
    },
    {
      "title": "The Dark Knight",
      "rating": 9
    },
    {
      "title": "The Room",
      "rating": 3.7
    },
    {
      "title": "Some Movie",
      "rating": 6.5
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 91: Move movies AFTER a specific movie', () => {
    // Input YAML
    const input = {
  "watchlist": [
    {
      "title": "Inception",
      "priority": "high"
    },
    {
      "title": "Some Movie",
      "priority": "low"
    },
    {
      "title": "Interstellar",
      "priority": "high"
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "MOVE_WHERE watchlist WHERE priority = \"high\" AFTER title=\"Inception\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "Inception",
      "priority": "high"
    },
    {
      "title": "Interstellar",
      "priority": "high"
    },
    {
      "title": "Some Movie",
      "priority": "low"
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 92: Track reading progress', () => {
    // Input YAML
    const input = {
  "readingList": [
    {
      "title": 1984,
      "author": "George Orwell",
      "pages": 328,
      "currentPage": 0,
      "status": "to-read"
    },
    {
      "title": "Dune",
      "author": "Frank Herbert",
      "pages": 688,
      "currentPage": 150,
      "status": "reading"
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "UPDATE_WHERE readingList WHERE title=\"Dune\" SET currentPage 350, lastRead \"2025-11-23\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "readingList": [
    {
      "title": 1984,
      "author": "George Orwell",
      "pages": 328,
      "currentPage": 0,
      "status": "to-read"
    },
    {
      "title": "Dune",
      "author": "Frank Herbert",
      "pages": 688,
      "currentPage": 350,
      "status": "reading",
      "lastRead": "2025-11-23"
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 93: Mark book as finished and add rating', () => {
    // Input YAML
    const input = {
  "readingList": [
    {
      "title": 1984,
      "author": "George Orwell",
      "pages": 328,
      "currentPage": 300,
      "status": "reading"
    }
  ]
};

    // Rule
    const condition = "(none)";
    const action = "UPDATE_WHERE readingList WHERE title=\"1984\" SET status \"finished\", currentPage 328, finishedDate \"2025-11-23\", rating 5";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "readingList": [
    {
      "title": 1984,
      "author": "George Orwell",
      "pages": 328,
      "currentPage": 328,
      "status": "finished",
      "finishedDate": "2025-11-23",
      "rating": 5
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 94: Find books with high completion percentage', () => {
    // Input YAML
    const input = {};

    // Rule
    const condition = "(none)";
    const action = "SORT_BY readingList BY currentPage DESC";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "readingList": [
    {
      "title": "Dune",
      "pages": 688,
      "currentPage": 400
    },
    {
      "title": 1984,
      "pages": 328,
      "currentPage": 50
    },
    {
      "title": "Foundation",
      "pages": 255,
      "currentPage": 10
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 95: Process watchlist - sort and prioritize', () => {
    // Input YAML
    const input = {};

    // Rule
    const condition = "ANY readingList WHERE status !exists";
    const action = "UPDATE_WHERE readingList WHERE status !exists SET status \"to-read\", addedDate \"2025-11-23\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "readingList": [
    {
      "title": 1984,
      "author": "George Orwell",
      "status": "to-read",
      "addedDate": "2025-11-23"
    },
    {
      "title": "Dune",
      "author": "Frank Herbert",
      "status": "reading"
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 96: Update movies with specific genre', () => {
    // Input YAML
    const input = {};

    // Rule
    const condition = "(none)";
    const action = "UPDATE_WHERE watchlist WHERE year >= 2020 SET tags [\"recent\", \"modern\"]";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "Inception",
      "year": 2010
    },
    {
      "title": "Dune",
      "year": 2021,
      "tags": [
        "recent",
        "modern"
      ]
    },
    {
      "title": "Everything Everywhere All at Once",
      "year": 2022,
      "tags": [
        "recent",
        "modern"
      ]
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });

  test('Example 97: Add movie only if not exists, then sort', () => {
    // Input YAML
    const input = {};

    // Rule
    const condition = "ANY watchlist WHERE watched = true AND watchedDate < \"2025-01-01\"";
    const action = "UPDATE_WHERE watchlist WHERE watched = true AND watchedDate < \"2025-01-01\" SET archived true, archiveDate \"2025-11-23\"";

    // Execute rule
    const result = executeTestRule({ condition, action }, input);

    // Expected output
    const expectedOutput = {
  "watchlist": [
    {
      "title": "Old Movie",
      "watched": true,
      "watchedDate": "2020-01-15",
      "archived": true,
      "archiveDate": "2025-11-23"
    },
    {
      "title": "Recent Movie",
      "watched": true,
      "watchedDate": "2025-11-20"
    },
    {
      "title": "Unwatched",
      "watched": false
    }
  ]
};
    const expectedStatus = "success";

    // Assertions
    expect(result.status).toBe(expectedStatus);
    expect(lenientDeepEqual(result.newData, expectedOutput)).toBe(true);
    
  });
});

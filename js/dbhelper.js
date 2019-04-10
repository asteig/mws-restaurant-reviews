const dbPromise = {
  // creation and updating of database happens here.
  db: idb.open('restaurant-reviews-db', 1, function (upgradeDb) {
    switch (upgradeDb.oldVersion) {
      case 0:
        upgradeDb.createObjectStore('restaurants', { keyPath: 'id' });
        upgradeDb.createObjectStore('reviews', { keyPath: 'id' });
        upgradeDb.createObjectStore('offlineReviews', { autoIncrement: 'true' });
        upgradeDb.createObjectStore('offlineFavorites', { keyPath: 'restaurant_id' });
    }
  }),

  /**
   * Save a restaurant or array of restaurants into idb, using promises.
   */
  putRestaurants(restaurants) {
    if (!restaurants.push) restaurants = [restaurants];
    return this.db.then(db => {
      const store = db.transaction('restaurants', 'readwrite').objectStore('restaurants');
      Promise.all(restaurants.map(networkRestaurant => {
        return store.get(networkRestaurant.id).then(idbRestaurant => {
          if (!idbRestaurant || networkRestaurant.updatedAt > idbRestaurant.updatedAt) {
            return store.put(networkRestaurant);  
          } 
        });
      })).then(function () {
        return store.complete;
      });
    });
  },

  /**
   * Save reviews.
   */
  putReviews(reviews) {
    if (!reviews.push) reviews = [reviews];
    return this.db.then(db => {
      const store = db.transaction('reviews', 'readwrite').objectStore('reviews');
      Promise.all(reviews.map(networkReview => {
        return store.get(networkReview.id).then(idbReview => {
          if (!idbReview || networkReview.updatedAt > idbReview.updatedAt) {
            return store.put(networkReview);  
          } 
        });
      })).then(function () {
        return store.complete;
      }).catch(function(error) {
        console.log('Couldnt add the review :(');
        console.error(error);
      });
    });
  },

  putOfflineReview(review) {

    //try to push the data to the server
    const url = `${DBHelper.DATABASE_URL}/reviews/`;
    const POST = {
      method: 'POST',
      body: JSON.stringify(review)
    };

    return fetch(url, POST).then(response => {
      if (!response.ok) return Promise.reject("We couldn't post review to server.");
      return response.json();
    }).then(newNetworkReview => {
      console.log('Post returned....');
      console.log('review_id', newNetworkReview.id);

      console.log('Add to idb...');
      dbPromise.putReviews(newNetworkReview);

    }).catch(function() {
      console.log('Review couldnt be added via post. Add to offline reviews.');
      
      dbPromise.db.then(db => {
        const store = db.transaction('offlineReviews', 'readwrite').objectStore('offlineReviews');
        store.put(review);
      });

    });

  },

  /**
   * Try to post new favorite to server. Fallback to idb if POST fails.
   */
  putOfflineFavorite(restaurant_id, isFavorite) {

    //try to push the data to the server
    const url = `${DBHelper.DATABASE_URL}/restaurants/${restaurant_id}/?is_favorite=${isFavorite}`;
    const POST = {
      method: 'POST',
      body: ''
    };

    return fetch(url, POST).then(response => {
      if (!response.ok) return Promise.reject("We couldn't post favorite to server");
      return response.json();
    }).catch(function() {
      
      const favorite = {};
      favorite['restaurant_id'] = restaurant_id;
      favorite['isFavorite'] = isFavorite;

      dbPromise.db.then(db => {
        const store = db.transaction('offlineFavorites', 'readwrite').objectStore('offlineFavorites');
        return store.put(favorite);
      });

    });

  },

  /**
   * Get a restaurant, by its id, or all stored restaurants in idb using promises.
   * If no argument is passed, all restaurants will returned.
   */
  getRestaurants(id = undefined) {
    return this.db.then(db => {
      const store = db.transaction('restaurants').objectStore('restaurants');
      if (id) {
        restaurant
        return store.get(Number(id));
      }
      return store.getAll();
    });
  },


  /**
   * Get offline reviews
   */
  getOfflineReviews() {
    return this.db.then(db => {
      const store = db.transaction('offlineReviews').objectStore('offlineReviews');
      return store.getAll();
    });
  },

  /**
   * Get offline favorites
   */
  getOfflineFavorites() {
    return this.db.then(db => {
      const store = db.transaction('offlineFavorites').objectStore('offlineFavorites');
      return store.getAll();
    });
  },

  syncOfflineReview(review) {

    //try to push the data to the server
    const url = `${DBHelper.DATABASE_URL}/reviews/`;
    const POST = {
      method: 'POST',
      body: JSON.stringify(review)
    };

    return fetch(url, POST).then(response => {
      if (!response.ok) return Promise.reject("We couldn't post review to server.");
      console.log('Offline review added to the server. :)');
      return response.json();
    }).catch(function() {
      console.log('Review couldnt be added via post. Already in offlineReviews.');
    });

  },

  syncOfflineFavorite(offlineFavorite) {

    console.log(offlineFavorite);

    const restaurant_id = offlineFavorite.restaurant_id;
    const isFavorite = offlineFavorite.isFavorite;

    //try to push the data to the server
    const url = `${DBHelper.DATABASE_URL}/restaurants/${restaurant_id}/?is_favorite=${isFavorite}`;
    const POST = {
      method: 'POST',
      body: ''
    };

    return fetch(url, POST).then(response => {
      if (!response.ok) return Promise.reject('We couldn\'t post favorite to server.');
      console.log('Offline favorite synced with server.');

      dbPromise.clearOfflineFavorites().then(function() {
        console.log('Cleared offlineFavorites');
      });

      return response.json();
    }).catch(function() {
      console.log('Favorite couldn\'t be synced. Leave is favorites.');
    });

  },

  clearOfflineReviews() {
    return this.db.then(db => {
      const store = db.transaction('offlineReviews', 'readwrite').objectStore('offlineReviews');
      return store.clear();
    });  
  },

  clearOfflineFavorites() {
    return this.db.then(db => {
      const store = db.transaction('offlineFavorites', 'readwrite').objectStore('offlineFavorites');
      return store.clear();
    });  
  },

};



/**
 * Common database helper functions.
 */
class DBHelper {

  /**
   * Database URL.
   * Change this to restaurants.json file location on your server.
   */
  static get DATABASE_URL() {
    const port = 1337 // Change this to your server port
    return `http://localhost:${port}`;
  }

  /**
   * Fetch all restaurants.
   */
  static fetchRestaurants(callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('GET', `${DBHelper.DATABASE_URL}/restaurants`);
    xhr.onload = () => {
      if (xhr.status === 200) { // Got a success response from server!
        const restaurants = JSON.parse(xhr.responseText);
        dbPromise.putRestaurants(restaurants);
        callback(null, restaurants);
      } else { // Oops!. Got an error from server.
        console.log(`Request failed. Returned status of ${xhr.status}, trying idb...`);
        // if xhr request isn't code 200, try idb
        dbPromise.getRestaurants().then(idbRestaurants => {
          // if we get back more than 1 restaurant from idb, return idbRestaurants
          if (idbRestaurants.length > 0) {
            callback(null, idbRestaurants)
          } else { // if we got back 0 restaurants return an error
            callback('No restaurants found in idb', null);
          }
        });
      }
    };
    // XHR needs error handling for when server is down (doesn't respond or sends back codes)
    xhr.onerror = () => {
      console.log('Error while trying XHR, trying idb...');
      // try idb, and if we get restaurants back, return them, otherwise return an error
      dbPromise.getRestaurants().then(idbRestaurants => {
        if (idbRestaurants.length > 0) {
          callback(null, idbRestaurants)
        } else {
          callback('No restaurants found in idb', null);
        }
      });
    }
    xhr.send();
  }

  /**
   * Fetch a restaurant by its id.
   */
  static fetchRestaurantById(id, callback) {
    fetch(`${DBHelper.DATABASE_URL}/restaurants/${id}`).then(response => {
      if (!response.ok) return Promise.reject("Restaurant couldn't be fetched from network");
      return response.json();
    }).then(fetchedRestaurant => {
      // if restaurant could be fetched from network:
      dbPromise.putRestaurants(fetchedRestaurant);
      return callback(null, fetchedRestaurant);
    }).catch(networkError => {
      // if restaurant couldn't be fetched from network:
      console.log(`${networkError}, trying idb.`);
      dbPromise.getRestaurants(id).then(idbRestaurant => {
        if (!idbRestaurant) return callback("Restaurant not found in idb either", null);
        return callback(null, idbRestaurant);
      });
    });
  }

  /**
   * Fetch reviews by restaurant id.
   */
  static fetchReviewsByRestaurantId(id, callback) {
    fetch(`${DBHelper.DATABASE_URL}/reviews/?restaurant_id=${id}`).then(response => {
      if (!response.ok) return Promise.reject("Reviews couldn't be fetched from network");
      return response.json();
    }).then(fetchedReviews => {
      // if restaurant could be fetched from network:
      dbPromise.putReviews(fetchedReviews);
      return callback(null, fetchedReviews);
    }).catch(networkError => {
      dbPromise.getRestaurants(id).then(idbReviews => {
        if (!idbReviews) return callback("Reviews not found in idb either", null);
        return callback(null, idbReviews);
      });
    });
  }

  /**
   * Fetch restaurants by a cuisine type with proper error handling.
   */
  static fetchRestaurantByCuisine(cuisine, callback) {
    // Fetch all restaurants  with proper error handling
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given cuisine type
        const results = restaurants.filter(r => r.cuisine_type == cuisine);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a neighborhood with proper error handling.
   */
  static fetchRestaurantByNeighborhood(neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Filter restaurants to have only given neighborhood
        const results = restaurants.filter(r => r.neighborhood == neighborhood);
        callback(null, results);
      }
    });
  }

  /**
   * Fetch restaurants by a cuisine and a neighborhood with proper error handling.
   */
  static fetchRestaurantByCuisineAndNeighborhood(cuisine, neighborhood, callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        let results = restaurants
        if (cuisine != 'all') { // filter by cuisine
          results = results.filter(r => r.cuisine_type == cuisine);
        }
        if (neighborhood != 'all') { // filter by neighborhood
          results = results.filter(r => r.neighborhood == neighborhood);
        }
        callback(null, results);
      }
    });
  }

  /**
   * Fetch all neighborhoods with proper error handling.
   */
  static fetchNeighborhoods(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all neighborhoods from all restaurants
        const neighborhoods = restaurants.map((v, i) => restaurants[i].neighborhood)
        // Remove duplicates from neighborhoods
        const uniqueNeighborhoods = neighborhoods.filter((v, i) => neighborhoods.indexOf(v) == i)
        callback(null, uniqueNeighborhoods);
      }
    });
  }

  /**
   * Fetch all cuisines with proper error handling.
   */
  static fetchCuisines(callback) {
    // Fetch all restaurants
    DBHelper.fetchRestaurants((error, restaurants) => {
      if (error) {
        callback(error, null);
      } else {
        // Get all cuisines from all restaurants
        const cuisines = restaurants.map((v, i) => restaurants[i].cuisine_type)
        // Remove duplicates from cuisines
        const uniqueCuisines = cuisines.filter((v, i) => cuisines.indexOf(v) == i)
        callback(null, uniqueCuisines);
      }
    });
  }

  /**
   * Restaurant page URL.
   */
  static urlForRestaurant(restaurant) {
    return (`./restaurant.html?id=${restaurant.id}`);
  }

  /**
   * Restaurant image URL.
   */
  static imageUrlForRestaurant(restaurant) {
    return (`/img/${restaurant.photograph}`);
  }

  /**
   * Map marker for a restaurant.
   */
   static mapMarkerForRestaurant(restaurant, map) {
    // https://leafletjs.com/reference-1.3.0.html#marker  
    const marker = new L.marker([restaurant.latlng.lat, restaurant.latlng.lng],
      {title: restaurant.name,
      alt: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant)
      })
      marker.addTo(newMap);
    return marker;
  } 
  /* static mapMarkerForRestaurant(restaurant, map) {
    const marker = new google.maps.Marker({
      position: restaurant.latlng,
      title: restaurant.name,
      url: DBHelper.urlForRestaurant(restaurant),
      map: map,
      animation: google.maps.Animation.DROP}
    );
    return marker;
  } */

}


const express = require('express');
const db = require('../config/database');
const router = express.Router();

// 0/1 Knapsack Algorithm Implementation
/*Items : Remaining places not yet selected

Weights : Place prices (NPR 800, NPR 1200, etc.)

Values : Place ratings × 10 (4.5 → 45 points)

Capacity : Remaining budget (NPR 2,500)

Goal : Maximize total rating points within budget
*/
function knapsack(capacity, weights, values, items) {
  const n = items.length;
  const dp = Array(n + 1).fill(null).map(() => Array(capacity + 1).fill(0));
  
  for (let i = 1; i <= n; i++) {
    for (let w = 1; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          values[i - 1] + dp[i - 1][w - weights[i - 1]],
          dp[i - 1][w]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  
  // Backtrack to find selected items
  const selectedItems = [];
  let w = capacity;
  for (let i = n; i > 0 && dp[i][w] > 0; i--) {
    if (dp[i][w] !== dp[i - 1][w]) {
      selectedItems.push(items[i - 1]);
      w -= weights[i - 1];
    }
  }
  
  return {
    maxValue: dp[n][capacity],
    selectedItems: selectedItems.reverse()
  };
}

// Budget recommendation endpoint
router.post('/budget', async (req, res) => {
  try {
    const { city_id, budget, days, hotelPreference, restaurantPreference } = req.body;

    if (!city_id || !budget || !days) {
      return res.status(400).json({ message: 'City ID, budget, and days are required' });
    }

    const hotelPref = hotelPreference || 'any';
    const restaurantPref = restaurantPreference || 'any';
    
    // Get all places for the city grouped by type
    const [places] = await db.execute(
      'SELECT * FROM places WHERE city_id = ?',
      [city_id]
    );
    
    if (places.length === 0) {
      return res.json({
        recommendations: [],
        totalCost: 0,
        remainingBudget: budget,
        message: 'No places found for this city'
      });
    }
    
    // Group places by type
    const hotels = places.filter(p => p.type === 'HOTEL').sort((a, b) => b.rating - a.rating);
    const restaurants = places.filter(p => p.type === 'RESTAURANT').sort((a, b) => b.rating - a.rating);
    const attractions = places.filter(p => p.type === 'ATTRACTION').sort((a, b) => b.rating - a.rating);

    // Apply user preferences to sort hotels and restaurants
    const applyPreference = (list, preference) => {
      const sorted = [...list];
      if (preference === 'budget') return sorted.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
      if (preference === 'luxury') return sorted.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
      if (preference === 'mid') {
        const prices = sorted.map(p => parseFloat(p.price));
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const mid = (min + max) / 2;
        return sorted.sort((a, b) => Math.abs(parseFloat(a.price) - mid) - Math.abs(parseFloat(b.price) - mid));
      }
      return sorted; // 'any' = best rated (already sorted)
    };

    // Filter list to only include places matching the preference tier
    const filterByPreference = (list, preference) => {
      const prices = list.map(p => parseFloat(p.price));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const range = max - min;
      if (preference === 'budget') return list.filter(p => parseFloat(p.price) <= min + range * 0.33);
      if (preference === 'luxury') return list.filter(p => parseFloat(p.price) >= min + range * 0.67);
      if (preference === 'mid') return list.filter(p => parseFloat(p.price) > min + range * 0.33 && parseFloat(p.price) < min + range * 0.67);
      return list;
    };

    const filteredHotels = filterByPreference(hotels, hotelPref);
    const filteredRestaurants = filterByPreference(restaurants, restaurantPref);

    // Fallback to full list if preference filter returns empty
    const sortedHotels = applyPreference(filteredHotels.length > 0 ? filteredHotels : hotels, hotelPref);
    const sortedRestaurants = applyPreference(filteredRestaurants.length > 0 ? filteredRestaurants : restaurants, restaurantPref);
    
    // Validate minimum budget required
    const cheapestHotel = hotels.length > 0 ? Math.min(...hotels.map(h => parseFloat(h.price))) : 0;
    const cheapestRestaurant = restaurants.length > 0 ? Math.min(...restaurants.map(r => parseFloat(r.price))) : 0;
    const cheapestAttraction = attractions.length > 0 ? Math.min(...attractions.map(a => parseFloat(a.price))) : 0;
    
    // Calculate minimum: hotel per night × days + restaurant per day + attraction per day
    const minimumTotalBudget = (cheapestHotel * days) + (cheapestRestaurant * days) + (cheapestAttraction * days);
    
    if (budget < minimumTotalBudget) {
      return res.status(400).json({
        success: false,
        message: `Budget too low. Minimum required budget is NPR ${minimumTotalBudget.toFixed(2)} for ${days} day(s).`,
        minimumBudget: minimumTotalBudget.toFixed(2)
      });
    }
    
    // Select best hotel where price × days fits within budget
    let selectedHotel = null;

    for (const hotel of sortedHotels) {
      const minOtherCosts = (cheapestRestaurant * days) + (cheapestAttraction * days);
      if ((parseFloat(hotel.price) * days) + minOtherCosts <= budget) {
        selectedHotel = hotel;
        break;
      }
    }

    if (!selectedHotel) {
      return res.status(400).json({
        success: false,
        message: `Budget too low. Minimum required budget is NPR ${minimumTotalBudget.toFixed(2)} for ${days} day(s).`,
        minimumBudget: minimumTotalBudget.toFixed(2)
      });
    }

    const hotelCostPerDay = parseFloat(selectedHotel.price);
    const budgetPerDay = (budget - (hotelCostPerDay * days)) / days;
    const itineraryByDays = [];
    let totalCost = hotelCostPerDay * days;
    
    // Per-day limits: 1 hotel, max 2 restaurants, max 3 attractions
    for (let day = 0; day < days; day++) {
      let dayBudget = budgetPerDay;
      let dayPlaces = [];
      const usedRestaurants = itineraryByDays.flatMap(d => d.places).filter(p => p.type === 'RESTAURANT');
      const usedAttractions = itineraryByDays.flatMap(d => d.places).filter(p => p.type === 'ATTRACTION');

      // 1 hotel per day
      if (selectedHotel) {
        dayPlaces.push({...selectedHotel, day: day + 1});
      }

      // Max 2 restaurants per day (unique across all days, sorted by preference)
      let restaurantsAdded = 0;
      for (const restaurant of sortedRestaurants) {
        if (restaurantsAdded >= 2) break;
        const alreadyUsed = usedRestaurants.find(p => p.id === restaurant.id);
        const price = parseFloat(restaurant.price);
        if (!alreadyUsed && price <= dayBudget && (totalCost + price) <= budget) {
          dayPlaces.push({...restaurant, day: day + 1});
          dayBudget -= price;
          totalCost += price;
          restaurantsAdded++;
        }
      }

      // Max 3 attractions per day (unique across all days, greedy by rating)
      let attractionsAdded = 0;
      for (const attraction of attractions) {
        if (attractionsAdded >= 3) break;
        const alreadyUsed = usedAttractions.find(p => p.id === attraction.id);
        const price = parseFloat(attraction.price);
        if (!alreadyUsed && price <= dayBudget && (totalCost + price) <= budget) {
          dayPlaces.push({...attraction, day: day + 1});
          dayBudget -= price;
          totalCost += price;
          attractionsAdded++;
        }
      }

      itineraryByDays.push({ day: day + 1, places: dayPlaces, remainingBudget: dayBudget });
    }

    // Use knapsack on remaining budget respecting per-day limits
    const totalRemainingBudget = itineraryByDays.reduce((sum, day) => sum + day.remainingBudget, 0);

    if (totalRemainingBudget > 0) {
      const allUsedPlaces = itineraryByDays.flatMap(d => d.places);
      const remainingPlaces = places.filter(p => {
        if (p.type === 'HOTEL') return false;
        const alreadyUsed = allUsedPlaces.find(item => item.id === p.id);
        return !alreadyUsed && parseFloat(p.price) <= totalRemainingBudget;
      });

      if (remainingPlaces.length > 0) {
        const weights = remainingPlaces.map(p => Math.ceil(parseFloat(p.price)));
        const values = remainingPlaces.map(p => Math.ceil(parseFloat(p.rating) * 10));
        const capacity = Math.floor(totalRemainingBudget);
        const result = knapsack(capacity, weights, values, remainingPlaces);

        result.selectedItems.forEach((item, index) => {
          const dayIndex = index % days;
          const dayPlaces = itineraryByDays[dayIndex].places;
          const dayRestaurants = dayPlaces.filter(p => p.type === 'RESTAURANT').length;
          const dayAttractions = dayPlaces.filter(p => p.type === 'ATTRACTION').length;

          // Enforce per-day limits even for knapsack additions
          if (item.type === 'RESTAURANT' && dayRestaurants >= 2) return;
          if (item.type === 'ATTRACTION' && dayAttractions >= 3) return;
          if (totalCost + parseFloat(item.price) > budget) return;

          itineraryByDays[dayIndex].places.push({...item, day: dayIndex + 1});
          totalCost += parseFloat(item.price);
        });
      }
    }
    
    // Remove remainingBudget property from response
    itineraryByDays.forEach(day => delete day.remainingBudget);
    
    const remainingBudget = budget - totalCost;
    
    res.json({
      itinerary: itineraryByDays,
      totalCost: totalCost.toFixed(2),
      remainingBudget: remainingBudget.toFixed(2)
    });
    
  } catch (error) {
    res.status(500).json({ message: 'Failed to generate recommendations', error: error.message });
  }
});

module.exports = router;
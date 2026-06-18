/**
 * CarbonTrack India — Core emission factors and calculator formulas.
 * Calibrated for the Indian context (CEA, IPCC, FSSAI datasets).
 */
const Emissions = {
  // Constants (in kg CO2 per unit)
  FACTORS: {
    GRID: 0.82,          // kg CO2 per kWh (CEA 2024 grid factor)
    LPG: 42.36,          // kg CO2 per cylinder (14.2 kg LPG * 2.983 kg CO2/kg LPG)
    CAR: 0.171,          // kg CO2 per km (typical petrol/diesel sedan)
    BIKE: 0.041,         // kg CO2 per km (typical 2-wheeler scooter/motorcycle)
    BUS: 0.089,          // kg CO2 per passenger-km
    METRO: 0.031,        // kg CO2 per passenger-km
    TRAIN: 0.013,        // kg CO2 per passenger-km
    TRAIN_TRIP_CO2: 3.0, // kg CO2 per typical train trip (approx 230 km)
    FLIGHT: 900.0,       // kg CO2 per domestic/short flight (0.9 tonnes)
    MEAT: 2.7,           // kg CO2 per non-vegetarian meal portion
    DAIRY: 0.9,          // kg CO2 per dairy portion
    CLOTHING: 15.0,      // kg CO2 per clothing item
    ELECTRONICS: 1.0     // kg CO2 per ₹1,000 spent
  },

  /**
   * Calculate annual carbon footprint in tonnes of CO2/year.
   * @param {Object} inputs - Annualized user inputs (kms, flights, energy, meals)
   * @returns {Object} Breakdown of emissions in tonnes CO2/yr and the total
   */
  calcAnnual: function(inputs) {
    const car = parseFloat(inputs.car) || 0;
    const bike = parseFloat(inputs.bike) || 0;
    const fly = parseFloat(inputs.fly) || 0;
    const train = parseFloat(inputs.train) || 0;
    const elec = parseFloat(inputs.elec) || 0;
    const lpg = parseFloat(inputs.lpg) || 0;
    const meat = parseFloat(inputs.meat) || 0;
    const dairy = parseFloat(inputs.dairy) || 0;
    const cloth = parseFloat(inputs.cloth) || 0;
    const elects = parseFloat(inputs.elects) || 0;

    // Transport emissions (in tonnes CO2/year)
    const transportCorrected = ((car * this.FACTORS.CAR + bike * this.FACTORS.BIKE) * 365) / 1000 
                             + (fly * (this.FACTORS.FLIGHT / 1000)) 
                             + (train * 12 * (this.FACTORS.TRAIN_TRIP_CO2 / 1000));

    // Energy emissions (in tonnes CO2/year)
    const energy = ((elec * this.FACTORS.GRID + lpg * this.FACTORS.LPG) * 12) / 1000;

    // Food emissions (in tonnes CO2/year)
    const food = (meat * 52 * (this.FACTORS.MEAT / 1000)) 
               + (dairy * 365 * (this.FACTORS.DAIRY / 1000));

    // Shopping emissions (in tonnes CO2/year)
    const shopping = (cloth * 12 * (this.FACTORS.CLOTHING / 1000)) 
                   + (elects * (this.FACTORS.ELECTRONICS / 1000));

    const total = transportCorrected + energy + food + shopping;

    return {
      transport: parseFloat(transportCorrected.toFixed(2)),
      energy: parseFloat(energy.toFixed(2)),
      food: parseFloat(food.toFixed(2)),
      shopping: parseFloat(shopping.toFixed(2)),
      total: parseFloat(total.toFixed(1))
    };
  },

  /**
   * Calculate daily log carbon footprint in kg of CO2.
   * @param {Object} inputs - Daily logged values
   * @returns {number} Total daily emissions in kg CO2
   */
  calcDaily: function(inputs) {
    const dist = parseFloat(inputs.distance) || 0;
    const mode = inputs.transportMode || 'Walk/cycle';
    
    let transportEf = 0;
    if (mode === 'Car/taxi') transportEf = this.FACTORS.CAR;
    else if (mode === '2-wheeler') transportEf = this.FACTORS.BIKE;
    else if (mode === 'Bus') transportEf = this.FACTORS.BUS;
    else if (mode === 'Metro') transportEf = this.FACTORS.METRO;
    else if (mode === 'Train') transportEf = this.FACTORS.TRAIN;

    let total = dist * transportEf;

    // Food selections (in kg CO2)
    if (Array.isArray(inputs.foodCheckedEfs)) {
      inputs.foodCheckedEfs.forEach(ef => total += parseFloat(ef) || 0);
    }
    
    // Other selections (in kg CO2)
    if (Array.isArray(inputs.otherCheckedEfs)) {
      inputs.otherCheckedEfs.forEach(ef => total += parseFloat(ef) || 0);
    }

    // Energy electricity consumption (in kg CO2)
    const elec = parseFloat(inputs.elec) || 0;
    // Fix: Using correct GRID factor (0.82) instead of the 10x under-counted value 0.082
    total += elec * this.FACTORS.GRID;

    // AC usage penalty (in kg CO2)
    if (inputs.acOn) {
      total += 1.8;
    }

    return parseFloat(total.toFixed(1));
  }
};

// Export for Node.js if available, or bind to window in browser
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Emissions;
} else {
  window.Emissions = Emissions;
}

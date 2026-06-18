const Emissions = require('../public/js/emissions');

describe('Emissions Calculations Unit Tests', () => {
  describe('Emission Constants', () => {
    test('should have correct factors matching Indian grid and transportation', () => {
      expect(Emissions.FACTORS.GRID).toBe(0.82); // Indian grid factor
      expect(Emissions.FACTORS.CAR).toBe(0.171); // Petrol/diesel sedan
      expect(Emissions.FACTORS.BIKE).toBe(0.041); // 2-wheeler
      expect(Emissions.FACTORS.FLIGHT).toBe(900.0); // Domestic/short flight
      expect(Emissions.FACTORS.MEAT).toBe(2.7); // Meat meal
      expect(Emissions.FACTORS.DAIRY).toBe(0.9); // Dairy portion
    });
  });

  describe('calcAnnual', () => {
    test('should calculate correct emissions under zero input', () => {
      const inputs = {
        car: 0, bike: 0, fly: 0, train: 0, elec: 0, lpg: 0, meat: 0, dairy: 0, cloth: 0, elects: 0
      };
      const results = Emissions.calcAnnual(inputs);
      expect(results.transport).toBe(0);
      expect(results.energy).toBe(0);
      expect(results.food).toBe(0);
      expect(results.shopping).toBe(0);
      expect(results.total).toBe(0);
    });

    test('should calculate correct emissions for typical Indian profile', () => {
      const inputs = {
        car: 25,       // km/day
        bike: 10,      // km/day
        fly: 2,        // flights/year
        train: 4,      // trips/month
        elec: 180,     // kWh/month
        lpg: 1,        // cylinder/month
        meat: 5,       // meals/week
        dairy: 2,      // portions/day
        cloth: 3,      // items/month
        elects: 20     // kINR/year
      };
      
      const results = Emissions.calcAnnual(inputs);
      
      // Verification calculations:
      // Transport: ((25 * 0.171 + 10 * 0.041) * 365) / 1000 + 2 * 0.9 + 4 * 12 * 0.003
      //            = ((4.275 + 0.41) * 365)/1000 + 1.8 + 0.144
      //            = (4.685 * 365)/1000 + 1.8 + 0.144
      //            = 1.709975 + 1.8 + 0.144 = 3.653975 => 3.65 tonnes
      // Energy: ((180 * 0.82 + 1 * 42.36) * 12) / 1000
      //         = ((147.6 + 42.36) * 12) / 1000 = (189.96 * 12) / 1000 = 2.27952 => 2.28 tonnes
      // Food: (5 * 52 * 2.7)/1000 + (2 * 365 * 0.9)/1000
      //       = 702/1000 + 657/1000 = 0.702 + 0.657 = 1.359 => 1.36 tonnes
      // Shopping: (3 * 12 * 15)/1000 + 20 * 1.0/1000 = 540/1000 + 20/1000 = 0.54 + 0.02 = 0.56 tonnes
      // Total: 3.65 + 2.28 + 1.36 + 0.56 = 7.85 => rounded to 7.9 tonnes
      
      expect(results.transport).toBeCloseTo(3.65, 1);
      expect(results.energy).toBeCloseTo(2.28, 1);
      expect(results.food).toBeCloseTo(1.36, 1);
      expect(results.shopping).toBeCloseTo(0.56, 1);
      expect(results.total).toBeCloseTo(7.9, 1);
    });
  });

  describe('calcDaily', () => {
    test('should calculate correct daily emissions for single log', () => {
      const inputs = {
        distance: 15,
        transportMode: 'Car/taxi',
        foodCheckedEfs: [0.2, 0.35], // Veg meal + dairy
        otherCheckedEfs: [0.5],       // Online delivery
        elec: 6,                     // 6 kWh
        acOn: true                   // AC penalty 1.8
      };
      
      // Expected:
      // Transport: 15 * 0.171 = 2.565
      // Food/Other check: 0.2 + 0.35 + 0.5 = 1.05
      // Elec: 6 * 0.82 = 4.92
      // AC: 1.8
      // Total: 2.565 + 1.05 + 4.92 + 1.8 = 10.335 => rounded to 10.3
      const dailyCo2 = Emissions.calcDaily(inputs);
      expect(dailyCo2).toBe(10.3);
    });

    test('should support clean walk/cycle log with no extra emissions', () => {
      const inputs = {
        distance: 5,
        transportMode: 'Walk/cycle',
        foodCheckedEfs: [],
        otherCheckedEfs: [],
        elec: 0,
        acOn: false
      };
      const dailyCo2 = Emissions.calcDaily(inputs);
      expect(dailyCo2).toBe(0);
    });
  });
});

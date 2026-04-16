export const options = {
  scenarios: {
    social_network_journey: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "5m", target: 1000 }, // Ramp up to 20k VUs
        { duration: "5m", target: 2000 }, // Peak ramp up to 50k VUs
        { duration: "10m", target: 2000 }, // Hold peak load
        { duration: "5m", target: 0 }, // Ramp down
      ],
      gracefulStop: "30s",
    },
  },
  thresholds: {
    http_req_duration: ["p(95)<1000"], // 95% of requests must be under 1000ms
    http_req_failed: ["rate<0.01"], // Error rate must be less than 1%
  },
};

export const BASE_URL = "http://localhost:3000";

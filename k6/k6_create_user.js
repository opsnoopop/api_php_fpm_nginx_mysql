import http from "k6/http";
import { check, sleep } from "k6";
import { htmlReport } from "https://raw.githubusercontent.com/benc-uk/k6-reporter/main/dist/bundle.js";

// Test configuration
export const options = {
  discardResponseBodies: true, // ไม่เก็บ response body เพื่อประหยัดหน่วยความจำและประมวลผลได้เร็วขึ้น
  scenarios: {
    ramp_rps: {
      // executor: 'constant-arrival-rate', // ใช้ executor แบบ constant-arrival-rate: ยิง request ด้วยความเร็วคงที่
      executor: 'ramping-arrival-rate',
      startRate: 1000,
      timeUnit: '1s', // หน่วยเวลาของ rate: ต่อ 1 วินาที
      preAllocatedVUs: 4000,
      maxVUs: 20000,
      stages: [
        { duration: '10s', target: 3000 }, // warm-up
        { duration: '10s', target: 5000 }, // climb
        { duration: '10s', target: 8000 }, // hold (เริ่มเห็นเพดาน?)
        { duration: '10s', target: 10000 }, // hold สูง
        { duration: '10s', target: 0 },    // ramp-down
      ],
      gracefulStop: '10s',
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500', 'p(99)<1200'],
    checks: ['rate>0.99'],
  },
};

const headers = {
  headers: {
    "Content-Type": "application/json"
  },
};

// Simulated user behavior
export default function () {
  // POST
  let body = {
    "username":"optest",
    "email":"opsnoopop@hotmail.com"
  };
  let res = http.post("http://container_nginx/users", JSON.stringify(body), headers);

  // Validate response status
  check(res, { "status was 201": (r) => r.status == 201 });

  sleep(1);
}

export function handleSummary(data) {
  const now = new Date();
  
  // Convert to UTC+07:00 timezone (add 7 hours to UTC)
  const utcPlus7 = new Date(now.getTime() + (7 * 60 * 60 * 1000));

  const year = utcPlus7.getUTCFullYear();
  const month = (utcPlus7.getUTCMonth() + 1 < 10) ? "0" + (utcPlus7.getUTCMonth() + 1) : utcPlus7.getUTCMonth() + 1; // Month is 0-indexed (0 for January, 11 for December)
  const day = (utcPlus7.getUTCDate() < 10) ? "0" + utcPlus7.getUTCDate() : utcPlus7.getUTCDate();
  const hours = (utcPlus7.getUTCHours() < 10) ? "0" + utcPlus7.getUTCHours() : utcPlus7.getUTCHours();
  const minutes = (utcPlus7.getUTCMinutes() < 10) ? "0" + utcPlus7.getUTCMinutes() : utcPlus7.getUTCMinutes();
  const seconds = (utcPlus7.getUTCSeconds() < 10) ? "0" + utcPlus7.getUTCSeconds() : utcPlus7.getUTCSeconds();

  const filename = "/k6/2_create_user_" + year +  month + day + "_" + hours + minutes + seconds + ".html";
  
  return {
    [filename]: htmlReport(data, {
      title: "create_user_api_php_fpm_nginx_mysql_" + year + month + day + "_" + hours + minutes + seconds
    }),
  };
}
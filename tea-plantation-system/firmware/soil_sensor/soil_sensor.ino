/*
 * Tea Guard — Soil Sensor Firmware
 * Platform: ESP32 (Arduino)
 * Sends N/P/K/pH readings to the backend every 30 minutes via HTTP POST.
 *
 * Hardware assumptions:
 *   - Color sensor (TCS34725 or similar) on I2C for NPK estimation via RGB ratios
 *   - pH sensor analog output on GPIO 34 (3.3V ADC, 0–14 pH range)
 *   - Green LED on GPIO 2, Red LED on GPIO 4
 *
 * To use with real sensors:
 *   1. Install TCS34725 library (Adafruit TCS34725)
 *   2. Replace stub bodies in readNitrogen/readPhosphorus/readPotassium with calibrated values
 *   3. Calibrate pH probe: measure known buffers (pH 4.0 and 7.0) and adjust pH_SLOPE / pH_OFFSET
 *   4. Fill in config.h with your WiFi/backend credentials
 */

#include <WiFi.h>
#include <HTTPClient.h>
#include "config.h"

// ── Pin definitions ───────────────────────────────────────────────────────────
const int GREEN_LED  = 2;
const int RED_LED    = 4;
const int PH_PIN     = 34;   // ADC1_CH6

// ── Timing ────────────────────────────────────────────────────────────────────
const unsigned long READ_INTERVAL_MS = 30UL * 60UL * 1000UL;   // 30 minutes
const unsigned long RETRY_DELAY_MS   =  5UL * 60UL * 1000UL;   // 5 minutes on failure
unsigned long lastRun = -(READ_INTERVAL_MS);  // trigger immediately on first loop

// ── pH calibration ────────────────────────────────────────────────────────────
// CALIBRATE: measure ADC at known pH buffers and adjust these two constants.
// Example: at pH 4.0 → ADC ≈ 3000; at pH 7.0 → ADC ≈ 2000
const float PH_SLOPE  = 14.0f / 4095.0f;  // linear mapping across full ADC range
const float PH_OFFSET = 0.0f;

// ── Sensor stubs ─────────────────────────────────────────────────────────────
/*
 * readNitrogen() — returns soil N in mg/kg
 * Real implementation: read Red channel from TCS34725; apply field-calibrated
 * linear regression (N = slope * R_ratio + intercept) derived from soil samples
 * with lab-verified N values.
 * Stub: returns a plausible mid-range value for integration testing.
 */
float readNitrogen() {
  // REPLACE WITH REAL CALIBRATION:
  // #include <Adafruit_TCS34725.h>
  // uint16_t r, g, b, c; tcs.getRawData(&r, &g, &b, &c);
  // float r_ratio = (float)r / c;
  // return N_SLOPE * r_ratio + N_OFFSET;
  return 28.5f;  // stub: optimal range is 20–40 mg/kg
}

/*
 * readPhosphorus() — returns soil P in mg/kg
 * Real implementation: read Blue channel ratio from TCS34725.
 * Apply calibrated linear model: P = BP_SLOPE * B_ratio + BP_OFFSET.
 */
float readPhosphorus() {
  // REPLACE WITH REAL CALIBRATION:
  // float b_ratio = (float)b / c;
  // return BP_SLOPE * b_ratio + BP_OFFSET;
  return 15.2f;  // stub: optimal range is 10–25 mg/kg
}

/*
 * readPotassium() — returns soil K in mg/kg
 * Real implementation: read Green channel ratio from TCS34725.
 * Apply calibrated linear model: K = KG_SLOPE * G_ratio + KG_OFFSET.
 */
float readPotassium() {
  // REPLACE WITH REAL CALIBRATION:
  // float g_ratio = (float)g / c;
  // return KG_SLOPE * g_ratio + KG_OFFSET;
  return 140.0f;  // stub: optimal range is 80–200 mg/kg
}

/*
 * readPH() — returns soil pH (0–14)
 * Uses raw ADC on PH_PIN. Adjust PH_SLOPE and PH_OFFSET after calibration
 * with known pH buffer solutions (4.01, 7.01, 10.01).
 */
float readPH() {
  int raw = analogRead(PH_PIN);
  return constrain(raw * PH_SLOPE + PH_OFFSET, 0.0f, 14.0f);
}

// ── Utility ───────────────────────────────────────────────────────────────────
void blink(int pin, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(200);
    digitalWrite(pin, LOW);
    delay(200);
  }
}

// ── Setup ─────────────────────────────────────────────────────────────────────
void setup() {
  Serial.begin(115200);
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);

  Serial.print("[WiFi] Connecting to ");
  Serial.println(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
    delay(500);
    Serial.print(".");
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n[WiFi] Connected. IP: " + WiFi.localIP().toString());
    blink(GREEN_LED, 2);
  } else {
    Serial.println("\n[WiFi] Connection failed.");
    blink(RED_LED, 5);
  }
}

// ── Main loop ─────────────────────────────────────────────────────────────────
void loop() {
  if (millis() - lastRun < READ_INTERVAL_MS) return;
  lastRun = millis();

  if (WiFi.status() != WL_CONNECTED) {
    WiFi.reconnect();
    delay(5000);
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("[WiFi] Reconnect failed.");
      blink(RED_LED, 3);
      return;
    }
  }

  float n   = readNitrogen();
  float p   = readPhosphorus();
  float k   = readPotassium();
  float ph  = readPH();

  Serial.printf("[Sensor] N=%.1f P=%.1f K=%.1f pH=%.2f\n", n, p, k, ph);

  // Build JSON payload
  String payload = "{";
  payload += "\"device_id\":\"" + String(DEVICE_ID) + "\",";
  payload += "\"nitrogen\":"    + String(n, 2) + ",";
  payload += "\"phosphorus\":"  + String(p, 2) + ",";
  payload += "\"potassium\":"   + String(k, 2) + ",";
  payload += "\"ph_level\":"    + String(ph, 2) + ",";
  payload += "\"latitude\":"    + String(GPS_LAT, 6) + ",";
  payload += "\"longitude\":"   + String(GPS_LON, 6);
  payload += "}";

  HTTPClient http;
  String url = String(BACKEND_URL) + "/api/v1/sensor/upload";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(DEVICE_JWT));

  Serial.println("[HTTP] POST " + url);
  int code = http.POST(payload);
  Serial.println("[HTTP] Response code: " + String(code));

  if (code > 0 && code < 300) {
    blink(GREEN_LED, 1);
    Serial.println("[HTTP] Upload successful.");
  } else {
    blink(RED_LED, 3);
    Serial.println("[HTTP] Upload failed. Retrying in 5 minutes.");
    delay(RETRY_DELAY_MS);
  }

  http.end();
}

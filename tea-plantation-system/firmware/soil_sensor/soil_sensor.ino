#include <WiFi.h>
#include <HTTPClient.h>
#include "config.h"

const int GREEN_LED = 2;
const int RED_LED = 4;
unsigned long lastRun = 0;

float readNitrogen() { return 25.0; }  // TODO: replace with calibrated RGB -> N conversion
float readPhosphorus() { return 12.0; } // TODO: replace with calibrated RGB -> P conversion
float readPotassium() { return 120.0; } // TODO: replace with calibrated RGB -> K conversion
float readPH() { return analogRead(34) * (14.0 / 4095.0); }

void blink(int pin, int times) {
  for (int i = 0; i < times; i++) {
    digitalWrite(pin, HIGH);
    delay(200);
    digitalWrite(pin, LOW);
    delay(200);
  }
}

void setup() {
  pinMode(GREEN_LED, OUTPUT);
  pinMode(RED_LED, OUTPUT);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) delay(500);
}

void loop() {
  if (millis() - lastRun < 30UL * 60UL * 1000UL) return;
  lastRun = millis();

  HTTPClient http;
  String url = String(BACKEND_URL) + "/api/v1/sensor/upload";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("Authorization", "Bearer " + String(DEVICE_JWT));

  String payload = "{\"device_id\":\"" + String(DEVICE_ID) + "\",\"nitrogen\":" + String(readNitrogen()) +
                   ",\"phosphorus\":" + String(readPhosphorus()) + ",\"potassium\":" + String(readPotassium()) +
                   ",\"ph_level\":" + String(readPH()) + ",\"latitude\":" + String(GPS_LAT) +
                   ",\"longitude\":" + String(GPS_LON) + "}";

  int code = http.POST(payload);
  if (code > 0 && code < 300) {
    blink(GREEN_LED, 1);
  } else {
    blink(RED_LED, 3);
    delay(5UL * 60UL * 1000UL);
  }
  http.end();
}

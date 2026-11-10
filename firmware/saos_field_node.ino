/*
 * SAOS field node (ESP32) - publishes sensor data to the SAOS MQTT topics
 *   farm/{farmId}/device/{deviceId}/sensor/{sensorType}   {"value":..,"unit":..}
 * and executes pump / humidifier commands received on
 *   farm/{farmId}/device/{deviceId}/actuator/{actuatorType}/command
 * Libraries: PubSubClient, ArduinoJson, DHT sensor library
 */
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

const char* WIFI_SSID = "YOUR_WIFI_SSID";
const char* WIFI_PASS = "YOUR_WIFI_PASSWORD";
const char* MQTT_HOST = "192.168.1.10";            // SAOS server / broker
const char* FARM_ID   = "FARM_UUID";               // ids from the SAOS database
const char* SENSOR_ID = "SENSOR_DEVICE_UUID";
const char* ACT_ID    = "ACTUATOR_DEVICE_UUID";

#define SOIL_PIN 34       // capacitive soil moisture
#define PH_PIN   35       // analog pH probe board
#define TDS_PIN  32       // TDS probe board
#define DHT_PIN  4        // DHT22 temperature / humidity
#define RAIN_PIN 27       // tipping-bucket rain gauge (0.2794 mm per tip)
#define FLOW_PIN 26       // YF-S201 flow sensor (7.5 Hz per L/min)
#define TRIG_PIN 5        // JSN-SR04T water-tank level
#define ECHO_PIN 18
const int RELAY[4] = {23, 22, 21, 19};             // active-LOW relays
const char* ACT[4] = {"pump1", "pump2", "pump3", "humidifier"};
const float TANK_DEPTH_M = 2.0;
const float LOCAL_DRY = 25.0, LOCAL_WET = 40.0;     // fail-safe band (%)

WiFiClient net;
PubSubClient mqtt(net);
DHT dht(DHT_PIN, DHT22);
volatile unsigned long rainTips = 0, flowPulses = 0;
void IRAM_ATTR onRain() { rainTips++; }
void IRAM_ATTR onFlow() { flowPulses++; }
unsigned long lastPub = 0, lastCmd = 0;
bool failSafe = false;

void publish(const char* type, float value, const char* unit) {
  char topic[128], body[64];
  snprintf(topic, sizeof topic, "farm/%s/device/%s/sensor/%s",
           FARM_ID, SENSOR_ID, type);
  snprintf(body, sizeof body, "{\"value\":%.2f,\"unit\":\"%s\"}", value, unit);
  mqtt.publish(topic, body);
}

void setActuator(int k, bool on) {                // drive relay + report state
  digitalWrite(RELAY[k], on ? LOW : HIGH);
  char topic[128];
  snprintf(topic, sizeof topic, "farm/%s/device/%s/actuator/%s",
           FARM_ID, ACT_ID, ACT[k]);
  mqtt.publish(topic, on ? "{\"isActive\":true}" : "{\"isActive\":false}");
}

void onMessage(char* topic, byte* payload, unsigned int len) {
  JsonDocument doc;
  if (deserializeJson(doc, payload, len)) return;
  for (int k = 0; k < 4; k++)
    if (strstr(topic, ACT[k])) {
      setActuator(k, doc["isActive"].as<bool>());
      lastCmd = millis();
      Serial.printf("Command: %s -> %s\n", ACT[k],
                    doc["isActive"].as<bool>() ? "ON" : "OFF");
    }
}

void reconnect() {
  while (!mqtt.connected()) {
    if (mqtt.connect(SENSOR_ID)) {
      char sub[128];
      snprintf(sub, sizeof sub, "farm/%s/device/%s/actuator/+/command",
               FARM_ID, ACT_ID);
      mqtt.subscribe(sub);
      Serial.println("MQTT connected");
    } else delay(2000);
  }
}

float tankDepth() {                                // water depth in metres
  digitalWrite(TRIG_PIN, LOW);  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH); delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  float d = pulseIn(ECHO_PIN, HIGH, 30000) * 0.000343 / 2;   // m to water
  return constrain(TANK_DEPTH_M - d, 0, TANK_DEPTH_M);
}

void setup() {
  Serial.begin(115200);
  for (int k = 0; k < 4; k++) {
    pinMode(RELAY[k], OUTPUT);
    digitalWrite(RELAY[k], HIGH);                   // all relays OFF
  }
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(RAIN_PIN, INPUT_PULLUP);
  pinMode(FLOW_PIN, INPUT_PULLUP);
  attachInterrupt(digitalPinToInterrupt(RAIN_PIN), onRain, FALLING);
  attachInterrupt(digitalPinToInterrupt(FLOW_PIN), onFlow, RISING);
  dht.begin();
  WiFi.begin(WIFI_SSID, WIFI_PASS);
  while (WiFi.status() != WL_CONNECTED) delay(500);
  mqtt.setServer(MQTT_HOST, 1883);
  mqtt.setCallback(onMessage);
}

void loop() {
  if (!mqtt.connected()) reconnect();
  mqtt.loop();
  if (millis() - lastPub < 30000) return;           // publish every 30 s
  float secs = (millis() - lastPub) / 1000.0;
  lastPub = millis();

  float moist = constrain(map(analogRead(SOIL_PIN), 3200, 1350, 0, 100), 0, 100);
  float v = analogReadMilliVolts(PH_PIN) / 1000.0;
  float ph = 7.0 + (2.50 - v) / 0.18;               // calibrated with pH 4/7
  float tv = analogReadMilliVolts(TDS_PIN) / 1000.0;
  float tds = (133.42 * tv * tv * tv - 255.86 * tv * tv + 857.39 * tv) * 0.5;
  float flow = (flowPulses / secs) / 7.5;          // L/min
  flowPulses = 0;
  float rain = rainTips * 0.2794;                   // mm since last report
  rainTips = 0;

  publish("soil_moisture", moist, "%");
  publish("ph", ph, "pH");
  publish("tds", tds, "ppm");
  publish("temperature", dht.readTemperature(), "C");
  publish("humidity", dht.readHumidity(), "%");
  publish("rainfall", rain, "mm");
  publish("water_flow", flow, "L/min");
  publish("water_depth", tankDepth(), "m");
  Serial.printf("Moisture %.0f %% | pH %.1f | TDS %.0f | flow %.1f L/min\n",
                moist, ph, tds, flow);

  // fail-safe: irrigate locally if the server is silent for 10 min
  bool silent = millis() - lastCmd > 600000;
  if (silent && !failSafe && moist < LOCAL_DRY) {
    failSafe = true;
    setActuator(0, true);
  } else if (failSafe && (moist > LOCAL_WET || !silent)) {
    failSafe = false;
    setActuator(0, false);
  }
}

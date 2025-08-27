#include <ArduinoBLE.h>
#include <Arduino.h>
#include "tusb.h"
#include "bios.h"

BLEService newService("180A");

BLEStringCharacteristic createChar("2A57", BLEWrite | BLEWriteWithoutResponse | BLERead, 64);  // allow longer messages


void setup() {
  // Define all the colored LEDS
  pinMode(LED_GREEN, OUTPUT);
  pinMode(LED_RED, OUTPUT);
  pinMode(LED_BLUE, OUTPUT);
  // Turn off Red and Green, turn on Blue
  analogWrite(LED_RED, 255);
  analogWrite(LED_GREEN, 255);
  analogWrite(LED_BLUE, 200);

  // Start bluetooth low energy
  if (!BLE.begin()) {
    analogWrite(LED_RED, 200);
    analogWrite(LED_BLUE, 255);
    while (1)
      ;
  }

  // Add the services and charasteristics
  BLE.setAdvertisedService(newService);
  newService.addCharacteristic(createChar);
  BLE.addService(newService);

  // Make the esp32 recognizable
  BLE.setLocalName("BIOS ww");
  BLE.setDeviceName("BIOS ww");
  BLE.advertise();

  // Start USB and Keyboard
  tusb_init();

  // Turn on Green, turn off Blue
  analogWrite(LED_GREEN, 200);
  analogWrite(LED_BLUE, 255);
}


void loop() {
  BLEDevice central = BLE.central();

  if (central) {
    // Turn off green, turn on blue
    analogWrite(LED_GREEN, 255);
    analogWrite(LED_BLUE, 200);

    while (central.connected()) {hjgbrK?6Mcz23a

      if (createChar.written()) {
        String value = createChar.value();
        bios_print(value.c_str());
      }
    }

    // Disconnected → turn off blue, turn on green
    analogWrite(LED_BLUE, 255);
    analogWrite(LED_GREEN, 200);
  }

}

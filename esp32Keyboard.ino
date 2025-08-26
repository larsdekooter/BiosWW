#include <ArduinoBLE.h>
#include "USB.h"
#include "USBHIDKeyboard.h"
USBHIDKeyboard Keyboard;

BLEService newService("180A");

BLEStringCharacteristic createChar("2A57", BLEWriteWithoutResponse, 16);

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
  // Start USB and Keyboard (doesn't work in bios)
  USB.begin();
  Keyboard.begin();

  // Add the services and charasteristics
  BLE.setAdvertisedService(newService);
  newService.addCharacteristic(createChar);
  BLE.addService(newService);

  // Make the esp32 recognizable
  BLE.setLocalName("BIOS ww");
  BLE.setDeviceName("BIOS ww");
  BLE.advertise();

  // Turn on Green, turn off Blue
  analogWrite(LED_GREEN, 200);
  analogWrite(LED_BLUE, 255);
}


void loop() {
  BLEDevice central = BLE.central();
  // Check if a connection has been made
  if (central) {
    // Turn of green, turn on Blue
    analogWrite(LED_GREEN, 255);
    analogWrite(LED_BLUE, 200);
    while (central.connected()) {
      // Read the value that is supplied, and type it out (doesn't work in bios)
      String value = createChar.value();

      if (createChar.written()) {
        Keyboard.print(value);
        Keyboard.end();
      }
    }
    // When disconnected, turn of the blue LED and turn on the Green LED
    analogWrite(LED_BLUE, 255);
    analogWrite(LED_GREEN, 200);
  }
}
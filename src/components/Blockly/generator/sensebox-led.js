import * as Blockly from 'blockly/core';

Blockly.Arduino.sensebox_led = function () {
    var dropdown_pin = this.getFieldValue('PIN');
    var dropdown_stat = this.getFieldValue('STAT');
    Blockly.Arduino.setups_['setup_green_led_' + dropdown_pin] = 'pinMode(' + dropdown_pin + ', OUTPUT);';
    var code = 'digitalWrite(' + dropdown_pin + ',' + dropdown_stat + ');\n'
    return code;
};

Blockly.Arduino.sensebox_rgb_led = function () {
    var dropdown_pin = this.getFieldValue('PIN');
    var red = this.getFieldValue('RED') || '0'
    var green = this.getFieldValue('GREEN') || '0'
    var blue = this.getFieldValue('BLUE') || '0'
    Blockly.Arduino.libraries_['define_rgb_led' + dropdown_pin] = '#include <Adafruit_NeoPixel.h>\n Adafruit_NeoPixel rgb_led_' + dropdown_pin + ' = Adafruit_NeoPixel(1,' + dropdown_pin + ',NEO_RGB + NEO_KHZ800);\n';
    Blockly.Arduino.setupCode_['setup_rgb_led' + dropdown_pin] = 'rgb_led_' + dropdown_pin + '.begin();';

    var code = 'rgb_led_' + dropdown_pin + '.setPixelColor(0,rgb_led_' + dropdown_pin + '.Color(' + red + ',' + green + ',' + blue + '));\n';
    code += 'rgb_led_' + dropdown_pin + '.show();';
    return code;
};
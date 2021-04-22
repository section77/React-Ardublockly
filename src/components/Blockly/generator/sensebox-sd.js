import Blockly from "blockly";

/* SD-Card Blocks using the Standard SD Library*/
/**
 * Code generator for variable (X) getter.
 * Arduino code: loop { X }
 * @param {Blockly.Block} block Block to generate the code from.
 * @return {array} Completed code with order of operation.
 */

Blockly.Arduino.sensebox_sd_create_file = function (block) {
  var filename = this.getFieldValue("Filename");
  var extension = this.getFieldValue("extension");
  var newFileName = filename.concat(".", extension);
  Blockly.Arduino.libraries_["library_spi"] = "#include <SPI.h>";
  Blockly.Arduino.libraries_["library_sd"] = "#include <SD.h>";
  Blockly.Arduino.definitions_["define_" + filename] = `File ${filename};`;
  Blockly.Arduino.setupCode_["sensebox_sd"] = "SD.begin(28);\n";
  Blockly.Arduino.setupCode_[
    "sensebox_sd" + filename
  ] = `${filename} = SD.open("${newFileName}", FILE_WRITE);\n${filename}.close();\n`;
  var code = "";
  return code;
};

Blockly.Arduino.sensebox_sd_open_file = function (block) {
  var filename = this.getFieldValue("Filename");
  var extension = this.getFieldValue("extension");
  var newFileName = filename.concat(".", extension);
  var branch = Blockly.Arduino.statementToCode(block, "SD");
  var code = `${filename} = SD.open("${newFileName}", FILE_WRITE);\n`;
  code += branch;
  code += `${filename}.close();\n`;
  return code;
};

Blockly.Arduino.sensebox_sd_write_file = function (block) {
  if (this.parentBlock_ != null) {
    var filename = this.getSurroundParent().getFieldValue("Filename");
  }
  var branch =
    Blockly.Arduino.valueToCode(this, "DATA", Blockly.Arduino.ORDER_ATOMIC) ||
    '"Keine Eingabe"';
  var linebreak = this.getFieldValue("linebreak");
  if (linebreak === "TRUE") {
    linebreak = "ln";
  } else {
    linebreak = "";
  }
  var code = "";
  if (branch === "gps.getLongitude()" || branch === "gps.getLatitude()") {
    code = `${filename}.print${linebreak}(${branch},5);\n`;
  } else {
    code = `${filename}.print${linebreak}(${branch});\n`;
  }
  return code;
};

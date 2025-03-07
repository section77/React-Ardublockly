/**
 * @license
 *
 * Copyright 2019 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview Define generation methods for custom blocks.
 * @author samelh@google.com (Sam El-Husseini)
 */

// More on generating code:
// https://developers.google.com/blockly/guides/create-custom-blocks/generating-code

import * as Blockly from "blockly/core";

import store from "../../../store";

var ota = store.getState().general.platform
  ? store.getState().general.platform
  : null;
store.subscribe(() => {
  ota = store.getState().general.platform
    ? store.getState().general.platform
    : null;
});

/**
 * Arduino code generator.
 * @type !Blockly.Generator
 */
Blockly["Arduino"] = new Blockly.Generator("Arduino");

/**
 * List of illegal variable names.
 * This is not intended to be a security feature.  Blockly is 100% client-side,
 * so bypassing this list is trivial.  This is intended to prevent users from
 * accidentally clobbering a built-in object or function.
 * @private
 */
Blockly["Arduino"].addReservedWords(
  // http://arduino.cc/en/Reference/HomePage
  "setup,loop,if,else,for,switch,case,while," +
    "do,break,continue,return,goto,define,include," +
    "HIGH,LOW,INPUT,OUTPUT,INPUT_PULLUP,true,false," +
    "interger, constants,floating,point,void,boolean,char," +
    "unsigned,byte,int,word,long,float,double,string,String,array," +
    "static, volatile,const,sizeof,pinMode,digitalWrite,digitalRead," +
    "analogReference,analogRead,analogWrite,tone,noTone,shiftOut,shitIn," +
    "pulseIn,millis,micros,delay,delayMicroseconds,min,max,abs,constrain," +
    "map,pow,sqrt,sin,cos,tan,randomSeed,random,lowByte,highByte,bitRead," +
    "bitWrite,bitSet,bitClear,ultraSonicDistance,parseDouble,setNeoPixelColor," +
    "bit,attachInterrupt,detachInterrupt,interrupts,noInterrupts",
  "short",
  "isBtnPressed"
);

/**
 * Order of operation ENUMs.
 *
 */
Blockly["Arduino"].ORDER_ATOMIC = 0; // 0 "" ...
Blockly["Arduino"].ORDER_UNARY_POSTFIX = 1; // expr++ expr-- () [] .
Blockly["Arduino"].ORDER_UNARY_PREFIX = 2; // -expr !expr ~expr ++expr --expr
Blockly["Arduino"].ORDER_MULTIPLICATIVE = 3; // * / % ~/
Blockly["Arduino"].ORDER_ADDITIVE = 4; // + -
Blockly["Arduino"].ORDER_LOGICAL_NOT = 4.4; // !
Blockly["Arduino"].ORDER_SHIFT = 5; // << >>
Blockly["Arduino"].ORDER_MODULUS = 5.3; // %
Blockly["Arduino"].ORDER_RELATIONAL = 6; // is is! >= > <= <
Blockly["Arduino"].ORDER_EQUALITY = 7; // === !== === !==
Blockly["Arduino"].ORDER_BITWISE_AND = 8; // &
Blockly["Arduino"].ORDER_BITWISE_XOR = 9; // ^
Blockly["Arduino"].ORDER_BITWISE_OR = 10; // |
Blockly["Arduino"].ORDER_LOGICAL_AND = 11; // &&
Blockly["Arduino"].ORDER_LOGICAL_OR = 12; // ||
Blockly["Arduino"].ORDER_CONDITIONAL = 13; // expr ? expr : expr
Blockly["Arduino"].ORDER_ASSIGNMENT = 14; // = *= /= ~/= %= += -= <<= >>= &= ^= |=
Blockly["Arduino"].ORDER_COMMA = 18; // ,
Blockly["Arduino"].ORDER_NONE = 99; // (...)

/**
 *
 * @param {} workspace
 *
 * Blockly Types
 */

/**
 * Initialise the database of variable names.
 * @param {!Blockly.Workspace} workspace Workspace to generate code from.
 */
Blockly["Arduino"].init = function (workspace) {
  // Create a dictionary of definitions to be printed before the code.
  Blockly["Arduino"].libraries_ = Object.create(null);

  Blockly["Arduino"].definitions_ = Object.create(null);

  // creates a list of code to be setup before the setup block
  Blockly["Arduino"].setupCode_ = Object.create(null);

  // creates a list of code to be setup before the setup block
  Blockly["Arduino"].phyphoxSetupCode_ = Object.create(null);

  // creates a list of code to be setup before the setup block
  Blockly["Arduino"].loraSetupCode_ = Object.create(null);

  // creates a list of code for the loop to be runned once
  Blockly["Arduino"].loopCodeOnce_ = Object.create(null);

  // creates a list of code for the loop to be runned once
  Blockly["Arduino"].codeFunctions_ = Object.create(null);

  // creates a list of code variables
  Blockly["Arduino"].variables_ = Object.create(null);

  // Create a dictionary mapping desired function names in definitions_
  // to actual function names (to avoid collisions with user functions).
  Blockly["Arduino"].functionNames_ = Object.create(null);

  Blockly["Arduino"].variablesInitCode_ = "";

  if (!Blockly["Arduino"].nameDB_) {
    Blockly["Arduino"].nameDB_ = new Blockly.Names(
      Blockly["Arduino"].RESERVED_WORDS_
    );
  } else {
    Blockly["Arduino"].nameDB_.reset();
  }

  Blockly["Arduino"].nameDB_.setVariableMap(workspace.getVariableMap());

  // We don't have developer variables for now
  // // Add developer variables (not created or named by the user).
  // var devVarList = Blockly.Variables.allDeveloperVariables(workspace);
  // for (var i = 0; i < devVarList.length; i++) {
  //     defvars.push(Blockly['Arduino'].nameDB_.getName(devVarList[i],
  //         Blockly.Names.DEVELOPER_VARIABLE_TYPE));
  // }

  const doubleVariables = workspace.getVariablesOfType("Number");
  let i = 0;
  let variableCode = "";
  for (i = 0; i < doubleVariables.length; i += 1) {
    variableCode +=
      "double " +
      Blockly["Arduino"].nameDB_.getName(
        doubleVariables[i].getId(),
        Blockly.Variables.NAME_TYPE
      ) +
      " = 0; \n\n";
  }

  const stringVariables = workspace.getVariablesOfType("String");
  for (i = 0; i < stringVariables.length; i += 1) {
    variableCode +=
      "String " +
      Blockly["Arduino"].nameDB_.getName(
        stringVariables[i].getId(),
        Blockly.Variables.NAME_TYPE
      ) +
      ' = ""; \n\n';
  }

  const booleanVariables = workspace.getVariablesOfType("Boolean");
  for (i = 0; i < booleanVariables.length; i += 1) {
    variableCode +=
      "boolean " +
      Blockly["Arduino"].nameDB_.getDistinctName(
        booleanVariables[i].getId(),
        Blockly.Variables.NAME_TYPE
      ) +
      " = false; \n\n";
  }

  const colourVariables = workspace.getVariablesOfType("Colour");
  for (i = 0; i < colourVariables.length; i += 1) {
    variableCode +=
      "RGB " +
      Blockly["Arduino"].nameDB_.getName(
        colourVariables[i].getId(),
        Blockly.Variables.NAME_TYPE
      ) +
      " = {0, 0, 0}; \n\n";
  }

  Blockly["Arduino"].variablesInitCode_ = variableCode;
};

/**
 * Prepend the generated code with the variable definitions.
 * @param {string} code Generated code.
 * @return {string} Completed code.
 */
Blockly["Arduino"].finish = function (code) {
  let libraryCode = "";
  let variablesCode = "";
  let codeFunctions = "";
  let functionsCode = "";
  let definitionsCode = "";
  let phyphoxSetupCode = "";
  let loopCodeOnce = "";
  let setupCode = "";
  let preSetupCode = "";
  let loraSetupCode = "";
  let devVariables = "\n";

  for (const key in Blockly["Arduino"].libraries_) {
    libraryCode += Blockly["Arduino"].libraries_[key] + "\n";
  }

  for (const key in Blockly["Arduino"].variables_) {
    variablesCode += Blockly["Arduino"].variables_[key] + "\n";
  }

  for (const key in Blockly["Arduino"].definitions_) {
    definitionsCode += Blockly["Arduino"].definitions_[key] + "\n";
  }

  for (const key in Blockly["Arduino"].loopCodeOnce_) {
    loopCodeOnce += Blockly["Arduino"].loopCodeOnce_[key] + "\n";
  }

  for (const key in Blockly["Arduino"].codeFunctions_) {
    codeFunctions += Blockly["Arduino"].codeFunctions_[key] + "\n";
  }

  for (const key in Blockly["Arduino"].functionNames_) {
    functionsCode += Blockly["Arduino"].functionNames_[key] + "\n";
  }

  for (const key in Blockly["Arduino"].setupCode_) {
    preSetupCode += Blockly["Arduino"].setupCode_[key] + "\n" || "";
  }

  for (const key in Blockly["Arduino"].loraSetupCode_) {
    loraSetupCode += Blockly["Arduino"].loraSetupCode_[key] + "\n" || "";
  }

  setupCode =
    "\nvoid setup() { \n" + preSetupCode + "\n" + loraSetupCode + "\n}\n";
  for (const key in Blockly["Arduino"].phyphoxSetupCode_) {
    phyphoxSetupCode += Blockly["Arduino"].phyphoxSetupCode_[key] + "\n" || "";
  }

  setupCode =
    "\nvoid setup() { \n" +
    preSetupCode +
    "\n" +
    phyphoxSetupCode +
    "\n" +
    loraSetupCode +
    "\n}\n";

  let loopCode = "\nvoid loop() { \n" + loopCodeOnce + code + "\n}\n";
  // only add OTA code if tablet mode is enabled
  if (ota === true) {
    code =
      devVariables +
      "\n" +
      "#include <SenseBoxOTA.h>" +
      "\n" +
      libraryCode +
      "\n" +
      variablesCode +
      "\n" +
      definitionsCode +
      "\n" +
      codeFunctions +
      "\n" +
      Blockly["Arduino"].variablesInitCode_ +
      "\n" +
      functionsCode +
      "\n" +
      setupCode +
      "\n" +
      loopCode;
  } else {
    // Convert the definitions dictionary into a list.
    code =
      devVariables +
      "\n" +
      libraryCode +
      "\n" +
      variablesCode +
      "\n" +
      definitionsCode +
      "\n" +
      codeFunctions +
      "\n" +
      Blockly["Arduino"].variablesInitCode_ +
      "\n" +
      functionsCode +
      "\n" +
      setupCode +
      "\n" +
      loopCode;
  }

  // Clean up temporary data.
  delete Blockly["Arduino"].definitions_;
  delete Blockly["Arduino"].functionNames_;
  delete Blockly["Arduino"].loopCodeOnce_;
  delete Blockly["Arduino"].variablesInitCode_;
  delete Blockly["Arduino"].libraries_;
  Blockly["Arduino"].nameDB_.reset();

  return code;
};

/**
 * Naked values are top-level blocks with outputs that aren't plugged into
 * anything.  A trailing semicolon is needed to make this legal.
 * @param {string} line Line of generated code.
 * @return {string} Legal line of code.
 */
Blockly["Arduino"].scrubNakedValue = function (line) {
  return line + ";\n";
};

/**
 * Encode a string as a properly escaped Arduino string, complete with
 * quotes.
 * @param {string} string Text to encode.
 * @return {string} Arduino string.
 * @private
 */
Blockly["Arduino"].quote_ = function (string) {
  // Can't use goog.string.quote since Google's style guide recommends
  // JS string literals use single quotes.
  string = string
    .replace(/\\/g, "\\\\")
    .replace(/\n/g, "\\\n")
    .replace(/'/g, "\\'");
  return '"' + string + '"';
};

/**
 * Common tasks for generating Arduino from blocks.
 * Handles comments for the specified block and any connected value blocks.
 * Calls any statements following this block.
 * @param {!Blockly.Block} block The current block.
 * @param {string} code The Arduino code created for this block.
 * @param {boolean=} opt_thisOnly True to generate code for only this statement.
 * @return {string} Arduino code with comments and subsequent blocks added.
 * @private
 */
Blockly["Arduino"].scrub_ = function (block, code) {
  let commentCode = "";
  // Only collect comments for blocks that aren't inline.
  if (!block.outputConnection || !block.outputConnection.targetConnection) {
    // Collect comment for this block.
    let comment = block.getCommentText();
    //@ts-ignore
    comment = comment
      ? Blockly.utils.string.wrap(comment, Blockly["Arduino"].COMMENT_WRAP - 3)
      : null;
    if (comment) {
      if (block.getProcedureDef) {
        // Use a comment block for function comments.
        commentCode +=
          "/**\n" +
          Blockly["Arduino"].prefixLines(comment + "\n", " * ") +
          " */\n";
      } else {
        commentCode += Blockly["Arduino"].prefixLines(comment + "\n", "// ");
      }
    }
    // Collect comments for all value arguments.
    // Don't collect comments for nested statements.
    for (let i = 0; i < block.inputList.length; i++) {
      if (block.inputList[i].type === Blockly.INPUT_VALUE) {
        const childBlock = block.inputList[i].connection.targetBlock();
        if (childBlock) {
          const comment = Blockly["Arduino"].allNestedComments(childBlock);
          if (comment) {
            commentCode += Blockly["Arduino"].prefixLines(comment, "// ");
          }
        }
      }
    }
  }
  const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
  const nextCode = Blockly["Arduino"].blockToCode(nextBlock);
  return commentCode + code + nextCode;
};

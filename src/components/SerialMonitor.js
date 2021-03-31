import React from "react";
import { useState } from "react";

import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";

const SerialMonitor = () => {
  const [serialPortContent, setSerialPortContent] = useState([]);
  const [checked, setChecked] = useState(false);
  const [keepReading, setkeepReading] = useState(true);
  const handleClick = () => setChecked(!checked);

  const closePort = () => setkeepReading(!keepReading);

  const connectPort = async () => {
    try {
      const filters = [{ usbVendorId: 0x04d8, usbProductId: 0xef67 }];
      const port = await navigator.serial.requestPort({ filters });
      const { usbProductId, usbVendorId } = port.getInfo();
      await port.open({ baudRate: 115200 });

      while (port.readable && keepReading) {
        const reader = port.readable.getReader();

        try {
          while (true) {
            const { value, done } = await reader.read();
            if (done) {
              // Allow the serial port to be closed later.
              //reader.releaseLock();
              break;
            }
            if (value) {
              //   byte array to string: https://stackoverflow.com/a/37542820
              const text = String.fromCharCode.apply(null, value);
              console.log(text);
              setSerialPortContent((prevContent) => [
                ...prevContent,
                [new Date(), text],
              ]);
            }
          }
        } catch (error) {
          setSerialPortContent((prevContent) => [
            ...prevContent,
            [new Date(), error],
          ]);
        } finally {
          reader.releaseLock();
        }
        await port.close();
      }
    } catch (error) {
      setSerialPortContent((prevContent) => [
        ...prevContent,
        [new Date(), error],
      ]);
    }
  };

  return (
    <>
      <div style={{ width: "100%" }}>
        <Button
          style={{ marginTop: "20px" }}
          variant="contained"
          color="primary"
          onClick={() => connectPort()}
        >
          Connect to sensebox
        </Button>
        {keepReading ? (
          <Button
            style={{
              marginTop: "20px",
              marginLeft: "1rem",
              marginRight: "1rem",
            }}
            variant="contained"
            color="primary"
            onClick={() => closePort()}
          >
            Stop connection
          </Button>
        ) : null}

        <Button
          style={{ marginTop: "20px", marginLeft: "1rem", marginRight: "1rem" }}
          variant="contained"
          color="primary"
          onClick={() => setSerialPortContent([])}
        >
          Clear
        </Button>

        <FormControlLabel
          control={
            <Checkbox
              onChange={handleClick}
              checked={checked}
              name="checkedB"
              color="primary"
            />
          }
          label="Show Timestamps"
        />
        <div style={{ width: "100%", height: "48vH", overflow: "auto" }}>
          {serialPortContent.map((log) => {
            return (
              <p>
                {checked && `${log[0].toISOString()}  -> `}
                {log[1]}
              </p>
            );
          })}
        </div>
      </div>
      {/* <iframe
              className="w-full h-full"
              src="https://googlechromelabs.github.io/serial-terminal/"
            ></iframe> */}
    </>
  );
};

export default SerialMonitor;

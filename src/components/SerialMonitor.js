import React from "react";
import { useState } from "react";

import Button from "@material-ui/core/Button";
import Checkbox from "@material-ui/core/Checkbox";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import HighchartsReact from "highcharts-react-official";
import Highcharts from "highcharts";
import Switch from "@material-ui/core/Switch";

const SerialMonitor = () => {
  const [serialPortContent, setSerialPortContent] = useState([]);
  const [checked, setChecked] = useState(false);
  const [keepReading, setkeepReading] = useState(true);
  const [reader, setReader] = useState();
  const [hoverData, setHoverData] = useState(null);
  const [switched, setSwitched] = useState(false);
  const [chartOptions, setChartOptions] = useState({
    title: {
      text: "Serial Output",
    },
    xAxis: {
      categories: ["A", "B", "C"],
    },
    series: [
      {
        type: "line",
        name: "Serial1",
        data: [1, 2, 3],
      },
    ],
    plotOptions: {
      series: {
        point: {
          events: {
            mouseOver(e) {
              setHoverData(e.target.category);
            },
          },
        },
      },
    },
  });

  const handleClick = () => setChecked(!checked);

  const handleSwitch = () => setSwitched(!switched);

  const closePort = async () => {
    setkeepReading(false);
    reader.cancel();
    await connectPort;
  };

  const connectPort = async () => {
    var dataArray = [];
    var timeArray = [];
    // try {
    const filters = [{ usbVendorId: 0x04d8, usbProductId: 0xef67 }];
    const port = await navigator.serial.requestPort({ filters });
    setkeepReading(true);
    const { usbProductId, usbVendorId } = port.getInfo();
    await port.open({ baudRate: 115200 });
    while (port.readable && keepReading) {
      const textDecoder = new window.TextDecoderStream();
      const readableStreamClosed = port.readable.pipeTo(textDecoder.writable);
      const reader = textDecoder.readable.getReader();

      //const reader = port.readable.getReader();
      setReader(reader);
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) {
            // Allow the serial port to be closed later.
            reader.releaseLock();
            break;
          }
          if (value) {
            //   byte array to string: https://stackoverflow.com/a/37542820
            // const text = String.fromCharCode.apply(null, value);
            dataArray.push(Number(value));
            timeArray.push(new Date().getTime());
            console.log(dataArray);
            //console.log(text);

            setChartOptions({
              xAxis: {
                categories: timeArray,
              },
              series: [
                {
                  type: "line",
                  data: dataArray,
                },
              ],
            });
            setSerialPortContent((prevContent) => [
              ...prevContent,
              [new Date(), value],
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
    }
    await port.close();
    //}

    // catch (error) {
    //   setSerialPortContent((prevContent) => [
    //     ...prevContent,
    //     [new Date(), error],
    //   ]);
    // }
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
        <FormControlLabel
          control={
            <Switch
              checked={switched}
              onChange={handleSwitch}
              name="switch"
              color="primary"
              inputProps={{ "aria-label": "secondary checkbox" }}
            />
          }
          label="Plot Data"
        />
        {switched ? (
          <div style={{ width: "100%", height: "48vH", overflow: "auto" }}>
            <HighchartsReact highcharts={Highcharts} options={chartOptions} />
          </div>
        ) : (
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
        )}
      </div>
    </>
  );
};

export default SerialMonitor;

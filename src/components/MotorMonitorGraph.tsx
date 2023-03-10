import { Input, Button } from "@mui/material";
import { Axis } from "plotly.js";
import { useRef, useState } from "react";
import Plot, { Figure } from "react-plotly.js";
import { useSerialLineEvent } from "../lib/useSerialLineEvent";

const MAX_POINTS = 1000;

const COLORS = ["red", "green", "blue", "orange", "pink"];

export const MotorMonitorGraph = ( props : { motorKey: string }) => {
  const metrics = useRef([] as { name: string; data: number[] }[]);
  const [revision, setRevision] = useState(0);
  const [pointNumber, setpointNumber] = useState(MAX_POINTS);
  const [axisZooms, setAxisZooms] = useState({
    xaxis: undefined as undefined | number[],
    yaxis: [] as (undefined | number[])[],
  });

  var X_SCALE = new Array(pointNumber).fill(0).map((x, i) => i);

  const handlePointsChange = (e: any) => {  
    metrics.current.forEach((metric, i) => {
      metric.data= [];
    })
  };

  useSerialLineEvent((line) => {
    if (line.content.startsWith(`${props.motorKey}`) && line.content.endsWith(`${props.motorKey}`)) {
      const points = line.content.slice(1,-1).split("\t").map(Number);
      var n_point = points.length
      points.forEach((point, i) => {
        if (!metrics.current[i]) {
          metrics.current[i] = {
            name: i.toString(),
            data: [] //new Array(pointNumber).fill(0),
          };
        }
        // if(!metrics.current[i].data.length){
        //   metrics.current[i].data =  new Array(pointNumber).fill(0);
        // }
        metrics.current[i].data.push(point);
        if (metrics.current[i].data.length > pointNumber) {
          metrics.current[i].data.splice(
            0,
            metrics.current[i].data.length - pointNumber
          );
        }
      });
      for (let i = n_point; i < 7; i++) { 
        if (metrics.current[i]) metrics.current[i].data = []
      }
      setRevision((r) => r + 1);
    }    
  });

  const handleGraphUpdate = (update: Readonly<Figure>) => {
    let newZoom: typeof axisZooms = {
      xaxis: update.layout.xaxis?.autorange
        ? undefined
        : update.layout.xaxis?.range,
      yaxis: [],
    };

    let hasChanged = axisZooms.xaxis !== newZoom.xaxis;

    metrics.current.map((m, i) => {
      const yAxis = (update.layout as any)[
        `yaxis${i === 0 ? "" : i + 1}`
      ] as Partial<Axis>;

      // const zoom = yAxis?.autorange ? undefined : yAxis?.range;
      // newZoom.yaxis.push(zoom);
      // if (zoom !== axisZooms.yaxis[i]) {
      //   hasChanged = true;
      // }
    });

    if (hasChanged) {
      setAxisZooms(newZoom);
    }
  };

  const axisData = {
    xaxis: {
      autoRange: axisZooms.xaxis,
    },
  } as any;
  // metrics.current.forEach((m, i) => {
  //   const range = axisZooms.yaxis[i];
  //   axisData[`yaxis${i === 0 ? "" : i + 1}`] = {
  //     autoRange: !range,
  //     range: range,
  //     tickfront: {
  //       color: COLORS[i],
  //     },
  //     titlefont: {
  //       color: COLORS[i],
  //     },
  //     // position: i * 0.1,
  //     side: i % 2 ? "left" : "right",
  //     // anchor: "free",
  //     // overlaying: "y",
  //     title: `Trace ${i}`,
  //   };
  // });

  return (
    <div>
      <Plot
        revision={revision}
        data={metrics.current.map((metric, i) => ({
          x: X_SCALE,
          y: metric.data,
          type: "scattergl",
          mode: "lines",
          // yaxis: `y${i === 0 ? "" : i + 1}`,
          // line: {
          //   color: COLORS[i],
          // },
        }))}
        layout={{
          // autosize: true,
          height: 700,
          datarevision: revision,
          ...axisData,
        }}
        onUpdate={handleGraphUpdate}
        useResizeHandler
        style={{
          width: "100%",
        }}
      />
      <Button variant="outlined" onClick={handlePointsChange}>Reset plot</Button>
    </div>
  );
};

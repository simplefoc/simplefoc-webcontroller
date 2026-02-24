import { Button, Stack, Paper, Box, TextField } from "@mui/material";
import DragIndicatorIcon from "@mui/icons-material/DragIndicator";
import { useRef, useState, useEffect, memo } from "react";
import Plot from "react-plotly.js";
import { useSerialLineEvent } from "../lib/useSerialLineEvent";

const DEFAULT_POINTS = 5000;
const MIN_POINTS = 100;
const MAX_WINDOW_POINTS = 50000;
const REDRAW_INTERVAL_MS = 100;

const clampPoints = (value: number) => Math.max(MIN_POINTS, Math.min(MAX_WINDOW_POINTS, value));

const COLORS = ["#d62728", "#2ca02c", "#1f77b4", "#ff7f0e", "#9467bd", "#8c564b", "#e377c2"];
const LABELS = ["Target", "Voltage Q [V]", "Voltage D [V]", "Current Q [mA]", "Current D [mA]", "Velocity [rad/s]", "Angle [rad]"];

interface MotorMonitorGraphProps {
  motorKey: string;
  monitoredVars: string;
  debugMode?: "off" | "random";
  isMonitoring?: boolean;
}

export const MotorMonitorGraph = memo((props: MotorMonitorGraphProps) => {
  const metrics = useRef([] as { name: string; data: number[] }[]);
  const [revision, setRevision] = useState(0);
  const [pointNumber, setPointNumber] = useState(DEFAULT_POINTS);
  const [plotHeight, setPlotHeight] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const debugIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const redrawIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const redrawPendingRef = useRef(false);
  const timebaseRef = useRef<number[]>([]);
  const sampleIndexRef = useRef<number>(0);
  const resizeStartYRef = useRef(0);
  const resizeStartHeightRef = useRef(400);

  const pushTick = () => {
    const nextIndex = sampleIndexRef.current + 1;
    sampleIndexRef.current = nextIndex;
    timebaseRef.current.push(nextIndex);
    if (timebaseRef.current.length > pointNumber) {
      timebaseRef.current.splice(0, timebaseRef.current.length - pointNumber);
    }
    // Ensure all metric arrays are kept in sync length-wise using NaN padding
    if (metrics.current.length) {
      for (let i = 0; i < metrics.current.length; i++) {
        const arr = metrics.current[i].data;
        arr.push(NaN);
        if (arr.length > pointNumber) {
          arr.splice(0, arr.length - pointNumber);
        }
      }
    }
  };

  // Generate random debug data
  useEffect(() => {
    if (props.debugMode === "random" && props.isMonitoring) {
      debugIntervalRef.current = setInterval(() => {
        // Get monitored variable indices
        const monitored_var_indices: number[] = [];
        for (let i = 0; i < props.monitoredVars.length; i++) {
          if (props.monitoredVars[i] === "1") monitored_var_indices.push(i);
        }

        // Initialize metrics if needed
        if (!metrics.current.length) {
          for (let i = 0; i < 7; i++) {
            metrics.current[i] = { name: LABELS[i], data: [] };
          }
        }

        // Advance shared timebase tick
        pushTick();

        // Generate and push random data for monitored vars; keep others padded with NaN
        for (let i = 0; i < 7; i++) {
          if (monitored_var_indices.includes(i)) {
            const randomValue = Math.sin(Date.now() / 1000 + i) * 10 + Math.random() * 5;
            metrics.current[i].data[metrics.current[i].data.length - 1] = randomValue;
          }
        }
        redrawPendingRef.current = true;
      }, 100); // Update every 100ms
    } else {
      if (debugIntervalRef.current) {
        clearInterval(debugIntervalRef.current);
        debugIntervalRef.current = null;
      }
    }

    return () => {
      if (debugIntervalRef.current) clearInterval(debugIntervalRef.current);
    };
  }, [props.debugMode, props.isMonitoring, props.monitoredVars, pointNumber]);

  useSerialLineEvent((line) => {
    if (!props.isMonitoring) {
      return;
    }

    if (props.debugMode === "off" && line.content.startsWith(`${props.motorKey}`) && line.content.endsWith(`${props.motorKey}`)) {
      // Parse received variables
      const points = line.content.slice(1, -1).split("\t").map(Number);
      
      // Parse monitored variables
      const monitored_var_indices: number[] = [];
      for (let i = 0; i < props.monitoredVars.length; i++) {
        if (props.monitoredVars[i] === "1") monitored_var_indices.push(i);
      }

      // Initial creation of lines
      if (!metrics.current.length) {
        for (let i = 0; i < 7; i++) {
          metrics.current[i] = { name: LABELS[i], data: [] };
        }
      }

      // Advance shared timebase tick
      pushTick();

      // Map incoming points to their variable indices and pad others with NaN
      if (monitored_var_indices.length && points.length === monitored_var_indices.length) {
        for (let i = 0; i < 7; i++) {
          const idxInMonitored = monitored_var_indices.indexOf(i);
          if (idxInMonitored !== -1) {
            const val = points[idxInMonitored];
            metrics.current[i].data[metrics.current[i].data.length - 1] = val;
          }
        }
      }
      redrawPendingRef.current = true;
    }
  });

  const handleReset = () => {
    metrics.current.forEach((metric) => {
      metric.data = [];
    });
    timebaseRef.current = [];
    sampleIndexRef.current = 0;
    setRevision((r) => r + 1);
  };

  useEffect(() => {
    if (timebaseRef.current.length > pointNumber) {
      timebaseRef.current.splice(0, timebaseRef.current.length - pointNumber);
    }
    for (let i = 0; i < metrics.current.length; i++) {
      const arr = metrics.current[i].data;
      if (arr.length > pointNumber) {
        arr.splice(0, arr.length - pointNumber);
      }
    }
    setRevision((r) => r + 1);
  }, [pointNumber]);

  useEffect(() => {
    if (!props.isMonitoring) {
      if (redrawIntervalRef.current) {
        clearInterval(redrawIntervalRef.current);
        redrawIntervalRef.current = null;
      }
      return;
    }

    redrawIntervalRef.current = setInterval(() => {
      if (!redrawPendingRef.current) {
        return;
      }
      redrawPendingRef.current = false;
      setRevision((r) => r + 1);
    }, REDRAW_INTERVAL_MS);

    return () => {
      if (redrawIntervalRef.current) {
        clearInterval(redrawIntervalRef.current);
        redrawIntervalRef.current = null;
      }
    };
  }, [props.isMonitoring]);

  const xMin = timebaseRef.current.length ? timebaseRef.current[0] : 0;
  const xMax = timebaseRef.current.length
    ? timebaseRef.current[timebaseRef.current.length - 1]
    : pointNumber;

  useEffect(() => {
    if (!isResizing) {
      return;
    }

    const handleMouseMove = (event: MouseEvent) => {
      const deltaY = event.clientY - resizeStartYRef.current;
      const nextHeight = Math.max(220, Math.min(900, resizeStartHeightRef.current + deltaY));
      setPlotHeight(nextHeight);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  return (
    <Paper sx={{ p: 2, bgcolor: "background.paper" }}>
      <Stack spacing={1.5}>
        <Box sx={{ width: "100%" }}>
          <Plot
            revision={revision}
            data={metrics.current
              .map((metric, i) => ({
                x: timebaseRef.current,
                y: metric.data,
                name: metric.name,
                showlegend: true,
                type: "scatter" as const,
                mode: "lines" as const,
                line: {
                  color: COLORS[i],
                  width: 1.5,
                },
                hovertemplate: `${metric.name}: %{y:.2f}<extra></extra>`,
              }))
              .filter((_, i) => props.monitoredVars[i] === "1")}
            layout={{
              autosize: true,
              title: {
                text: `Motor ${props.motorKey} - Real-time Monitor`,
                font: { size: 14 },
              },
              legend: {
                x: 1,
                xanchor: "right",
                y: 1,
                bgcolor: "rgba(255,255,255,0.8)",
                bordercolor: "rgba(0,0,0,0.2)",
                borderwidth: 1,
              },
              height: plotHeight,
              margin: { l: 50, r: 50, t: 50, b: 50 },
              xaxis: {
                title: "Sample",
                autorange: props.isMonitoring ? false : undefined,
                range: props.isMonitoring ? [xMin, xMax] : undefined,
                showgrid: true,
                gridwidth: 1,
                gridcolor: "rgba(0,0,0,0.05)",
              },
              yaxis: {
                title: "Value",
                showgrid: true,
                gridwidth: 1,
                gridcolor: "rgba(0,0,0,0.05)",
              },
              hovermode: "x unified",
              uirevision: props.isMonitoring ? revision : "monitor-paused",
              datarevision: revision,
            } as any}
            config={{ responsive: true }}
            useResizeHandler
            style={{
              width: "100%",
              display: "block",
            }}
          />
          <Box
            onMouseDown={(event) => {
              resizeStartYRef.current = event.clientY;
              resizeStartHeightRef.current = plotHeight;
              setIsResizing(true);
            }}
            sx={{
              height: 24,
              mt: -0.25,
              cursor: "ns-resize",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              color: isResizing ? "primary.main" : "text.secondary",
              userSelect: "none",
              borderRadius: 1,
              bgcolor: isResizing ? "action.selected" : "action.hover",
              transition: "all 0.15s ease",
              "&:hover": {
                bgcolor: "action.selected",
                color: "primary.main",
              },
              "&::before": {
                content: '""',
                width: 24,
                height: 3,
                borderRadius: 2,
                bgcolor: "divider",
              },
            }}
          >
            <DragIndicatorIcon sx={{ fontSize: "0.9rem" }} />
            <Box component="span" sx={{ fontSize: "0.72rem", fontWeight: 600 }}>
              Drag to resize plot
            </Box>
            <DragIndicatorIcon sx={{ fontSize: "0.9rem" }} />
          </Box>
        </Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ alignSelf: "flex-start" }}>
          <Button
            variant="outlined"
            size="small"
            onClick={handleReset}
          >
            Clear
          </Button>
          <TextField
            size="small"
            type="number"
            label="Window (samples)"
            value={pointNumber}
            onChange={(event) => {
              const parsedValue = Number(event.target.value);
              if (!Number.isFinite(parsedValue)) {
                return;
              }
              setPointNumber(clampPoints(Math.round(parsedValue)));
            }}
            inputProps={{ min: MIN_POINTS, max: MAX_WINDOW_POINTS, step: 100 }}
            sx={{ width: 180 }}
          />
        </Stack>
      </Stack>
    </Paper>
  );
});

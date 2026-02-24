import { Typography, Button, Stack, Checkbox, FormControlLabel, Paper, TextField, Collapse, Link, Dialog, DialogTitle, DialogContent, DialogActions } from "@mui/material";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { throttle } from "lodash-es";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useSerialPortRef } from "../../lib/serialContext";
import { useSerialLineEvent } from "../../lib/useSerialLineEvent";
import { MotorMonitorGraph } from "../MotorMonitorGraph";
import { Box as SysBox } from "@mui/system";

const MESSAGE_RATE_ALPHA = 0.3;

const MessageRateDisplay = memo(({ motorKey, isMonitoring }: { motorKey: string; isMonitoring: boolean }) => {
  const [messagesPerSecond, setMessagesPerSecond] = useState<number | null>(null);
  const messageRateWindowStartRef = useRef<number | null>(null);
  const messageRateCountRef = useRef(0);
  const smoothedMessageRateRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isMonitoring) {
      messageRateWindowStartRef.current = null;
      messageRateCountRef.current = 0;
      smoothedMessageRateRef.current = null;
      setMessagesPerSecond(null);
      return;
    }
    messageRateWindowStartRef.current = performance.now();
    messageRateCountRef.current = 0;
    smoothedMessageRateRef.current = null;
    setMessagesPerSecond(null);

    const intervalRef = setInterval(() => {
      const windowStart = messageRateWindowStartRef.current;
      if (windowStart === null) return;
      const now = performance.now();
      const elapsedMs = now - windowStart;
      if (elapsedMs < 500) return;
      const rawRate = (messageRateCountRef.current * 1000) / elapsedMs;
      smoothedMessageRateRef.current =
        smoothedMessageRateRef.current === null
          ? rawRate
          : smoothedMessageRateRef.current * (1 - MESSAGE_RATE_ALPHA) + rawRate * MESSAGE_RATE_ALPHA;
      setMessagesPerSecond(smoothedMessageRateRef.current);
      messageRateWindowStartRef.current = now;
      messageRateCountRef.current = 0;
    }, 1000);

    return () => clearInterval(intervalRef);
  }, [isMonitoring]);

  useSerialLineEvent((line) => {
    if (!isMonitoring) return;
    if (!line.content.startsWith(motorKey) || !line.content.endsWith(motorKey)) return;
    if (messageRateWindowStartRef.current === null) {
      messageRateWindowStartRef.current = performance.now();
    }
    messageRateCountRef.current += 1;
  });

  return (
    <Typography variant="caption" sx={{ color: "text.secondary", pb: 0.6, whiteSpace: "nowrap", fontSize: "0.9rem" }}>
      Messages/s: <b>{messagesPerSecond === null ? "-" : messagesPerSecond.toFixed(1)}</b> (TIP: Aim for 10-200)
    </Typography>
  );
});

export const Monitoring = (props: { motorKey: string }) => {
  const fullCommandString = `${props.motorKey}MS`;
  const downsampleCommand = `${props.motorKey}MD`;
  const serialRef = useSerialPortRef();

  const [shareMonitorVars, setShareMonitorVars] = useState("0000000");
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [downsampleInput, setDownsampleInput] = useState("100");

  const setCharAt = (str: string, index: number, chr: string) => {
    if (index > str.length - 1) return str;
    return str.substring(0, index) + chr + str.substring(index + 1);
  };

  const getCheckboxValue = (id: string) => {
    const element = document.getElementById(id) as HTMLInputElement | null;
    return element?.checked ? "1" : "0";
  };

  const parseDownsample = () => {
    const parsedValue = Number(downsampleInput);
    if (!Number.isFinite(parsedValue)) {
      return null;
    }
    return Math.max(0, Math.round(parsedValue));
  };

  const changeValue = useMemo(
    () =>
      throttle((value: string) => {
        serialRef.current?.send(`${fullCommandString}${value}`);
      }, 200),
    [serialRef, fullCommandString]
  );

  useEffect(() => {
    return () => {
      changeValue.cancel();
    };
  }, [changeValue]);

  useEffect(() => {
    serialRef.current?.send(`${downsampleCommand}0`);
  }, [serialRef, downsampleCommand]);

  const updateMonitoredVars = () => {
    let monitoredVars = "0000000";
    monitoredVars = setCharAt(monitoredVars, 0, getCheckboxValue("tar"));
    monitoredVars = setCharAt(monitoredVars, 1, getCheckboxValue("vq"));
    monitoredVars = setCharAt(monitoredVars, 2, getCheckboxValue("vd"));
    monitoredVars = setCharAt(monitoredVars, 3, getCheckboxValue("cq"));
    monitoredVars = setCharAt(monitoredVars, 4, getCheckboxValue("cd"));
    monitoredVars = setCharAt(monitoredVars, 5, getCheckboxValue("vel"));
    monitoredVars = setCharAt(monitoredVars, 6, getCheckboxValue("angle"));
    changeValue(monitoredVars);
    setShareMonitorVars(monitoredVars);
  };

  const toggleMonitoring = () => {
    const nextIsMonitoring = !isMonitoring;
    setIsMonitoring(nextIsMonitoring);
    if (!nextIsMonitoring) {
      serialRef.current?.send(`${downsampleCommand}0`);
    }
  };

  useEffect(() => {
    if (!isMonitoring) {
      return;
    }

    const downsample = parseDownsample();
    if (downsample === null) {
      return;
    }
    serialRef.current?.send(`${downsampleCommand}${downsample}`);
  }, [isMonitoring, downsampleInput]);

  return (
    <SysBox sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
      <Paper sx={{ p: 1, bgcolor: "background.paper" }}>
        <Stack gap={0.75}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              Monitor Controls
            </Typography>
            <Stack direction="row" spacing={0.5}>
              <Button
                size="small"
                variant="text"
                onClick={() => setShowInfoDialog(true)}
                sx={{ minWidth: 56, minHeight: 24, py: 0, px: 0.8 }}
              >
                Info
              </Button>
              <Button
                size="small"
                variant="text"
                onClick={() => setShowControls((current) => !current)}
                endIcon={showControls ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{ minWidth: 78, minHeight: 24, py: 0, px: 0.8 }}
              >
                {showControls ? "Collapse" : "Expand"}
              </Button>
            </Stack>
          </Stack>

          <Dialog
            open={showInfoDialog}
            onClose={() => setShowInfoDialog(false)}
            maxWidth="sm"
            fullWidth
          >
            <DialogTitle>Monitoring</DialogTitle>
            <DialogContent>
              <Typography variant="body2" sx={{ color: "text.secondary" }}>
                Configure monitored variables and downsample rate, then start monitoring.
                <br />
                <strong>Aim for a message rate of around 10-100/s for smooth graph updates.</strong>
                <br />
                The graph displays the most recent value of each monitored variable, so higher message rates are smoother but may increase CPU usage.
                <br />
                See more info in{" "}
                <Link
                  href="https://docs.simplefoc.com/monitoring"
                  target="_blank"
                  rel="noreferrer"
                >
                  Docs
                </Link>
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowInfoDialog(false)}>Close</Button>
            </DialogActions>
          </Dialog>

          <Collapse in={showControls}>
            <Stack gap={0.75}>
              <Stack direction="row" spacing={1} alignItems="flex-end" sx={{ flexWrap: "nowrap" }}>
                <Button
                  variant="contained"
                  size="small"
                  onClick={toggleMonitoring}
                  startIcon={isMonitoring ? <PauseIcon /> : <PlayArrowIcon />}
                  sx={{ minWidth: 92, height: 34, px: 1.1 }}
                >
                  {isMonitoring ? "Monitoring" : "Start"}
                </Button>
                <TextField
                  label="Downsample"
                  value={downsampleInput}
                  onChange={(event) => setDownsampleInput(event.target.value)}
                  variant="outlined"
                  size="small"
                  type="number"
                  inputProps={{ min: 0, step: 1 }}
                  sx={{ minWidth: 128, flexShrink: 0 }}
                />
                <MessageRateDisplay motorKey={props.motorKey} isMonitoring={isMonitoring} />
              </Stack>

              <Stack>
                <Typography variant="caption" sx={{ fontWeight: 600, mb: 0.25, fontSize: "0.72rem" }}>
                  Variables
                </Typography>
                <Stack direction="row" spacing={0.75} sx={{ flexWrap: "wrap", rowGap: 0.25 }}>
                  <FormControlLabel
                    sx={{ m: 0, mr: 0.75 }}
                    control={<Checkbox id="tar" onChange={updateMonitoredVars} size="small" />}
                    label={<Typography variant="caption" sx={{ fontSize: "0.74rem" }}>Target</Typography>}
                  />
                  <FormControlLabel
                    sx={{ m: 0, mr: 0.75 }}
                    control={<Checkbox id="vq" onChange={updateMonitoredVars} size="small" />}
                    label={<Typography variant="caption" sx={{ fontSize: "0.74rem" }}>Vq</Typography>}
                  />
                  <FormControlLabel
                    sx={{ m: 0, mr: 0.75 }}
                    control={<Checkbox id="vd" onChange={updateMonitoredVars} size="small" />}
                    label={<Typography variant="caption" sx={{ fontSize: "0.74rem" }}>Vd</Typography>}
                  />
                  <FormControlLabel
                    sx={{ m: 0, mr: 0.75 }}
                    control={<Checkbox id="cq" onChange={updateMonitoredVars} size="small" />}
                    label={<Typography variant="caption" sx={{ fontSize: "0.74rem" }}>Iq</Typography>}
                  />
                  <FormControlLabel
                    sx={{ m: 0, mr: 0.75 }}
                    control={<Checkbox id="cd" onChange={updateMonitoredVars} size="small" />}
                    label={<Typography variant="caption" sx={{ fontSize: "0.74rem" }}>Id</Typography>}
                  />
                  <FormControlLabel
                    sx={{ m: 0, mr: 0.75 }}
                    control={<Checkbox id="vel" onChange={updateMonitoredVars} size="small" />}
                    label={<Typography variant="caption" sx={{ fontSize: "0.74rem" }}>Vel</Typography>}
                  />
                  <FormControlLabel
                    sx={{ m: 0, mr: 0.75 }}
                    control={<Checkbox id="angle" onChange={updateMonitoredVars} size="small" />}
                    label={<Typography variant="caption" sx={{ fontSize: "0.74rem" }}>Angle</Typography>}
                  />
                </Stack>
              </Stack>
            </Stack>
          </Collapse>
        </Stack>
      </Paper>

      <MotorMonitorGraph
        motorKey={props.motorKey}
        monitoredVars={shareMonitorVars}
        debugMode="off"
        isMonitoring={isMonitoring}
      />
    </SysBox>
  );
};

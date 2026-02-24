import {
  CircularProgress,
  Stack,
  Typography,
  TextField,
  Button,
  Tabs,
  Tab,
  Paper,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Link,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { ReactNode, useState, useEffect } from "react";
import { useSerialIntervalSender } from "../lib/useSerialIntervalSender";
import { useSerialLineEvent } from "../lib/useSerialLineEvent";
import { FocBoolean } from "./Parameters/FocBoolean";
import { FocScalar } from "./Parameters/FocScalar";
import { Monitoring } from "./Parameters/Monitoring";
import { LoopTimingInfo } from "./Parameters/LoopTimingInfo";
import { JoggingControl } from "./Parameters/JoggingControl";
import { SimpleFocDigitalReadout } from "./Parameters/SimpleFocDigitalReadout";
import { useSerialPortOpenStatus, useSerialPortRef } from "../lib/serialContext";
import { TorqueControlTypeSwitch } from "./Parameters/TorqueControlTypeSwitch";
import { MotorControlTypeSwitch } from "./Parameters/MotorControlTypeSwitch";
import { StepGenerator } from "./Parameters/StepGenerator";

const MOTOR_OUTPUT_REGEX = /^\?(\w):(.*)\r?$/;

export const Motors = () => {
  const [motors, setMotors] = useState<{ [key: string]: string }>({});
  const [angleByMotor, setAngleByMotor] = useState<{ [key: string]: number }>({});
  const [motorTabValue, setMotorTabValue] = useState(0);
  const [splitRatio, setSplitRatio] = useState(0.5); // 50/50 split by default
  const [isDragging, setIsDragging] = useState(false);
  const [characteriseVoltage, setCharacteriseVoltage] = useState("");
  const [currentPiBandwidth, setCurrentPiBandwidth] = useState("");
  const [expandedSections, setExpandedSections] = useState({
    targetSetting: false,
    stepGenerator: false,
    motionTorque: false,
    motorParameters: false,
    sensor: false,
    limits: false,
    currentControl: false,
    velocityControl: false,
    angleControl: false,
  });
  const [infoDialogSection, setInfoDialogSection] = useState<keyof typeof expandedSections | null>(null);
  const portOpen = useSerialPortOpenStatus();
  const serialRef = useSerialPortRef();

  useSerialIntervalSender("?", 10000);
  useSerialLineEvent((line) => {
    const match = line.content.match(MOTOR_OUTPUT_REGEX);
    if (match) {
      setMotors((m) => ({
        ...m,
        [match[1]]: match[2],
      }));
    }
  });

  // Handle draggable divider
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const container = document.getElementById("motor-split-container");
      if (!container) return;
      const rect = container.getBoundingClientRect();
      const newRatio = (e.clientX - rect.left) / rect.width;
      setSplitRatio(Math.max(0.2, Math.min(0.8, newRatio))); // Limit between 20% and 80%
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging]);

  const motorKeys = Object.keys(motors).sort();

  useEffect(() => {
    if (motorTabValue >= motorKeys.length) {
      setMotorTabValue(0);
    }
  }, [motorKeys.length, motorTabValue]);

  const currentMotorKey = motorKeys[motorTabValue];

  const handleSectionToggle = (section: keyof typeof expandedSections) => (_: any, expanded: boolean) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: expanded,
    }));
  };

  const sectionInfo: Record<keyof typeof expandedSections, { content: ReactNode }> = {
    targetSetting: {
      content: (
        <Stack gap={1}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Set the commanded target for the active control mode.
          </Typography>
          <Typography component="div" variant="body2" sx={{ color: "text.secondary" }}>
            Units: - See more in  <Link href="https://docs.simplefoc.com/library_units" target="_blank" rel="noreferrer">
            Docs
          </Link>
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.2 }}>
              <li><b>Torque mode:</b> the target represents is in <b>Amps</b> (or <b>Volts</b> in voltage torque mode).</li>
              <li><b>Velocity mode:</b> the target represents the desired speed in <b>rad/s</b>.</li>
              <li><b>Angle mode:</b> the target represents the desired position in <b>radians</b>.</li>
            </Box>
          Find more info about motion control modes in <Link href="https://docs.simplefoc.com/motion_control" target="_blank" rel="noreferrer">
            Docs
          </Link>
           </Typography>
        </Stack>
      ),
    },
    stepGenerator: {
      content: (
        <Stack gap={1}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Configure and run periodic high/low target steps. This generator is intended for PI parameter tuning, allowing you to observe the controller's response to step changes in target.
          </Typography>
          <Typography component="div" variant="body2" sx={{ color: "text.secondary" }}>
            Includes:
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.2 }}>
              <li>High value and low value.</li>
              <li>Step duration in milliseconds.</li>
              <li>Start/Stop toggling.</li>
            </Box>
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
              Units for high/low values depend on the current control mode (see Target Setting info).
          </Typography>
          <Link href="https://docs.simplefoc.com/motion_control" target="_blank" rel="noreferrer">
            Docs
          </Link>
        </Stack>
      ),
    },
    motionTorque: {
      content: (
        <Stack gap={1}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Motion and torque control setting for the motor. These settings determine how the controller regulates the motor to achieve the commanded target.
            <hr></hr>
            <b>Motion control modes</b> - see more in <Link href="https://docs.simplefoc.com/motion_control" target="_blank" rel="noreferrer">Docs</Link>
       
          </Typography>
          <Typography component="div" variant="body2" sx={{ color: "text.secondary" }}>
            Closed-loop control modes include:
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.2 }}>
              <li><b>Torque</b>: See in <Link href="https://docs.simplefoc.com/torque_loop" target="_blank" rel="noreferrer">Docs</Link></li>
              <li><b>Velocity</b>: See in <Link href="https://docs.simplefoc.com/velocity_loop" target="_blank" rel="noreferrer">Docs</Link></li>
              <li><b>Position</b>: See in <Link href="https://docs.simplefoc.com/angle_cascade_control" target="_blank" rel="noreferrer">Docs</Link></li>
              <li><b>Position nocascade</b>: See in <Link href="https://docs.simplefoc.com/angle_nocascade_control" target="_blank" rel="noreferrer">Docs</Link></li>
              <li><b>Custom</b>: See in <Link href="https://docs.simplefoc.com/custom_control" target="_blank" rel="noreferrer">Docs</Link></li>
            </Box>
            Open-loop control modes include:
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.2 }}>
              <li><b>Velocity open-loop</b>: See in <Link href="https://docs.simplefoc.com/velocity_openloop" target="_blank" rel="noreferrer">Docs</Link></li>
              <li><b>Position open-loop</b>: See in <Link href="https://docs.simplefoc.com/angle_openloop" target="_blank" rel="noreferrer">Docs</Link></li>
            </Box>
            <hr></hr>
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            <b>Torque/FOC control modes</b> - see more in <Link href="https://docs.simplefoc.com/torque_control" target="_blank" rel="noreferrer">Docs</Link>
          </Typography>
          <Typography component="div" variant="body2" sx={{ color: "text.secondary" }}>
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.2 }}>
              <li><b>Voltage</b>: See in <Link href="https://docs.simplefoc.com/voltage_torque_mode" target="_blank" rel="noreferrer">Docs</Link></li>
              <li><b>Estimated current</b>: See in <Link href="https://docs.simplefoc.com/estimated_current_mode" target="_blank" rel="noreferrer">Docs</Link></li>
              <li><b>FOC current</b>: See in <Link href="https://docs.simplefoc.com/foc_current_torque_mode" target="_blank" rel="noreferrer">Docs</Link></li>
              <li><b>DC current</b>: See in <Link href="https://docs.simplefoc.com/dc_current_torque_mode" target="_blank" rel="noreferrer">Docs</Link></li>
              </Box>
            
          </Typography>
        </Stack>
      ),
    },
    motorParameters: {
      content: (
        <Stack gap={1}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Set the and tune motor model parameters such as resistance, KV and inductance.<br></br>
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.2 }}>
            <li>These parameters are crutial for esimated current torque control mode (see in <Link href="https://docs.simplefoc.com/estimated_current_mode" target="_blank" rel="noreferrer">Docs</Link>) but can also be used to improve performance in other control modes.</li>
            <li>They can be used to auto-tune current control loop (see Advanced section)</li>
            <li> They can be measured by hand (See in <Link href="https://docs.simplefoc.com/practical_guides#motor-parameters-and-characterization" target="_blank" rel="noreferrer">Docs</Link>) or auto-characterised using the webcontroller button <b>Characterise Motor</b></li>
            <li> Characterise Motor - Measures motor resistance and inductance automatically (<b>⚠️requires current sensing</b>). Takes a voltage to be used for characterisation as input. - See more in <Link href="https://docs.simplefoc.com/motor_characterisation" target="_blank" rel="noreferrer">Docs</Link></li>
          </Box>
           </Typography>
        </Stack>
      ),
    },
    sensor: {
      content: (
        <Stack gap={1}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Adjust sensor elecrical zero angle and sensor offset. 
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.2 }}>
              <li><b>Mechanical offset</b>: Set the motor's zero angle to any desired position. - See in <Link href="https://docs.simplefoc.com/bldcmotor#step-53-position-sensor-offset" target="_blank" rel="noreferrer">Docs</Link></li>
              <li><b>Elecrical zero angle</b>: <b>⚠️ A CRUCIAL PARAMETER! ONLY CHANGE IF NECESSARY!</b> - If value is incorrect, the motor will not rotate or rotate purely, can even run away. (If necessary you can recalibrate the sensor by running <b>Reinit FOC button</b>)</li>
              <li><b>Reinit FOC</b>: Reinitialize the FOC algorithm to recalibrate the sensor. - See in <Link href="https://docs.simplefoc.com/bldcmotor#step-6-align-motor-and-all-the-sensors---field-oriented-control-init" target="_blank" rel="noreferrer">Docs</Link></li>
              </Box>
          </Typography>
        </Stack>
      ),
    },
    limits: {
      content: (
        <Stack gap={1}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Set voltage, velocity and current safety limits.
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.2 }}>
              <li><b>Voltage limit</b>: Max voltage that can be applied to the motor in Volts.</li>
              <li><b>Current limit</b>: Max current that the controller will command in Amps (not used in voltage control mode).</li>
              <li><b>Velocity limit</b>: Max velocity that the controller will command in radians per second (for velocoty and positon control mode - not position nocascade).</li>
            </Box>
          For more info about the limits and when they are used see motion control docs: <Link href="https://docs.simplefoc.com/motion_control" target="_blank" rel="noreferrer">
            Docs
          </Link>
          </Typography>
        </Stack>
      ),
    },
    currentControl: {
      content: (
        <Stack gap={1}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Tune Q/D current-loop PID parameters and ramps.
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.2 }}>
              <li><b>Used in torque control modes</b>: FOC current and DC current torque modes.</li>
              <li>See more about torque control in <Link href="https://docs.simplefoc.com/torque_control" target="_blank" rel="noreferrer">Docs</Link></li>
              <li>PID implementation details can be found in the <Link href="https://docs.simplefoc.com/pid_implementation" target="_blank" rel="noreferrer">Docs</Link></li>
              <li>LPF implementation details can be found in the <Link href="https://docs.simplefoc.com/lpf_implementation" target="_blank" rel="noreferrer">Docs</Link> </li>
              </Box>
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            <b>Auto-tuning of PI parameters</b>
            </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            The webcontroller also includes <b>autotuning for current PI parameters</b>. The PI parameters are tuned using the motor's phase resistance and inductance values.
            They can be set in the Motor parameters section. If not known the parameters can be measured automatically using the <b>Characterise Motor</b> button in the Motor parameters section. 
            For autotuning the current PI parameters, simply input the desired bandwidth for the current loop and click the <b>Autotune Current PIs</b> button. <b>Usual bandwidth is around 50-100 Hz, lower for low speed applications and higher for high speed applications.</b>
            See more info in the <Link href="https://docs.simplefoc.com/tuning_current_loop" target="_blank" rel="noreferrer">Docs</Link>
          </Typography>
        </Stack>
      ),
    },
    velocityControl: {
      content: (
        <Stack gap={1}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Tune velocity-loop PID/filter/limit parameters.
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.2 }}>
              <li><b>Used in motion control modes</b>: Velocity and Position/Angle cascade control modes (not used in Position/Angle nocascade).</li>
              <li>See more about position motion control in <Link href="https://docs.simplefoc.com/velocity_loop" target="_blank" rel="noreferrer">Docs</Link></li>
              <li>PID implementation details can be found in the <Link href="https://docs.simplefoc.com/pid_implementation" target="_blank" rel="noreferrer">
            Docs
          </Link></li>
              <li>LPF implementation details can be found in the <Link href="https://docs.simplefoc.com/lpf_implementation" target="_blank" rel="noreferrer">Docs</Link></li>
            </Box>
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            See a guide to tuning velocity control in the <Link href="https://docs.simplefoc.com/tuning_velocity_loop" target="_blank" rel="noreferrer">Docs</Link>
            </Typography>
        </Stack>
      ),
    },
    angleControl: {
      content: (
        <Stack gap={1}>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            Tune angle-loop PID/filter/limit parameters.
            <Box component="ul" sx={{ mt: 0.5, mb: 0, pl: 2.2 }}>
              <li><b>Used in motion control modes</b>: Position/Angle cascade control mode and in Position/Angle nocascade mode.</li>  
              <li>See more about position motion control in <Link href="https://docs.simplefoc.com/angle_loop" target="_blank" rel="noreferrer">
            Docs
          </Link></li>
            <li>PID implementation details can be found in the <Link href="https://docs.simplefoc.com/pid_implementation" target="_blank" rel="noreferrer">
            Docs
          </Link></li>
            <li>LPF implementation details can be found in the <Link href="https://docs.simplefoc.com/lpf_implementation" target="_blank" rel="noreferrer">
            Docs
          </Link></li>
            </Box>
          </Typography>
          
        </Stack>
      ),
    },
  };

  const sectionTitles = {
    targetSetting: "Target Setting",
    stepGenerator: "Step Generator",
    motionTorque: "Motion & Torque Control",
    motorParameters: "Motor Parameters",
    sensor: "Sensor",
    limits: "Limits",
    currentControl: "Current Control (Q/D Axis)",
    velocityControl: "Velocity Control",
    angleControl: "Angle Control",
  };

  const renderSectionInfo = (section: keyof typeof expandedSections) => (
    <Button
      size="small"
      variant="text"
      onClick={(event) => {
        event.stopPropagation();
        setInfoDialogSection(section);
      }}
      onFocusCapture={(event) => {
        event.stopPropagation();
      }}
      sx={{ minWidth: 48, minHeight: 24, py: 0, px: 0.8, ml: 1 }}
    >
      Info
    </Button>
  );

  const handleCharacteriseParams = () => {
    if (!currentMotorKey) {
      return;
    }
    const voltage = parseFloat(characteriseVoltage);
    if (Number.isNaN(voltage)) {
      return;
    }
    serialRef.current?.send(`${currentMotorKey}FP${voltage}`);
  };

  const handleAutotuneCurrentPis = () => {
    if (!currentMotorKey) {
      return;
    }
    const bandwidth = parseFloat(currentPiBandwidth);
    if (Number.isNaN(bandwidth)) {
      return;
    }
    serialRef.current?.send(`${currentMotorKey}FC${bandwidth}`);
  };

  const handleReinitFoc = () => {
    if (!currentMotorKey) {
      return;
    }
    serialRef.current?.send(`${currentMotorKey}FR`);
  };

  const handleZeroSensor = () => {
    if (!currentMotorKey) {
      return;
    }
    const currentAngle = angleByMotor[currentMotorKey];
    if (currentAngle === undefined || currentAngle === null) {
      return;
    }
    serialRef.current?.send(`${currentMotorKey}SM${currentAngle}`);
  };

  if (!Object.keys(motors).length) {
    if (!portOpen) {
      return (
        <Stack gap={3} alignItems="center" sx={{ py: 4 }}>
          <Typography variant="h4" sx={{ color: "grey.600" }}>
            Waiting for connection...
          </Typography>
        </Stack>
      );
    }
    return (
      <Stack gap={3} alignItems="center" sx={{ py: 4 }}>
        <CircularProgress sx={{ color: "grey.600" }} />
        <Typography variant="h4" sx={{ color: "grey.600" }}>
          Waiting for motors list from controller...
        </Typography>
        <Typography sx={{ color: "grey.600" }}>
          Make sure to use "machine_readable" verbose mode
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack gap={0} sx={{ height: "100%", overflow: "hidden", width: "100%", bgcolor: "#fff" }}>
      {/* Motor Selection Tabs */}
      <Paper 
        elevation={0}
        sx={{ 
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "#fff",
          flexShrink: 0,
        }}
      >
        <Tabs 
          value={motorTabValue}
          onChange={(e, newValue) => setMotorTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            "& .MuiTab-root": {
              fontSize: "0.9rem",
              fontWeight: 500,
              textTransform: "none",
              minWidth: 120,
              py: 1,
              px: 2,
            },
            "& .Mui-selected": {
              fontWeight: 700,
            },
          }}
        >
          {motorKeys.map((key) => (
            <Tab 
              key={key}
              label={`Motor ${key}`}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Main Content Area */}
      {currentMotorKey && (
        <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", width: "100%" }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              borderBottom: "1px solid",
              borderColor: "divider",
              bgcolor: "#fff",
              flexShrink: 0,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              {motors[currentMotorKey]}
            </Typography>
            <FocBoolean
              command="E"
              label="Enabled"
              motorKey={currentMotorKey}
              offLabel="Off"
              onLabel="On"
              offValue="0"
              onValue="1"
            />
          </Box>

          {/* Content Split: Left = Parameter List, Right = Monitoring */}
          <Box 
            id="motor-split-container"
            sx={{ flex: 1, display: "flex", overflow: "hidden", gap: 0, width: "100%", userSelect: isDragging ? "none" : "auto" }}
          >
            {/* Left Panel - Parameter List */}
            <Box sx={{ 
              width: `${splitRatio * 100}%`,
              overflow: "auto",
              display: "flex",
              flexDirection: "column",
              flexShrink: 0,
              bgcolor: "#fff",
              borderRight: "1px solid",
              borderColor: "divider",
              transition: isDragging ? "none" : "width 0.2s",
            }}>
              <Stack
                sx={{
                  p: 3,
                  gap: 1,
                  "& .MuiAccordionSummary-root": {
                    minHeight: 34,
                    py: 0,
                  },
                  "& .MuiAccordionSummary-root.Mui-expanded": {
                    minHeight: 34,
                  },
                  "& .MuiAccordionSummary-content": {
                    my: 0.5,
                  },
                  "& .MuiAccordionSummary-content.Mui-expanded": {
                    my: 0.5,
                  },
                }}
              >
                <SimpleFocDigitalReadout
                  motorKey={currentMotorKey}
                  onAngleUpdate={(updatedMotorKey, angle) => {
                    setAngleByMotor((values) => ({
                      ...values,
                      [updatedMotorKey]: angle,
                    }));
                  }}
                />
                <JoggingControl motorKey={currentMotorKey} />

                <Accordion
                  expanded={expandedSections.targetSetting}
                  onChange={handleSectionToggle("targetSetting")}
                  sx={{ borderTop: "1px solid", borderColor: "divider" }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>Target Setting</Typography>
                      {renderSectionInfo("targetSetting")}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack gap={1} sx={{ ml: 1 }}>
                      <FocScalar
                        motorKey={currentMotorKey}
                        command=""
                        label="Target"
                        defaultMin={-20}
                        defaultMax={20}
                        step={0.01}
                        pollingEnabled={expandedSections.targetSetting}
                      />
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  expanded={expandedSections.stepGenerator}
                  onChange={handleSectionToggle("stepGenerator")}
                  sx={{ borderTop: "1px solid", borderColor: "divider" }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>Step Generator</Typography>
                      {renderSectionInfo("stepGenerator")}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack gap={1} sx={{ ml: 1 }}>
                      <StepGenerator motorKey={currentMotorKey} />
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  expanded={expandedSections.motionTorque}
                  onChange={handleSectionToggle("motionTorque")}
                  sx={{ borderTop: "1px solid", borderColor: "divider" }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>Motion & Torque Control</Typography>
                      {renderSectionInfo("motionTorque")}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack gap={1} sx={{ ml: 1 }}>
                      <MotorControlTypeSwitch motorKey={currentMotorKey} pollingEnabled={expandedSections.motionTorque} />
                      <TorqueControlTypeSwitch motorKey={currentMotorKey} pollingEnabled={expandedSections.motionTorque} />
                      <span>Frequency Setting:</span>
                      <FocScalar
                        motorKey={currentMotorKey}
                        command="CD"
                        label="Motion Downsample"
                        defaultMin={0}
                        defaultMax={1000}
                        step={1}
                        pollingEnabled={expandedSections.motionTorque}
                      />
                      <LoopTimingInfo motorKey={currentMotorKey} pollingEnabled={expandedSections.motionTorque} />
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* Motor Parameters Section (Collapsible) */}
                <Accordion
                  expanded={expandedSections.motorParameters}
                  onChange={handleSectionToggle("motorParameters")}
                  sx={{ borderTop: "1px solid", borderColor: "divider", order: 90 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>Motor Parameters</Typography>
                      {renderSectionInfo("motorParameters")}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack gap={1} sx={{ ml: 1 }}>
                      <FocScalar
                        motorKey={currentMotorKey}
                        command="R"
                        label="Resistance"
                        defaultMin={0}
                        defaultMax={100}
                        step={0.01}
                        pollingEnabled={expandedSections.motorParameters}
                      />
                      <FocScalar
                        motorKey={currentMotorKey}
                        command="K"
                        label="KV Rating"
                        defaultMin={0}
                        defaultMax={2000}
                        step={1}
                        pollingEnabled={expandedSections.motorParameters}
                      />
                      <FocScalar
                        motorKey={currentMotorKey}
                        command="IQ"
                        label="Inductance Q"
                        defaultMin={0}
                        defaultMax={1}
                        step={0.0001}
                        pollingEnabled={expandedSections.motorParameters}
                      />
                      <FocScalar
                        motorKey={currentMotorKey}
                        command="ID"
                        label="Inductance D"
                        defaultMin={0}
                        defaultMax={1}
                        step={0.0001}
                        pollingEnabled={expandedSections.motorParameters}
                      />
                      <Stack direction="row" spacing={0.8} alignItems="flex-end" sx={{ pt: 0.5 }}>
                        <TextField
                          label="Characterise Voltage"
                          value={characteriseVoltage}
                          onChange={(event) => setCharacteriseVoltage(event.target.value)}
                          variant="outlined"
                          size="small"
                          type="number"
                          inputProps={{ step: 0.1 }}
                          sx={{
                            flex: 1,
                            minWidth: "120px",
                            "& .MuiOutlinedInput-input": {
                              fontSize: "0.85rem",
                              padding: "6px 8px",
                            },
                            "& .MuiInputLabel-root": {
                              fontSize: "0.8rem",
                            },
                          }}
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleCharacteriseParams}
                          sx={{ minWidth: 138, height: 30 }}
                        >
                          Characterise Params
                        </Button>
                      </Stack>
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Accordion
                  expanded={expandedSections.sensor}
                  onChange={handleSectionToggle("sensor")}
                  sx={{ borderTop: "1px solid", borderColor: "divider", order: 91 }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>Sensor Align</Typography>
                      {renderSectionInfo("sensor")}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack gap={1} sx={{ ml: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleReinitFoc}
                        sx={{ alignSelf: "flex-start", minWidth: 110, height: 30 }}
                      >
                        Reinit FOC
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={handleZeroSensor}
                        disabled={angleByMotor[currentMotorKey] === undefined}
                        sx={{ alignSelf: "flex-start", minWidth: 120, height: 30 }}
                      >
                        Zero Sensor
                      </Button>
                      <FocScalar
                        motorKey={currentMotorKey}
                        command="SE"
                        label="Electrical Angle"
                        defaultMin={-6.2832}
                        defaultMax={6.2832}
                        step={0.0001}
                        pollingEnabled={expandedSections.sensor}
                      />
                      <FocScalar
                        motorKey={currentMotorKey}
                        command="SM"
                        label="Mechanical Zero Offset"
                        defaultMin={-6.2832}
                        defaultMax={6.2832}
                        step={0.0001}
                        pollingEnabled={expandedSections.sensor}
                      />
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* Limits Section (Collapsible) */}
                <Accordion
                  expanded={expandedSections.limits}
                  onChange={handleSectionToggle("limits")}
                  sx={{ borderTop: "1px solid", borderColor: "divider" }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>Limits</Typography>
                      {renderSectionInfo("limits")}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack gap={1} sx={{ ml: 1 }}>
                      <FocScalar
                        motorKey={currentMotorKey}
                        command="LU"
                        label="Voltage"
                        defaultMin={0}
                        defaultMax={30}
                        step={1}
                        pollingEnabled={expandedSections.limits}
                      />
                      <FocScalar
                        motorKey={currentMotorKey}
                        command="LV"
                        label="Velocity"
                        defaultMin={0}
                        defaultMax={30}
                        step={1}
                        pollingEnabled={expandedSections.limits}
                      />
                      <FocScalar
                        motorKey={currentMotorKey}
                        command="LC"
                        label="Current"
                        defaultMin={0}
                        defaultMax={30}
                        step={1}
                        pollingEnabled={expandedSections.limits}
                      />
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* Current PID Section (Collapsible) */}
                <Accordion
                  expanded={expandedSections.currentControl}
                  onChange={handleSectionToggle("currentControl")}
                  sx={{ borderTop: "1px solid", borderColor: "divider" }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>Current Control PID (Q/D Axis)</Typography>
                      {renderSectionInfo("currentControl")}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack gap={1} sx={{ ml: 1 }}>
                      <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary" }}>Q Axis</Typography>
                      <FocScalar motorKey={currentMotorKey} command="QP" label="Q-P" defaultMin={0} defaultMax={5} step={0.01} pollingEnabled={expandedSections.currentControl} />
                      <FocScalar motorKey={currentMotorKey} command="QI" label="Q-I" defaultMin={0} defaultMax={40} step={0.01} pollingEnabled={expandedSections.currentControl} />
                      <FocScalar motorKey={currentMotorKey} command="QD" label="Q-D" defaultMin={0} defaultMax={1} step={0.0001} pollingEnabled={expandedSections.currentControl} />
                      <FocScalar motorKey={currentMotorKey} command="QF" label="Q-Filter" defaultMin={0} defaultMax={0.2} step={0.001} pollingEnabled={expandedSections.currentControl} />
                      <FocScalar motorKey={currentMotorKey} command="QL" label="Q-Limit" defaultMin={0} defaultMax={24} step={0.1} pollingEnabled={expandedSections.currentControl} />
                      <FocScalar motorKey={currentMotorKey} command="QR" label="Q-Ramp" defaultMin={0} defaultMax={10000} step={1} pollingEnabled={expandedSections.currentControl} />
                      
                      <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mt: 1 }}>D Axis</Typography>
                      <FocScalar motorKey={currentMotorKey} command="DP" label="D-P" defaultMin={0} defaultMax={5} step={0.01} pollingEnabled={expandedSections.currentControl} />
                      <FocScalar motorKey={currentMotorKey} command="DI" label="D-I" defaultMin={0} defaultMax={40} step={0.01} pollingEnabled={expandedSections.currentControl} />
                      <FocScalar motorKey={currentMotorKey} command="DD" label="D-D" defaultMin={0} defaultMax={1} step={0.0001} pollingEnabled={expandedSections.currentControl} />
                      <FocScalar motorKey={currentMotorKey} command="DF" label="D-Filter" defaultMin={0} defaultMax={0.2} step={0.001} pollingEnabled={expandedSections.currentControl} />
                      <FocScalar motorKey={currentMotorKey} command="DL" label="D-Limit" defaultMin={0} defaultMax={24} step={0.1} pollingEnabled={expandedSections.currentControl} />
                      <FocScalar motorKey={currentMotorKey} command="DR" label="D-Ramp" defaultMin={0} defaultMax={10000} step={1} pollingEnabled={expandedSections.currentControl} />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: "text.secondary", mt: 1 }}>Auto-tuning</Typography>
                        
                      <Stack direction="row" spacing={0.8} alignItems="flex-end" sx={{ pt: 0.5 }}>
                        <TextField
                          label="Current Bandwidth"
                          value={currentPiBandwidth}
                          onChange={(event) => setCurrentPiBandwidth(event.target.value)}
                          variant="outlined"
                          size="small"
                          type="number"
                          inputProps={{ step: 0.1 }}
                          sx={{
                            flex: 1,
                            minWidth: "120px",
                            "& .MuiOutlinedInput-input": {
                              fontSize: "0.85rem",
                              padding: "6px 8px",
                            },
                            "& .MuiInputLabel-root": {
                              fontSize: "0.8rem",
                            },
                          }}
                        />
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={handleAutotuneCurrentPis}
                          sx={{ minWidth: 154, height: 30 }}
                        >
                          Autotune Current PIs
                        </Button>
                      </Stack>
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* Velocity PID Section (Collapsible) */}
                <Accordion
                  expanded={expandedSections.velocityControl}
                  onChange={handleSectionToggle("velocityControl")}
                  sx={{ borderTop: "1px solid", borderColor: "divider" }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>Velocity Control PID</Typography>
                      {renderSectionInfo("velocityControl")}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack gap={1} sx={{ ml: 1 }}>
                      <FocScalar motorKey={currentMotorKey} command="VP" label="V-P" defaultMin={0} defaultMax={5} step={0.01} pollingEnabled={expandedSections.velocityControl} />
                      <FocScalar motorKey={currentMotorKey} command="VI" label="V-I" defaultMin={0} defaultMax={40} step={0.01} pollingEnabled={expandedSections.velocityControl} />
                      <FocScalar motorKey={currentMotorKey} command="VD" label="V-D" defaultMin={0} defaultMax={1} step={0.0001} pollingEnabled={expandedSections.velocityControl} />
                      <FocScalar motorKey={currentMotorKey} command="VF" label="V-Filter" defaultMin={0} defaultMax={0.2} step={0.001} pollingEnabled={expandedSections.velocityControl} />
                      <FocScalar motorKey={currentMotorKey} command="VL" label="V-Limit" defaultMin={0} defaultMax={24} step={0.1} pollingEnabled={expandedSections.velocityControl} />
                      <FocScalar motorKey={currentMotorKey} command="VR" label="V-Ramp" defaultMin={0} defaultMax={10000} step={1} pollingEnabled={expandedSections.velocityControl} />
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                {/* Angle Control PID Section (Collapsible) */}
                <Accordion
                  expanded={expandedSections.angleControl}
                  onChange={handleSectionToggle("angleControl")}
                  sx={{ borderTop: "1px solid", borderColor: "divider" }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreIcon />}> 
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, color: "primary.main" }}>Angle Control PID</Typography>
                      {renderSectionInfo("angleControl")}
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack gap={1} sx={{ ml: 1 }}>
                      <FocScalar motorKey={currentMotorKey} command="AP" label="A-P" defaultMin={0} defaultMax={5} step={0.01} pollingEnabled={expandedSections.angleControl} />
                      <FocScalar motorKey={currentMotorKey} command="AI" label="A-I" defaultMin={0} defaultMax={40} step={0.01} pollingEnabled={expandedSections.angleControl} />
                      <FocScalar motorKey={currentMotorKey} command="AD" label="A-D" defaultMin={0} defaultMax={1} step={0.0001} pollingEnabled={expandedSections.angleControl} />
                      <FocScalar motorKey={currentMotorKey} command="AF" label="A-Filter" defaultMin={0} defaultMax={0.2} step={0.001} pollingEnabled={expandedSections.angleControl} />
                      <FocScalar motorKey={currentMotorKey} command="AL" label="A-Limit" defaultMin={0} defaultMax={24} step={0.1} pollingEnabled={expandedSections.angleControl} />
                    </Stack>
                  </AccordionDetails>
                </Accordion>

                <Dialog
                  open={!!infoDialogSection}
                  onClose={() => setInfoDialogSection(null)}
                  maxWidth="sm"
                  fullWidth
                >
                  <DialogTitle>
                    {infoDialogSection ? sectionTitles[infoDialogSection] : "Info"}
                  </DialogTitle>
                  <DialogContent>
                    {infoDialogSection && sectionInfo[infoDialogSection].content}
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={() => setInfoDialogSection(null)}>Close</Button>
                  </DialogActions>
                </Dialog>
              </Stack>
            </Box>

            {/* Draggable Divider */}
            <Box
              onMouseDown={() => setIsDragging(true)}
              sx={{
                width: "12px",
                bgcolor: isDragging ? "primary.main" : "action.hover",
                cursor: "col-resize",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
                "&:hover": {
                  bgcolor: "primary.main",
                  boxShadow: "0 0 8px rgba(0, 0, 0, 0.15)",
                },
                "&::before": {
                  content: '""',
                  width: "4px",
                  height: "40px",
                  bgcolor: isDragging ? "background.paper" : "text.disabled",
                  borderRadius: "2px",
                  transition: "all 0.2s",
                },
              }}
            />

            {/* Right Panel - Monitoring */}
            <Box sx={{ 
              width: `${(1 - splitRatio) * 100}%`,
              overflow: "auto",
              bgcolor: "#fff",
              p: 3,
              transition: isDragging ? "none" : "width 0.2s",
            }}>
              {/* <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Monitor</Typography> */}
              <Monitoring motorKey={currentMotorKey} />
            </Box>
          </Box>
        </Box>
      )}
    </Stack>
  );
};


import {
  Collapse,
  Backdrop,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Box } from "@mui/system";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useEffect, useState } from "react";
import { useAvailablePorts } from "../lib/useAvailablePorts";
import { useSerialPortLines } from "../lib/serialContext";
import { SimpleFocSerialPort } from "../simpleFoc/serial";
import { SerialCommandPrompt } from "./SerialCommandPrompt";
import { SerialOutputViewer } from "./SerialOutputViewer";

const MOTOR_DISCOVERY_REGEX = /^\??[A-Za-z0-9]:\s*motor\b.*$/i;

const BAUD_RATES = [
  300,
  1200,
  2400,
  4800,
  9600,
  14400,
  19200,
  38400,
  57600,
  74880,
  115200,
  230400,
  250000,
  256000,
  500000,
  921600,
  1000000,
  1500000,
  2000000,
  3000000,
];

export const SerialManager = ({
  onSetSerial,
  serial,
  ...other
}: {
  serial: SimpleFocSerialPort | null;
  onSetSerial: (serial: SimpleFocSerialPort | null) => any;
}) => {
  const [baudRate, setBaudRate] = useState(115200);
  const [loading, setLoading] = useState(false);
  const [showConnectionSection, setShowConnectionSection] = useState(true);
  const ports = useAvailablePorts();
  const serialLines = useSerialPortLines();

  const motorFound = serialLines.some(
    (line) =>
      line.type === "received" &&
      MOTOR_DISCOVERY_REGEX.test(line.content.trim())
  );

  useEffect(() => {
    if (motorFound) {
      setShowConnectionSection(false);
    }
  }, [motorFound]);

  const handleConnect = async (port?: SerialPort) => {
    const serial = new SimpleFocSerialPort(baudRate);
    setLoading(true);
    try {
      await serial.open(port);
      serial.send("#5");
      serial.send("@3");
      onSetSerial(serial);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await serial?.close();
    } finally {
      setLoading(false);
    }
  };

  const toggleConnectionSection = () => {
    setShowConnectionSection((visible) => !visible);
  };

  return (
    <Card 
      sx={{ 
        boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
      }} 
      {...other}
    >
      <Backdrop
        sx={{ color: "#fff", zIndex: (theme) => theme.zIndex.drawer + 1 }}
        open={loading}
      >
        <CircularProgress color="inherit" />
      </Backdrop>
      <Box
        role="button"
        tabIndex={0}
        aria-expanded={showConnectionSection}
        onClick={toggleConnectionSection}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            toggleConnectionSection();
          }
        }}
        sx={{
          px: 2,
          pt: 1.5,
          display: "flex",
          justifyContent: showConnectionSection ? "space-between" : "center",
          alignItems: "center",
          cursor: "pointer",
          userSelect: "none",
          borderRadius: 1,
          "&:hover": {
            bgcolor: "action.hover",
          },
        }}
      >
        {showConnectionSection ? (
          <>
            <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
              Connection
            </Typography>
            <Button
              size="small"
              variant="text"
              onClick={(event) => {
                event.stopPropagation();
                toggleConnectionSection();
              }}
              endIcon={<ExpandLessIcon />}
            >
              Collapse
            </Button>
          </>
        ) : (
          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ color: "primary.main" }}>
            <ExpandMoreIcon fontSize="small" />
            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
              Connection (click to expand)
            </Typography>
            <ExpandMoreIcon fontSize="small" />
          </Stack>
        )}
      </Box>
      <Collapse in={showConnectionSection}>
        <CardContent>
          <Stack direction={{ xs: "column", lg: "row" }} spacing={3}>
          <Stack gap={2.5} sx={{ minWidth: { lg: "300px" } }}>
            <TextField
              select
              label="Baud Rate"
              value={baudRate}
              onChange={(e) => setBaudRate(Number(e.target.value))}
              size="small"
              fullWidth
            >
              {BAUD_RATES.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <ButtonGroup variant="contained" fullWidth>
              <Button
                disabled={!!serial && !!serial.port}
                onClick={() => handleConnect()}
                sx={{ py: 1.2, fontSize: "0.95rem" }}
              >
                Connect
              </Button>
              <Button
                disabled={!serial || !serial.port}
                onClick={handleDisconnect}
                sx={{ py: 1.2, fontSize: "0.95rem" }}
              >
                Disconnect
              </Button>
            </ButtonGroup>
            {!!ports.length && (
              <Stack gap={1.5}>
                <Typography sx={{ color: "text.secondary", fontSize: "0.9rem", fontWeight: 500 }}>
                  Available Devices:
                </Typography>
                <Stack gap={1}>
                  {ports.map((port, i) => (
                    <Chip
                      key={i}
                      clickable
                      disabled={!!serial && !!serial.port}
                      label={`${port.getInfo().usbVendorId} - ${port.getInfo().usbProductId}`}
                      onClick={() => handleConnect(port)}
                      variant="outlined"
                      sx={{ justifyContent: "flex-start" }}
                    />
                  ))}
                </Stack>
              </Stack>
            )}
          </Stack>
          <Stack flex={1} gap={1.5} sx={{ minWidth: 0 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 600, color: "primary.main" }}>
                Serial Terminal
              </Typography>
            </Box>
            <Stack gap={2}>
              <SerialOutputViewer />
              <SerialCommandPrompt />
            </Stack>
          </Stack>
          </Stack>
        </CardContent>
      </Collapse>
    </Card>
  );
};

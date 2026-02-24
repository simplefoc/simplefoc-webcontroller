import {
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useSerialIntervalSender } from "../../lib/useSerialIntervalSender";
import { useSerialLineEvent } from "../../lib/useSerialLineEvent";

export const LoopTimingInfo = ({
  motorKey,
  compact = false,
  pollingEnabled = true,
}: {
  motorKey: string;
  compact?: boolean;
  pollingEnabled?: boolean;
}) => {
  const [torquePeriod, setTorquePeriod] = useState<number | null>(null);
  const [motionPeriod, setMotionPeriod] = useState<number | null>(null);

  const torqueCommand = `${motorKey}TT`;
  const motionCommand = `${motorKey}CT`;

  useSerialIntervalSender(torqueCommand, 5000, pollingEnabled);
  useSerialIntervalSender(motionCommand, 5000, pollingEnabled);

  useSerialLineEvent((line) => {
    if (line.content.startsWith(torqueCommand)) {
      const value = Number(line.content.slice(torqueCommand.length));
      if (!Number.isNaN(value)) {
        setTorquePeriod(value);
      }
    }
    if (line.content.startsWith(motionCommand)) {
      const value = Number(line.content.slice(motionCommand.length));
      if (!Number.isNaN(value)) {
        setMotionPeriod(value);
      }
    }
  });

  const torqueFrequency = useMemo(() => {
    if (torquePeriod === null || torquePeriod === 0) {
      return null;
    }
    return 1_000 / torquePeriod;
  }, [torquePeriod]);

  const motionFrequency = useMemo(() => {
    if (motionPeriod === null || motionPeriod === 0) {
      return null;
    }
    return 1_000 / motionPeriod;
  }, [motionPeriod]);

  return (
    <Stack gap={1} sx={{ ml: 1 }}>
      {compact && (
        <Typography variant="caption" sx={{ color: "text.secondary", fontSize: "0.72rem" }}>
          Torque loop: {torquePeriod === null ? "-" : `${torquePeriod.toFixed(0)} μs`} ({torqueFrequency === null ? "-" : `${torqueFrequency.toFixed(2)} kHz`})
          {"  |  "}
          Motion loop: {motionPeriod === null ? "-" : `${motionPeriod.toFixed(0)} μs`} ({motionFrequency === null ? "-" : `${motionFrequency.toFixed(2)} kHz`})
        </Typography>
      )}
      {!compact && (
      <TableContainer>
        <Table size="small" sx={{ minWidth: 220 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ py: 0.5, px: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Loop
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ py: 0.5, px: 1 }}>
                <Typography variant="caption" sx={{ fontWeight: 700 }}>
                  Frequency
                </Typography>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell sx={{ py: 0.5, px: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Torque loop (TT)
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ py: 0.5, px: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {torqueFrequency === null ? "-" : `${torqueFrequency.toFixed(2)} kHz`}
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ py: 0.5, px: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  Motion loop (CT)
                </Typography>
              </TableCell>
              <TableCell align="right" sx={{ py: 0.5, px: 1 }}>
                <Typography variant="caption" sx={{ color: "text.secondary" }}>
                  {motionFrequency === null ? "-" : `${motionFrequency.toFixed(2)} kHz`}
                </Typography>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
      )}
    </Stack>
  );
};

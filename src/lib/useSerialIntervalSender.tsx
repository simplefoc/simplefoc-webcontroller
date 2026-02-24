import { useEffect } from "react";
import { useSerialPort } from "./serialContext";

// send the command every X miliseconds and directly after the serial is connected
export const useSerialIntervalSender = (
  command: string,
  interval: number,
  enabled: boolean = true
) => {
  const serial = useSerialPort();

  useEffect(() => {
    if (!enabled || !serial?.port) {
      return;
    }

    serial.send(command);
    const intervalRef = setInterval(() => {
      if (serial.port) {
        serial.send(command);
      }
    }, interval);
    return () => {
      clearInterval(intervalRef);
    };
  }, [serial, command, interval, enabled]);
};

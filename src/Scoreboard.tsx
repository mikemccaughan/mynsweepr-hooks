import React, { useState, useEffect, useMemo, useRef } from "react";
import { Logger } from "./Logger";

export interface ScoreboardProps {
  difficulty?: string;
  isActive: boolean;
  remaining: number;
}

export const Scoreboard: React.FC<ScoreboardProps> = (
  props: ScoreboardProps
) => {
  const [seconds, setSeconds] = useState(0);
  const [formattedSeconds, setFormattedSeconds] = useState("00:00:00");
  const [isActive, setIsActive] = useState(props.isActive);
  const [remaining, setRemaining] = useState(props.remaining);
  const [best, setBest] = useState(
    localStorage.getItem(`best-${props.difficulty ?? "unknown"}`)
  );
  const [formattedBest, setFormattedBest] = useState("--:--:--");
  let isLoss = useRef(false);

  useEffect(() => {
    setIsActive(props.isActive);
    if (props.isActive) {
      setSeconds(0);
    } else if (seconds > 0) {
      isLoss.current = remaining > 0;
    }
  }, [props.isActive, remaining, seconds]);
  useEffect(() => {
    setRemaining(props.remaining);
    if (props.remaining === 0 && !props.isActive) {
      isLoss.current = false;
    }
  }, [props.remaining, props.isActive]);
  useEffect(() => {
    setBest(localStorage.getItem(`best-${props.difficulty ?? "unknown"}`));
    setIsActive(false);
    setSeconds(0);
  }, [props.difficulty]);

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", {
        hourCycle: "h23",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        timeZone: "UTC",
      }),
    []
  );

  useEffect(() => {
    if (isActive && seconds >= 0) {
      setBest(localStorage.getItem(`best-${props.difficulty ?? "unknown"}`));
    }
  }, [props.difficulty, isActive, seconds]);

  useEffect(() => {
    setFormattedSeconds(formatter.format(new Date(seconds * 1000)));
  }, [seconds, formatter]);

  useEffect(() => {
    let interval: number = -1;
    if (isActive) {
      interval = window.setInterval(() => {
        Logger.log(`setting seconds to ${seconds + 1}`);
        setSeconds((seconds: number) => seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      window.clearInterval(interval);
      if (best && !isNaN(+best) && +best < seconds) {
        return () => window.clearInterval(interval);
      }
      if (!isLoss.current) {
        setBest(seconds.toString());
      }
    }
    return () => window.clearInterval(interval);
  }, [isActive, seconds, formatter, best]);

  useEffect(() => {
    if (typeof best !== "string" || best == null || isNaN(+best)) {
      setFormattedBest("--:--:--");
    } else if (!isLoss.current) {
      setFormattedBest(formatter.format(new Date(+best * 1000)));
    }
  }, [best, formatter]);

  return (
    <aside>
      <span className="high-score">
        <span role="img" aria-label="high-score award">
          🥇
        </span>
        &nbsp;{formattedBest}
      </span>
      <span className="elapsed">
        <span role="img" aria-label="stopwatch timer">
          ⏱
        </span>
        &nbsp;{formattedSeconds}
      </span>
      <span className="remaining">
        <span role="img" aria-label="mine bomb">
          💣
        </span>
        &nbsp;{remaining}
      </span>
    </aside>
  );
};

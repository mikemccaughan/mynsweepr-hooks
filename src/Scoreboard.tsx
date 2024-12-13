import React, { useState, useEffect, useMemo, useRef } from "react";
import { Logger } from "./Logger";
import { IStorage, Store } from "./store";
import { Utils } from "./Utils";

export interface ScoreboardProps {
  difficulty?: string;
  isActive: boolean;
  remaining: number;
  size: string;
}

export const Scoreboard: React.FC<ScoreboardProps> = (
  props: ScoreboardProps
) => {
  const [seconds, setSeconds] = useState(0);
  const [formattedSeconds, setFormattedSeconds] = useState("00:00:00");
  const [isActive, setIsActive] = useState(props.isActive);
  const [remaining, setRemaining] = useState(props.remaining);
  const [formattedBest, setFormattedBest] = useState("--:--:--");
  const isLoss = useRef(false);
  const store: IStorage = useMemo(() => new Store('local', 'hm.mynsweepr.best'), []);
  const [best, setBest] = useState(
    Utils.parseSeconds(store.getItem(Utils.getCurrentDifficulty() ?? '9:9x9'))
  );

  useEffect(() => {
    setIsActive(props.isActive);
    if (!props.isActive && props.remaining === 0 && seconds !== 0) {
      Logger.info('Scoreboard: useEffect[props.isActive, props.remaining, seconds] setting seconds to 0');
      if (!isLoss.current && (best === Number.NEGATIVE_INFINITY || best > seconds)) {
        setBest(seconds);
      }
      setSeconds(0);
    } else if (seconds > 0) {
      isLoss.current = props.remaining > 0;
    }
  }, [props.isActive, props.remaining, seconds, best, isLoss]);

  useEffect(() => {
    setRemaining(props.remaining);
    if (props.remaining === 0 && !props.isActive) {
      isLoss.current = false;
    }
  }, [props.remaining, props.isActive]);

  useEffect(() => {
    setIsActive(false);
  }, [props.difficulty, store]);

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
    if (!isLoss.current && seconds > 0 && (best === Number.NEGATIVE_INFINITY || best > seconds)) {
      setBest(seconds);
    }
  }, [props.difficulty, isLoss, isActive, seconds, best]);

  useEffect(() => {
    const ms = seconds * 1000;
    const dt = new Date(ms);
    const fs = formatter.format(dt);
    setFormattedSeconds(fs);
  }, [seconds, formatter]);

  useEffect(() => {
    let interval = -1;
    if (isActive) {
      interval = window.setInterval(() => {
        setSeconds((seconds: number) => seconds + 1);
      }, 1000);
    } else if (!isActive && seconds !== 0) {
      window.clearInterval(interval);
      if (best && !isNaN(+best) && +best < seconds) {
        return () => window.clearInterval(interval);
      }
      if (!isLoss.current && (best === Number.NEGATIVE_INFINITY || best > seconds)) {
        setBest(seconds);
      }
    }
    return () => window.clearInterval(interval);
  }, [isActive, seconds, formatter, best]);

  useEffect(() => {
    if (typeof best !== "string" || best == null || isNaN(+best)) {
      setFormattedBest("--:--:--");
    } else if (!isLoss.current) {
      const bestFormatted = best === 0 ? "--:--:--" : formatter.format(new Date(+best * 1000));
      const bestKey = Utils.getCurrentDifficulty() ?? '9:9x9';
      store.setItem(bestKey, bestFormatted);
      setFormattedBest(bestFormatted);
    }
  }, [best, formatter, store]);

  useEffect(() => {
    if (!isActive && seconds !== 0 && remaining === 0) {
      Logger.info('Scoreboard: useEffect[isActive, remaining, seconds] setting seconds to 0');
      if ((best === Number.NEGATIVE_INFINITY || best > seconds)) {
        setBest(seconds);
      }
      setSeconds(0);
    }
  }, [isActive, seconds, remaining, best])

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

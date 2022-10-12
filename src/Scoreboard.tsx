import React, { useState, useEffect } from 'react';

export interface ScoreboardProps {
    isActive: boolean;
    remaining: number;
    size: string;
    checkHighScore: boolean;
}

export const Scoreboard: React.FC<ScoreboardProps> = (props: ScoreboardProps) => {
    const [seconds, setSeconds] = useState(0);
    const [isActive, setIsActive] = useState(props.isActive);
    const [remaining, setRemaining] = useState(props.remaining);
    const [highScore, setHighScore] = useState(new Map<string, number>());
    const [size, setSize] = useState(props.size);

    const highScoreKey = 'mynsweepr-highscore';

    const getHighScore = (): number => {
        if (highScore?.size && highScore.get(size) != null) {
            return highScore.get(size) ?? Infinity;
        } else if (localStorage.getItem(highScoreKey)) {
            const fromStore = new Map<string, number>(Object.entries(JSON.parse(localStorage.getItem(highScoreKey) ?? '{}')));
            if (fromStore?.size && fromStore.get(size) != null) {
                setHighScore(fromStore);
                return fromStore.get(size) ?? Infinity;
            }
        }

        return Infinity;
    }

    useEffect(() => {
        let interval = -1;
        if (isActive) {
            interval = window.setInterval(() => {
                setSeconds((seconds: number) => seconds + 1);
            }, 1000);
        } else if (!isActive && seconds !== 0) {
            window.clearInterval(interval);
            setSeconds(0);
        }
        return () => window.clearInterval(interval);
    }, [isActive, seconds]);

    useEffect(() => {
        setRemaining(props.remaining);
    }, [props.remaining]);

    useEffect(() => {
        setIsActive(props.isActive);
    }, [props.isActive]);

    useEffect(() => {
        setSize(props.size);
    }, [props.size]);

    useEffect(() => {
        if (props.checkHighScore) {
            const currentHighScore = getHighScore();
            if (currentHighScore > seconds && seconds > 0) {
                setHighScore(prev => {
                    prev = prev ?? new Map<string, number>();
                    prev.set(size, seconds);
                    localStorage.setItem(highScoreKey, JSON.stringify(Object.fromEntries(prev.entries())));
                    return prev;
                });
            }
        }
    }, [props.checkHighScore]);

    const formatter = new Intl.DateTimeFormat('en-US', {
        hourCycle: 'h23',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC'
    });
    function formatSeconds(s: number) {
        const sDate = new Date(s * 1000);
        return formatter.format(sDate);
    }

    return (
        <aside>
            <span className="high-score"><span role="img" aria-label="high-score award">🥇</span>&nbsp;{formatSeconds(highScore.get(size) ?? 0)}</span>
            <span className="elapsed"><span role="img" aria-label="stopwatch timer">⏱</span>&nbsp;{formatSeconds(seconds)}</span>
            <span className="remaining"><span role="img" aria-label="mine bomb">💣</span>&nbsp;{remaining}</span>
        </aside>
    );
};
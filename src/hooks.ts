import { useRef, useEffect } from 'react';

export function usePrevious(value: string | number) {
    const ref = useRef<string | number>();
    useEffect(() => {
        ref.current = value;
    })
    return ref.current;
}
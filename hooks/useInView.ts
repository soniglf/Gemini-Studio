
import { useState, useEffect, useRef } from 'react';

export const useInView = (options?: IntersectionObserverInit) => {
    const [isInView, setIsInView] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const target = ref.current;
        if (!target) return;

        const observer = new IntersectionObserver(([entry]) => {
            setIsInView(entry.isIntersecting);
        }, options);

        observer.observe(target);

        return () => {
            if (target) observer.unobserve(target);
        };
    }, [options]);

    return { ref, isInView };
};

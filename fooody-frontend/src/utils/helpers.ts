export function formatPrice(p: number): string {
  return `₹${p}`;
}

export function cn(...classes: (string | false | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let t: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

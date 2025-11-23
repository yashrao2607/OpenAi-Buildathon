import type { SVGProps } from "react";

export const Icons = {
  logo: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M14 9.5V6.75a.75.75 0 0 0-.75-.75H4.5A.75.75 0 0 0 3.75 6.75V18c0 .414.336.75.75.75h4.5" />
      <path d="M9 15h3" />
      <path d="M12 12h3" />
      <path d="M9 9h3" />
      <path d="M17.5 18a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
      <path d="M21 21a2.5 2.5 0 1 1 0-5 2.5 2.5 0 0 1 0 5Z" />
      <path d="M17.5 13v-3a1.5 1.5 0 0 1 1.5-1.5h0a1.5 1.5 0 0 1 1.5 1.5v3" />
      <path d="m14 14-1-1" />
      <path d="m21.5 12.5-1-1" />
    </svg>
  ),
  wheat: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M2 22s1-1 2-2c1-1 2-2 3-2s2 1 3 2 2.5 2 2.5 2" />
      <path d="M14 14s-1-1.5-2-2.5c-1-1-2-2.5-2-2.5" />
      <path d="M14 9.5c0-1-.5-2-1.5-2.5S11 6 11 6" />
      <path d="M14 6s-1.5 0-2.5 1s-2 2-2 2" />
      <path d="M14 14a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
      <path d="M14 6.5h-1.5" />
      <path d="M11 9s-1.5 0-2.5 1-2 2-2 2" />
      <path d="m15 12-1-1" />
      <path d="M20.5 8.5-19 20" />
    </svg>
  ),
  sprout: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M7 20h10" />
      <path d="M10 20c0-3.3 1-6 4-6" />
      <path d="M12 12A4 4 0 0 1 8 8c0-2 2-4 4-4s4 2 4 4a4 4 0 0 1-4 4Z" />
      <path d="M12 12v8" />
    </svg>
  ),
  google: (props: SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  ),
};

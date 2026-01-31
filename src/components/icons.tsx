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
      <path d="M16 21v-5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v5" />
      <path d="M12 14v7" />
      <path d="M12 3v1" />
      <path d="M5 5.07A7.5 7.5 0 0 1 12 3a7.5 7.5 0 0 1 7 2.07" />
      <path d="M3 10a4.5 4.5 0 0 1 9 0" />
      <path d="M12 10a4.5 4.5 0 0 1 9 0" />
      <path d="M12 3a7.5 7.5 0 0 1 7 2.07" />
      <path d="M3 10h18" />
    </svg>
  ),
};

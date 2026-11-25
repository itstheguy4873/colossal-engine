/*
 * rc-dock 4.1's published declarations still reference `React.ReactChild`,
 * which React 19 removed. Re-expose the alias so its `.d.ts` files type-check.
 * Runtime behaviour is unaffected; this is a type-only compatibility shim.
 */
import type { ReactElement } from "react";

declare module "react" {
	type ReactChild = ReactElement | string | number;
}

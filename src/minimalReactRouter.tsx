import React, { useState } from "react";
import { help } from "./helpers";

export function useRouter(): JSX.Element {
  help();
  return useState(<div>foos</div>)[0];
}

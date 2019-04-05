import { useCallback, useMemo, useReducer, useRef } from "react";

type SetState<T> = (newState: T) => void;
type GetState<T> = () => T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ActionFunction<T, U extends any[], V> = (
  setState: SetState<T>,
  getState: GetState<T>,
  ...args: U
) => V;

function reducer<T>(state: T, newState: T): T {
  return newState;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useStateActions<T, U extends any[], V>(
  initialState: T,
  ...actions: ActionFunction<T, U, V>[]
): [T, ...((this: null, ...args: U) => V)[]] {
  const [state, dispatch]: [T, React.Dispatch<T>] = useReducer(
    reducer,
    initialState
  );
  const stateRef = useRef(state);
  const getState = useCallback(() => stateRef.current, [stateRef]);
  const setState = useCallback(
    (newState: T) => {
      stateRef.current = newState;
      return dispatch(newState);
    },
    [stateRef]
  );
  const boundActions = useMemo(
    () => actions.map(action => action.bind(null, setState, getState)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setState, getState, ...actions]
  );
  return [state, ...boundActions];
}

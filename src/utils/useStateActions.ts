import { useMemo, useReducer, useRef } from "react";

type SetState<T> = (newState: T) => void;
type GetState<T> = () => T;
type ActionFunction<T, U extends any[], V> = (
  setState: SetState<T>,
  getState: GetState<T>,
  ...args: U
) => V;

function reducer<T>(state: T, newState: T): T {
  return newState;
}

export function useStateActions<T, U extends any[], V>(
  initialState: T,
  ...actions: ActionFunction<T, U, V>[]
): [T, ...((this: null, ...args: U) => V)[]] {
  const [state, dispatch]: [T, React.Dispatch<T>] = useReducer(
    reducer,
    initialState
  );
  const ref = useRef({
    state,
    getState: () => ref.state,
    setState(newState: T) {
      ref.state = newState;
      dispatch(newState);
    }
  }).current;
  const boundActions = useMemo(
    () => actions.map(action => action.bind(null, ref.setState, ref.getState)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [...actions]
  );
  return [state, ...boundActions];
}

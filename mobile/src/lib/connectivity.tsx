import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import NetInfo, { type NetInfoState } from "@react-native-community/netinfo";

/**
 * Connectivity, app-wide.
 *
 * One NetInfo subscription for the whole app — screens read `isConnected`
 * instead of each guessing from their own failures. `null` means "not known
 * yet" (first check pending); screens treat that as online so nothing
 * flashes on boot.
 */
const ConnectivityContext = createContext<{ isConnected: boolean | null }>({ isConnected: null });

export function ConnectivityProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<NetInfoState | null>(null);

  useEffect(() => {
    const sub = NetInfo.addEventListener(setState);
    NetInfo.fetch().then(setState).catch(() => {});
    return () => sub();
  }, []);

  return (
    <ConnectivityContext.Provider value={{ isConnected: state?.isConnected ?? null }}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivity() {
  return useContext(ConnectivityContext);
}

/** True only when the OS is sure there is no connection. */
export function useIsOffline() {
  const { isConnected } = useConnectivity();
  return isConnected === false;
}

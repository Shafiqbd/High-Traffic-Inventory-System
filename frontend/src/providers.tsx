import React from "react";
import { Provider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";
import { store } from "./store";

// Lazy load persistor to allow Vite chunk optimization
const loadPersistor = () =>
  import("./store/persistor").then((m) => m.persistor);

type Props = {
  children: React.ReactNode;
};

const Providers = ({ children }: Props) => {
  const [persistor, setPersistor] = React.useState<any>(null);

  React.useEffect(() => {
    loadPersistor().then(setPersistor);
  }, []);

  if (!persistor) {
    return null;
  }

  return (
    <Provider store={store}>
      <PersistGate persistor={persistor}>{children}</PersistGate>
    </Provider>
  );
};

export default Providers;

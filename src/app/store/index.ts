import { useDispatch, useSelector } from 'react-redux';

import { devToolsEnhancer } from '@redux-devtools/remote';
import { Action, AnyAction, ThunkAction, combineReducers, configureStore } from '@reduxjs/toolkit';
import { atomWithStore } from 'jotai-redux';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from 'redux-persist';
import { PersistPartial } from 'redux-persist/es/persistReducer';

import { persistConfig } from '@shared/storage/redux-pesist';

import { analyticsSlice } from './analytics/analytics.slice';
import { appPermissionsSlice } from './app-permissions/app-permissions.slice';
import { stxChainSlice } from './chains/stx-chain.slice';
import { inMemoryKeySlice } from './in-memory-key/in-memory-key.slice';
import { keySlice } from './keys/key.slice';
import { bitcoinKeysSlice } from './ledger/bitcoin-key.slice';
import { networksSlice } from './networks/networks.slice';
import { ordinalsSlice } from './ordinals/ordinals.slice';
import { settingsSlice } from './settings/settings.slice';
import { submittedTransactionsSlice } from './submitted-transactions/submitted-transactions.slice';
import { broadcastActionTypeToOtherFramesMiddleware } from './utils/broadcast-action-types';

export interface RootState {
  analytics: ReturnType<typeof analyticsSlice.reducer>;
  appPermissions: ReturnType<typeof appPermissionsSlice.reducer>;
  chains: {
    stx: ReturnType<typeof stxChainSlice.reducer>;
  };
  ledger: {
    bitcoin: ReturnType<typeof bitcoinKeysSlice.reducer>;
  };
  ordinals: ReturnType<typeof ordinalsSlice.reducer>;
  inMemoryKeys: ReturnType<typeof inMemoryKeySlice.reducer>;
  keys: ReturnType<typeof keySlice.reducer>;
  networks: ReturnType<typeof networksSlice.reducer>;
  submittedTransactions: ReturnType<typeof submittedTransactionsSlice.reducer>;
  settings: ReturnType<typeof settingsSlice.reducer>;
}

const appReducer = combineReducers({
  analytics: analyticsSlice.reducer,
  appPermissions: appPermissionsSlice.reducer,
  chains: combineReducers({
    stx: stxChainSlice.reducer,
  }),
  ledger: combineReducers({
    bitcoin: bitcoinKeysSlice.reducer,
  }),
  ordinals: ordinalsSlice.reducer,
  inMemoryKeys: inMemoryKeySlice.reducer,
  keys: keySlice.reducer,
  networks: networksSlice.reducer,
  submittedTransactions: submittedTransactionsSlice.reducer,
  settings: settingsSlice.reducer,
});

function rootReducer(state: RootState | undefined, action: Action) {
  if (action.type === 'keys/signOut') return appReducer(undefined, action);
  return appReducer(state, action);
}

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: getDefaultMiddleware => [
    ...getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
    broadcastActionTypeToOtherFramesMiddleware,
  ],
  enhancers:
    process.env.WALLET_ENVIRONMENT === 'development'
      ? [
          devToolsEnhancer({
            hostname: 'localhost',
            port: 8000,
            realtime: true,
            suppressConnectErrors: false,
          }),
        ]
      : undefined,
});

export const persistor = persistStore(store);

export type AppThunk<ReturnType = void> = ThunkAction<ReturnType, RootState, unknown, AnyAction>;

type AppDispatch = typeof store.dispatch & ((action: AppThunk) => void);

export const useAppDispatch: () => AppDispatch = useDispatch;

export const storeAtom = atomWithStore(store);

const selectHasRehydrated = (state: RootState & PersistPartial) => state._persist.rehydrated;

export function useHasStateRehydrated() {
  return useSelector(selectHasRehydrated);
}

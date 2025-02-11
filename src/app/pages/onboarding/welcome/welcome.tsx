import { useCallback, useEffect, useState } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { RouteUrls } from '@shared/route-urls';

import { useAnalytics } from '@app/common/hooks/analytics/use-analytics';
import { useOnboardingState } from '@app/common/hooks/auth/use-onboarding-state';
import { useKeyActions } from '@app/common/hooks/use-key-actions';
import { useRouteHeader } from '@app/common/hooks/use-route-header';
import { doesBrowserSupportWebUsbApi, isPopupMode, whenPageMode } from '@app/common/utils';
import { openIndexPageInNewTab } from '@app/common/utils/open-in-new-tab';
import { useHasUserRespondedToAnalyticsConsent } from '@app/store/settings/settings.selectors';

import { WelcomeLayout } from './welcome.layout';

export function WelcomePage() {
  const hasResponded = useHasUserRespondedToAnalyticsConsent();
  const navigate = useNavigate();
  const { decodedAuthRequest } = useOnboardingState();
  const analytics = useAnalytics();
  const keyActions = useKeyActions();

  const [isGeneratingWallet, setIsGeneratingWallet] = useState(false);

  useRouteHeader(<></>);

  const startOnboarding = useCallback(async () => {
    if (isPopupMode()) {
      openIndexPageInNewTab(RouteUrls.Onboarding);
      window.close();
      return;
    }
    setIsGeneratingWallet(true);
    keyActions.generateWalletKey();
    void analytics.track('generate_new_secret_key');
    if (decodedAuthRequest) {
      navigate(RouteUrls.SetPassword);
    }
    navigate(RouteUrls.BackUpSecretKey);
  }, [keyActions, analytics, decodedAuthRequest, navigate]);

  useEffect(() => {
    if (!hasResponded) navigate(RouteUrls.RequestDiagnostics);
    return () => setIsGeneratingWallet(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageModeRoutingAction = (url: string) =>
    whenPageMode({
      full() {
        navigate(url);
      },
      popup() {
        void openIndexPageInNewTab(url);
        window.close();
      },
    });

  const supportsWebUsbAction = pageModeRoutingAction(
    RouteUrls.Onboarding + '/stacks/' + RouteUrls.ConnectLedger
  );
  const doesNotSupportWebUsbAction = pageModeRoutingAction(
    RouteUrls.Onboarding + '/' + RouteUrls.LedgerUnsupportedBrowser
  );

  const restoreWallet = pageModeRoutingAction(RouteUrls.SignIn);

  return (
    <>
      <WelcomeLayout
        tagline="Bitcoin for the rest of us"
        subheader="Leather is the only Bitcoin wallet you need to tap into the emerging Bitcoin economy"
        isGeneratingWallet={isGeneratingWallet}
        onSelectConnectLedger={() =>
          doesBrowserSupportWebUsbApi() ? supportsWebUsbAction() : doesNotSupportWebUsbAction()
        }
        onStartOnboarding={() => startOnboarding()}
        onRestoreWallet={() => restoreWallet()}
      />
      <Outlet />
    </>
  );
}

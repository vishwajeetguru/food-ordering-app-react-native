import * as React from 'react';
import { Platform } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';

const RECAPTCHA_PARAMS_URL = (apiKey: string) =>
  `https://identitytoolkit.googleapis.com/v1/recaptchaParams?key=${apiKey}`;

function buildHtml(siteKey: string): string {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <script src="https://www.gstatic.com/recaptcha/enterprise.js?render=${siteKey}"></script>
</head>
<body style="margin:0"></body>
</html>`;
}

function tokenScript(siteKey: string): string {
  return `(function(){
    try {
      if (typeof grecaptcha === 'undefined' || !grecaptcha.enterprise) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ok:false, error:'reCAPTCHA not loaded'}));
        return true;
      }
      grecaptcha.enterprise.ready(function(){
        grecaptcha.enterprise.execute('${siteKey}', {action:'phone_sign_in'}).then(function(token){
          window.ReactNativeWebView.postMessage(JSON.stringify({ok:true, token:token}));
        }).catch(function(e){
          window.ReactNativeWebView.postMessage(JSON.stringify({ok:false, error:String(e)}));
        });
      });
    } catch(e) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ok:false, error:String(e)}));
    }
    return true;
  })();`;
}

export interface RecaptchaHandle {
  getToken: () => Promise<string>;
}

export const RecaptchaWebView = React.forwardRef<RecaptchaHandle>((_props, ref) => {
  const webViewRef = React.useRef<WebView>(null);
  const [siteKey, setSiteKey] = React.useState<string | null>(null);
  const pendingRef = React.useRef<{ resolve: (t: string) => void; reject: (e: Error) => void } | null>(null);
  const loadedRef = React.useRef(false);

  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
    if (!apiKey) return;
    fetch(RECAPTCHA_PARAMS_URL(apiKey))
      .then((r) => r.json())
      .then((j) => {
        if (j?.recaptchaSiteKey) setSiteKey(j.recaptchaSiteKey);
        else console.warn('[recaptcha] no site key in response', j);
      })
      .catch((e) => console.warn('[recaptcha] failed to fetch site key', e?.message));
  }, []);

  React.useImperativeHandle(ref, () => ({
    getToken: () =>
      new Promise<string>((resolve, reject) => {
        if (Platform.OS === 'web') {
          // On web, auth.service uses the SDK RecaptchaVerifier instead.
          resolve('web');
        }
        if (!siteKey) {
          reject(new Error('reCAPTCHA not ready – check network and Firebase API key'));
          return;
        }
        if (pendingRef.current) {
          reject(new Error('reCAPTCHA request already in progress'));
          return;
        }
        pendingRef.current = { resolve, reject };
        const timer = setTimeout(() => {
          if (pendingRef.current) {
            pendingRef.current.reject(new Error('reCAPTCHA timeout – please try again'));
            pendingRef.current = null;
          }
        }, 25000);
        // Keep the timeout from keeping the promise alive after resolve
        (pendingRef.current as any)._timer = timer;
        if (loadedRef.current) {
          webViewRef.current?.injectJavaScript(tokenScript(siteKey));
        } else {
          console.warn('[recaptcha] webview not loaded yet, retrying shortly');
          setTimeout(() => {
            if (pendingRef.current) {
              loadedRef.current = true;
              webViewRef.current?.injectJavaScript(tokenScript(siteKey));
            }
          }, 800);
        }
      }),
  }));

  const handleMessage = (event: WebViewMessageEvent) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      const pending = pendingRef.current;
      if (!pending) return;
      clearTimeout((pending as any)._timer);
      pendingRef.current = null;
      if (data?.ok && data?.token) pending.resolve(data.token);
      else pending.reject(new Error(data?.error || 'reCAPTCHA failed'));
    } catch {
      const pending = pendingRef.current;
      if (pending) {
        pendingRef.current = null;
        pending.reject(new Error('reCAPTCHA failed'));
      }
    }
  };

  if (Platform.OS === 'web' || !siteKey) return null;

  return (
    <WebView
      ref={webViewRef}
      source={{ html: buildHtml(siteKey) }}
      onMessage={handleMessage}
      onLoadEnd={() => {
        loadedRef.current = true;
      }}
      originWhitelist={['*']}
      javaScriptEnabled
      domStorageEnabled
      style={{ position: 'absolute', width: 1, height: 1, opacity: 0, left: -1000, top: -1000 }}
    />
  );
});

export default RecaptchaWebView;

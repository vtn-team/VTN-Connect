import { PUSH_PUBLIC_KEY } from "../NodeJSServer/js/config/config.js";

if (/iPhone|iPad|iPod/.test(navigator.userAgent)) {
    // iOSデバイスの確認
    if (!window.matchMedia('(display-mode: standalone)').matches) {
        // ホーム画面からアクセスしていない場合
        const guideBanner = document.createElement('div');
        guideBanner.innerHTML = `
            <div style="position: fixed; bottom: 10px; width: 100%; background: #f9f9f9; 
                        padding: 10px; text-align: center; border: 1px solid #ddd;">
                <p>このサイトをホーム画面に追加するには、Safariの共有ボタンをタップし、「ホーム画面に追加」を選択してください。</p>
                <button id="closeBanner" style="margin-top: 5px;">閉じる</button>
            </div>`;
        document.body.appendChild(guideBanner);

        document.getElementById('closeBanner').addEventListener('click', () => {
            guideBanner.remove();
        });
    }
}

if ("serviceWorker" in navigator && "PushManager" in window) {
    navigator.serviceWorker
        .register("serviceworker.js")
        .then(function (swReg) {
            console.log("Service Workerが登録されました", swReg);

            return swReg.pushManager.getSubscription().then(function (subscription) {
                if (subscription === null) {
                    const vapidPublicKey = PUSH_PUBLIC_KEY;
                    const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);

                    return swReg.pushManager
                        .subscribe({
                            userVisibleOnly: true,
                            applicationServerKey: convertedVapidKey,
                        })
                        .then((subscription) => {
                            console.log("新規に購読開始します");
                            console.log(JSON.stringify(subscription)); // 新しい購読情報をコンソールに出力
                        });
                } else {
                    // 既に購読済み
                    console.log("既に購読済みです");
                    console.log(JSON.stringify(subscription)); // 購読情報をコンソールに出力
                }
            });
        })
        .catch(function (error) {
            console.error("Service Workerエラー", error);
        });
}

function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

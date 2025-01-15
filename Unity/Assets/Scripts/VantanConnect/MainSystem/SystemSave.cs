using System;

namespace VTNConnect
{
    /// <summary>
    /// システム情報保存クラス
    /// </summary>
    [Serializable]
    public class SystemSaveData
    {
        public string Version = "0.2";          //バージョン情報

        public bool IsUseQRCode = false;        //コネクト処理用のQRコードを表示する
        public bool IsDebugConnect = false;     //コネクト処理をローカル実行する
        public int UseConnectUserId = 0;        //デバッグ用のコネクト処理に使用するテスト用ID
        //ここまでコネクト処理

#if AIGAME_IMPLEMENT
#endif

#if AIGAME_IMPLEMENT
#endif
    }
}
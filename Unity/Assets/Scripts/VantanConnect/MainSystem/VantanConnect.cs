using Cysharp.Threading.Tasks;
using UnityEngine;

namespace VTNConnect
{
    /// <summary>
    /// ステータスコード
    /// </summary>
    public enum VC_StatusCode
    {
        //OK
        OK = 0, //OK

        //Error
        NetworkError = 101,     //ネットワーク環境に問題がある
        SerrverError = 102,     //サーバ内エラーが発生している
    };


    /// <summary>
    /// バンタンコネクト メインインタフェース
    /// NOTE: すべてここからアクセスできます。
    /// </summary>
    public class VantanConnect
    {
        //公開インタフェース

        /// <summary>環境変数を返す</summary>
        static public IEnvironment Environment => _instance._environment;

        /// <summary>システム変数を返す</summary>
        static public SystemSaveData SystemSave => _instance._systemSave;

        /// <summary>ゲーム中かどうかを返す</summary>
        public bool IsInGame => _instance._gameStateSave.IsInGame;

        #region ゲームAPI

        //非同期関数
        /// <summary>ゲーム開始</summary>
        static async public UniTask<VC_StatusCode> GameStart() { return await _instance.GameStartImplement(); }

        /// <summary>ゲーム終了</summary>
        static async public UniTask<VC_StatusCode> GameEnd() { return await _instance.GameEndImplement(); }


        //コールバック関数
        public delegate void ExecuteCallback(VC_StatusCode code);   //戻りを受け取る関数
        delegate UniTask<VC_StatusCode> ExecuteFunction();          //実行関数

        /// <summary>ゲーム開始</summary>
        static public void GameStart(ExecuteCallback callback) { _instance.CallbackAction(callback, _instance.GameStartImplement); }

        /// <summary>ゲーム終了</summary>
        static public void GameEnd(ExecuteCallback callback) { _instance.CallbackAction(callback, _instance.GameEndImplement); }

        #endregion

        #region イベント
        /// <summary>イベントを受信するクラスを登録(何個登録しても良い)</summary>
        static public void RegisterEventReceiver(IVantanConnectEventReceiver receiver) { _instance.RegisterReceiver(receiver); }

        /// <summary>イベントを送信(イベントデータを作って送信)</summary>
        static public void SendEvent(EventData data) { _instance.SendVCEvent(data); }

        /// <summary>イベントを送信(IDのみで送信)</summary>
        static public void SendEvent(EventDefine eventId) { _instance.SendVCEvent(eventId); }

        #endregion

        /*
         *
         *
        //公開インタフェース

        /// <summary>WebSocketのアドレスを取得する</summary>
        public UniTask<string> GetAddress() { return _getAddress.Request(); }

        /// <summary>ユーザーデータ取得</summary>
        public UniTask<GetUserResult> GetUser(int userId) { return _getUser.Request(userId); }

        /// <summary>開催中のゲームの情報(所得</summary>
        public UniTask<GetActiveGameUsersResult> GetActiveGameUsers() { return _getGameUsers.Request(); }

        /// <summary>実行済/実行中の特定のゲームの情報を取得</summary>
        public UniTask<GetGameUsersResult> GetGameUsers(string gameHash) { return _getGameUsers.Request(gameHash); }


#if AIGAME_IMPLEMENT
        //AIゲーム用

        /// <summary>ゲーム開始(AIゲーム用)</summary>
        public UniTask<GameStartAIGameResult> GameStartAIGame() { return _gameStartAI.Request(this); }
        /// <summary>ゲーム終了(AIゲーム用)</summary>
        public UniTask<GameEndAIGameResult> GameEndAIGame() { return _gameEndAI.Request(this); }
        /// <summary>ゲーム結果の記録(AIゲーム用)</summary>
        public void StoreUserResult(int userId, bool gameResult, bool isMissionClear) { StackUser(userId, gameResult, isMissionClear); }
#else
    /// <summary>ゲーム開始(バンコネ一般ゲーム用)</summary>
    public UniTask<GameStartResult> GameStart(int userId = 0) { return _gameStart.Request(this, userId); }

    /// <summary>ゲーム終了(バンコネ一般ゲーム用)</summary>
    public UniTask<GameEndResult> GameEnd(bool gameResult) { return _gameEnd.Request(this, gameResult); }
#endif
         * 
         */

        #region 内部処理用
        static VantanConnect _instance = new VantanConnect();
        VantanConnect() { }
        
        //それぞれの処理委譲系
        IEnvironment _environment = new ProductionEnvironment();
        EventSystem _eventSystem = new EventSystem();
        GameStateSave _gameStateSave = new GameStateSave();
        LinkageSyatem _linkageSystem = new LinkageSyatem();
        WebSocketEventManager _wsManager = null;
        SystemViewer _systemView = null;
        SystemSaveData _systemSave = null;

        //APIリスト
        APIGetWSAddressImplement _getAddress = new APIGetWSAddressImplement();
        APIGetUserImplement _getUser = new APIGetUserImplement();
        APIGetGameUsersImplement _getGameUsers = new APIGetGameUsersImplement();

#if AIGAME_IMPLEMENT
        APIGameStartAIGameImplement _gameStartAI = new APIGameStartAIGameImplement();
        APIGameEndAIGameImplement _gameEndAI = new APIGameEndAIGameImplement();
#else
        APIGameStartImplement _gameStart = new APIGameStartImplement();
        APIGameEndImplement _gameEnd = new APIGameEndImplement();
#endif

#if AIGAME_IMPLEMENT
    
#else

#endif


        //内部インタフェース

        //エントリポイント(ゲーム開始時にコールされる)
        [RuntimeInitializeOnLoadMethod(RuntimeInitializeLoadType.AfterSceneLoad)]
        static void Run()
        {
            Debug.Log("VantanConnect Setup Ready");

            //システムセーブのロード
            var systemSave = LocalData.Load<SystemSaveData>("SystemSave.json");
            if(systemSave == null)
            {
                systemSave = new SystemSaveData();
            }
            _instance._systemSave = systemSave;

            GameObject obj = new GameObject("VCMain");
            _instance._wsManager = obj.AddComponent<WebSocketEventManager>();
            _instance._systemView = obj.AddComponent<SystemViewer>();
            GameObject.DontDestroyOnLoad(obj);

            //イベント登録系など
            _instance._wsManager.SetEventSystem(_instance._eventSystem);
            _instance._eventSystem.RegisterReceiver(_instance._linkageSystem);
        }

        //ゲーム管理系

        async UniTask<VC_StatusCode> GameStartImplement()
        {
            return await GameStartAIGame();
        }

        async UniTask<VC_StatusCode> GameEndImplement()
        {
            return await GameEndAIGame();
        }

        void CallbackAction(ExecuteCallback func, ExecuteFunction action)
        {
            action?.Invoke().ContinueWith((VC_StatusCode c) => func?.Invoke(c));
        }

        async UniTask<VC_StatusCode> GameStartAIGame()
        {
            var result = await _gameStartAI.Request();
            var status = APIUtility.PacketCheck(result);
            if (status != VC_StatusCode.OK) return status;

            _gameStateSave.StartAIGame(result);
            return VC_StatusCode.OK;
        }

        async UniTask<VC_StatusCode> GameEndAIGame()
        {
            var result = await _gameEndAI.Request(GameStateSave.CreateAIGameResult(_gameStateSave));
            var status = APIUtility.PacketCheck(result);
            if (status != VC_StatusCode.OK) return status;

            _gameStateSave.EndAIGame();
            return VC_StatusCode.OK;
        }


        //イベント系
        void RegisterReceiver(IVantanConnectEventReceiver receiver)
        {
            _eventSystem.RegisterReceiver(receiver);
        }

        void SendVCEvent(EventDefine evCode)
        {
            EventData data = new EventData(evCode);
            SendVCEvent(data);
        }
        void SendVCEvent(EventData d)
        {
            _eventSystem.SendEvent(d);
        }

        #endregion
    }
}
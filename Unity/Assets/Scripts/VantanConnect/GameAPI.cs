using Cysharp.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class GameAPI
{
    static GameAPI _instance = new GameAPI();

    //公開インタフェース

    /// <summary>WebSocketのアドレスを取得する</summary>
    static public UniTask<string> GetAddress(){ return _instance._getAddress.Request(); }

    /// <summary>ユーザーデータ取得</summary>
    static public UniTask<GetUserResult> GetUser(int userId){ return _instance._getUser.Request(userId); }

    /// <summary>開催中のゲームの情報(所得</summary>
    static public UniTask<GetActiveGameUsersResult> GetActiveGameUsers() { return _instance._getGameUsers.Request(); }

    /// <summary>実行済/実行中の特定のゲームの情報を取得</summary>
    static public UniTask<GetGameUsersResult> GetGameUsers(string gameHash) { return _instance._getGameUsers.Request(gameHash); }

    /// <summary>ゲーム中かどうかを返す</summary>
    static public bool IsInGame => _instance._gameHash != null;

#if !AIGAME_IMPLEMENT
    /// <summary>ゲーム開始(バンコネ一般ゲーム用)</summary>
    static public UniTask<GameStartResult> GameStart(int userId = 0) { return _instance._gameStart.Request(_instance, userId); }

    /// <summary>ゲーム終了(バンコネ一般ゲーム用)</summary>
    static public UniTask<GameEndResult> GameEnd(bool gameResult) { return _instance._gameEnd.Request(_instance, gameResult); }

#else
    //AIゲーム用

    /// <summary>ゲーム開始(AIゲーム用)</summary>
    static public UniTask<GameStartAIGameResult> GameStartAIGame() { return _instance._gameStartAI.Request(_instance); }
    /// <summary>ゲーム終了(AIゲーム用)</summary>
    static public UniTask<GameEndAIGameResult> GameEndAIGame() { return _instance._gameEndAI.Request(_instance); }
    /// <summary>ゲーム結果の記録(AIゲーム用)</summary>
    static public void StoreUserResult(int userId, bool gameResult, bool isMissionClear) { _instance.StackUser(userId, gameResult, isMissionClear); }
#endif

    #region 内部処理用

    //APIリスト
    GetAddressImplement _getAddress = new GetAddressImplement();
    GetUserImplement _getUser = new GetUserImplement();
    GetGameUsersImplement _getGameUsers = new GetGameUsersImplement();

#if !AIGAME_IMPLEMENT
    GameStartImplement _gameStart = new GameStartImplement();
    GameEndImplement _gameEnd = new GameEndImplement();
#else
    GameStartAIGameImplement _gameStartAI = new GameStartAIGameImplement();
    GameEndAIGameImplement _gameEndAI = new GameEndAIGameImplement();
#endif

    //保存用
    string _gameHash = null;
    UserData[] _users = null;
    List<UserDataResultSave> _saveData = new List<UserDataResultSave>();

    //内部インタフェース
    public void StoreGameHash(string gameHash)
    {
        _gameHash = gameHash;
    }
    public string GetGameHash()
    {
        return _gameHash;
    }
    public void ReleaseGameHash()
    {
        _gameHash = null;
    }


#if AIGAME_IMPLEMENT
    public void ReleaseAIGame()
    {
        _gameHash = null;
        _saveData.Clear();
    }

    public void StoreAIGameUsers(UserData[] users)
    {
        _users = users;
        _saveData.Clear();
    }

    public UserDataResultSave[] GetUserSave()
    {
        if (_users.Length != _saveData.Count)
        {
            foreach (var u in _users)
            {
                if (_saveData.Where(s => s.UserId == u.UserId).Count() > 0) continue;

                _saveData.Add(new UserDataResultSave()
                {
                    UserId = u.UserId,
                    GameResult = false,
                    MissionClear = false
                });
            }
        }
        return _saveData.ToArray();
    }

    void StackUser(int userId, bool gameResult, bool isMissionClear)
    {
        bool isFind = false;
        foreach(var u in _users)
        {
            if (u.UserId != userId) continue;

            _saveData.Add(new UserDataResultSave()
            {
                UserId = userId,
                GameResult = gameResult,
                MissionClear = isMissionClear
            });
            isFind = true;
            break;
        }
        if(!isFind)
        {
            Debug.LogWarning("保存対象のユーザが見つかりませんでした");
        }
    }
#endif
#endregion
}


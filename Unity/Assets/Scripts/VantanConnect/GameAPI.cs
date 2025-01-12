using Cysharp.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

public class GameAPI
{
    static GameAPI _instance = new GameAPI();

    //APIリスト
    GetAddressImplement _getAddress = new GetAddressImplement();
    GameStartImplement _gameStart = new GameStartImplement();
    GameEndImplement _gameEnd = new GameEndImplement();

    GameStartAIGameImplement _gameStartAI = new GameStartAIGameImplement();
    GameEndAIGameImplement _gameEndAI = new GameEndAIGameImplement();


    //公開インタフェース
    static public UniTask<string> GetAddress() { return _instance._getAddress.Request(); }
    static public UniTask<GameStartResult> GameStart(int userId = 0) { return _instance._gameStart.Request(_instance, userId); }
    static public UniTask<GameEndResult> GameEnd(bool gameResult) { return _instance._gameEnd.Request(_instance, gameResult); }

    //AIゲーム用
    static public UniTask<GameStartAIGameResult> GameStartAIGame() { return _instance._gameStartAI.Request(_instance); }
    static public UniTask<GameEndAIGameResult> GameEndAIGame() { return _instance._gameEndAI.Request(_instance); }
    static public void StoreUserResult(int userId, bool gameResult, bool isMissionClear) { _instance.StackUser(userId, gameResult, isMissionClear); }
    static public bool IsInGame => _instance._gameHash != null;


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
}


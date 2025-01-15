using Cysharp.Threading.Tasks;
using System.Collections.Generic;
using System.Linq;
using UnityEngine;

namespace VTNConnect
{
    /// <summary>
    /// インゲームの情報保存クラス
    /// </summary>
    public class GameStateSave
    {
        public bool IsInGame => _gameHash != null;

        string _gameHash = null;
        UserData[] _users = null;

#if AIGAME_IMPLEMENT
        List<UserDataResultSave> _saveData = new List<UserDataResultSave>();
#endif

#if AIGAME_IMPLEMENT
        static public GameEndAIGameRequest CreateAIGameResult(GameStateSave save)
        {
            var req = new GameEndAIGameRequest();
            req.GameHash = save._gameHash;
            req.UserResults = save.GetUserSave();
            return req;
        }

        public void StartAIGame(GameStartAIGameResult result)
        {
            _gameHash = result.GameHash;
            _users = result.GameUsers;
            _saveData.Clear();
        }
        public void EndAIGame()
        {
            _gameHash = null;
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
            foreach (var u in _users)
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
            if (!isFind)
            {
                Debug.LogWarning("保存対象のユーザが見つかりませんでした");
            }
        }
#endif
    }
}
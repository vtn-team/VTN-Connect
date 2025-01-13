using Cysharp.Threading.Tasks;
using System;
using UnityEngine;

#if AIGAME_IMPLEMENT

/// <summary>
/// リクエストパラメータ
/// </summary>
[Serializable]
public class GameEndAIGameRequest
{
    public string GameHash;
    public UserDataResultSave[] UserResults;
}


/// <summary>
/// 戻り値
/// </summary>
[Serializable]
public class GameEndAIGameResult
{
    public int Status;
    public GameInfo[] GameInfo;
}


/// <summary>
/// ゲーム開始(AIゲーム用)
/// NOTE: https://candle-stoplight-544.notion.site/API-def8a39d6b524c0fbf9e1a552d4b5428#16a39cbfbab9809c83d5efe15acd0e52
/// </summary>
public class GameEndAIGameImplement
{
    /// <summary>
    /// AIゲーム用
    /// </summary>
    /// <returns>AIゲーム開始用パラメータ</returns>
    async public UniTask<GameEndAIGameResult> Request(GameAPI instance)
    {
        var param = new GameEndAIGameRequest(){
            GameHash = instance.GetGameHash(),
            UserResults = instance.GetUserSave()
        };
        string request = String.Format("{0}/ai/gameend", ProjectSettings.APIServerURI);
        string json = await Network.WebRequest.PostRequest(request, param);
        var ret = JsonUtility.FromJson<GameEndAIGameResult>(json);
        instance.ReleaseGameHash();
        instance.ReleaseAIGame();
        return ret;
    }
}
#endif
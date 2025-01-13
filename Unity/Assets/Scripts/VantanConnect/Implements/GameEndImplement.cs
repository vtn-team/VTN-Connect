using Cysharp.Threading.Tasks;
using System;
using UnityEngine;


/// <summary>
/// リクエストパラメータ
/// </summary>
[Serializable]
public class GameEndRequest
{
    public string GameHash;
    public bool GameResult;
}


/// <summary>
/// 戻り値
/// </summary>
[Serializable]
public class GameEndResult
{
    public int Status;
}

/// <summary>
/// ゲーム終了
/// NOTE: https://candle-stoplight-544.notion.site/API-def8a39d6b524c0fbf9e1a552d4b5428#17539cbfbab980e3863fe9aad40d2afc
/// </summary>
public class GameEndImplement
{
    /// <summary>
    /// 通常ゲーム用
    /// </summary>
    /// <returns>特になし</returns>
    async public UniTask<GameEndResult> Request(GameAPI instance, bool gameResult)
    {
        var param = new GameEndRequest() { GameHash = instance.GetGameHash(), GameResult = gameResult };
        string request = String.Format("{0}/gameend", ProjectSettings.APIServerURI);
        string json = await Network.WebRequest.PostRequest(request, param);
        var ret = JsonUtility.FromJson<GameEndResult>(json);
        instance.ReleaseGameHash();
        return ret;
    }
}

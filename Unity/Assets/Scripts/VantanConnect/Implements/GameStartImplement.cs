using Cysharp.Threading.Tasks;
using System;
using UnityEngine;

/// <summary>
/// リクエストパラメータ
/// </summary>
public class GameStartRequest
{
    public int GameId;
    public int UserId;
}

/// <summary>
/// 戻り値
/// </summary>
public class GameStartResult
{
    public int Status;
    public string GameHash;
    public GameInfo[] GameInfo;
}

/// <summary>
/// ゲーム開始
/// NOTE: https://candle-stoplight-544.notion.site/API-def8a39d6b524c0fbf9e1a552d4b5428#17539cbfbab980afa7acc523767846a3
/// </summary>
public class GameStartImplement
{
    /// <summary>
    /// 通常ゲーム用
    /// </summary>
    /// <returns>特になし</returns>
    async public UniTask<GameStartResult> Request(GameAPI instance, int userId = 0)
    {
        var param = new GameStartRequest() { GameId = ProjectSettings.GameID, UserId = userId };
        string request = String.Format("{0}/gamestart", ProjectSettings.APIServerURI);
        string json = await Network.WebRequest.PostRequest(request, param);
        var ret = JsonUtility.FromJson<GameStartResult>(json);
        instance.StoreGameHash(ret.GameHash);
        return ret;
    }
}

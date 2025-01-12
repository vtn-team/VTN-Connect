using Codice.CM.SEIDInfo;
using Cysharp.Threading.Tasks;
using System;
using UnityEngine;


/// <summary>
/// ���N�G�X�g�p�����[�^
/// </summary>
public class GameEndRequest
{
    public string GameHash;
    public bool GameResult;
}


/// <summary>
/// �߂�l
/// </summary>
public class GameEndResult
{
    public int Status;
    public string GameHash;
    public GameInfo[] GameInfo;
}

/// <summary>
/// �Q�[���I��
/// NOTE: https://candle-stoplight-544.notion.site/API-def8a39d6b524c0fbf9e1a552d4b5428#17539cbfbab980e3863fe9aad40d2afc
/// </summary>
public class GameEndImplement
{
    /// <summary>
    /// �ʏ�Q�[���p
    /// </summary>
    /// <returns>���ɂȂ�</returns>
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

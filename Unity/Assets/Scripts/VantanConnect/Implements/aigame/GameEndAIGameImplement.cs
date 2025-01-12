using Cysharp.Threading.Tasks;
using System;
using UnityEngine;


/// <summary>
/// ���N�G�X�g�p�����[�^
/// </summary>
public class GameEndAIGameRequest
{
    public string GameHash;
    public UserDataResultSave[] UserResults;
}


/// <summary>
/// �߂�l
/// </summary>
public class GameEndAIGameResult
{
    public int Status;
    public GameInfo[] GameInfo;
}


/// <summary>
/// �Q�[���J�n(AI�Q�[���p)
/// NOTE: https://candle-stoplight-544.notion.site/API-def8a39d6b524c0fbf9e1a552d4b5428#16a39cbfbab9809c83d5efe15acd0e52
/// </summary>
public class GameEndAIGameImplement
{
    /// <summary>
    /// AI�Q�[���p
    /// </summary>
    /// <returns>AI�Q�[���J�n�p�p�����[�^</returns>
    async public UniTask<GameEndAIGameResult> Request(GameAPI instance)
    {
        var param = new GameEndAIGameRequest(){
            GameHash = instance.GetGameHash(),
            UserResults = instance.GetUserSave()
        };
        string request = String.Format("{0}/ai/gamestart", ProjectSettings.APIServerURI);
        string json = await Network.WebRequest.PostRequest(request, param);
        var ret = JsonUtility.FromJson<GameEndAIGameResult>(json);
        instance.ReleaseGameHash();
        instance.ReleaseAIGame();
        return ret;
    }
}
